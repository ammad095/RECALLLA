# FILE PATH: recalla-backend/models/agent.py
# PURPOSE: ReAct-style agent loop with bulletproof recovery for tool_use_failed errors.
#          Now includes argument type coercion to handle Llama returning "5" instead of 5.

import json
import ast
import re
from typing import List, Dict, Any
from models.groq_client import get_groq_client, DEFAULT_MODEL
from tools import ALL_TOOLS, ALL_FUNCTIONS, tools_for
from auth.context import get_current_channel
import datetime

MAX_ITERATIONS = 6


# ─── ARG COERCION ─────────────────────────────────────────────────────────
# Llama sometimes returns "5" (string) when a tool schema expects integer 5.
# This walks the tool's JSON schema and coerces values to match.

def _coerce_value(value, expected_type):
    """Try to coerce value to the expected JSON-schema type."""
    if value is None:
        return None

    if expected_type == "integer":
        if isinstance(value, bool):
            return int(value)
        if isinstance(value, int):
            return value
        if isinstance(value, float):
            return int(value)
        if isinstance(value, str):
            try:
                return int(value.strip())
            except (ValueError, AttributeError):
                try:
                    return int(float(value.strip()))
                except (ValueError, AttributeError):
                    return value

    if expected_type == "number":
        if isinstance(value, (int, float)):
            return value
        if isinstance(value, str):
            try:
                return float(value.strip())
            except (ValueError, AttributeError):
                return value

    if expected_type == "boolean":
        if isinstance(value, bool):
            return value
        if isinstance(value, str):
            v = value.strip().lower()
            if v in ("true", "1", "yes"):
                return True
            if v in ("false", "0", "no"):
                return False

    if expected_type == "string":
        if isinstance(value, str):
            return value
        return str(value)

    return value


def coerce_args_to_schema(tool_name: str, args: dict) -> dict:
    """Look up the tool schema in ALL_TOOLS and coerce arg types to match."""
    if not isinstance(args, dict):
        return args

    schema = None
    for tool in ALL_TOOLS:
        fn = tool.get("function", {})
        if fn.get("name") == tool_name:
            schema = fn.get("parameters", {})
            break

    if not schema:
        return args

    properties = schema.get("properties", {})
    coerced = {}
    for key, value in args.items():
        if key in properties:
            expected = properties[key].get("type")
            coerced[key] = _coerce_value(value, expected)
        else:
            coerced[key] = value
    return coerced


# ─── FAILED-GENERATION PARSING ────────────────────────────────────────────
# When Groq raises tool_use_failed, e.body contains failed_generation as a
# string like:  <function=search_emails>{"query": "...", "limit": "5"}</function>
# We extract the tool name and JSON args, then coerce them.

def parse_failed_function_call_from_exception(exc) -> tuple:
    """Returns (tool_name, args_dict) or (None, None) on failure."""
    try:
        body = getattr(exc, "body", None) or {}
        err = body.get("error", {}) if isinstance(body, dict) else {}
        failed = err.get("failed_generation", "")
        if not failed:
            return None, None

        # Match <function=name>{...}</function>
        m = re.search(r"<function=([^>]+)>(.*?)</function>", failed, re.DOTALL)
        if not m:
            return None, None

        tool_name = m.group(1).strip()
        raw_args = m.group(2).strip()

        # Try multiple parsing strategies
        args = _try_parse_args(raw_args)
        if args is None:
            return tool_name, None

        return tool_name, args
    except Exception as parse_err:
        print(f"[agent] failed to parse failed_generation: {parse_err}")
        return None, None


def _try_parse_args(raw: str):
    """Try several strategies to coerce raw text into a dict."""
    # Strategy 1: plain JSON
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strategy 2: replace single quotes with double quotes (but preserve apostrophes inside words)
    cleaned = re.sub(r"(?<!\w)'|'(?!\w)", '"', raw)
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Strategy 3: Python literal eval (handles single quotes natively)
    try:
        result = ast.literal_eval(raw)
        if isinstance(result, dict):
            return result
    except (ValueError, SyntaxError):
        pass

    # Strategy 4: extract key-value pairs with regex
    try:
        result = {}
        # Match "key": "value" or "key": value
        matches = re.findall(r'"(\w+)"\s*:\s*("([^"]*)"|(\d+\.?\d*)|true|false|null)', raw)
        for m in matches:
            key = m[0]
            if m[2]:           # quoted string
                result[key] = m[2]
            elif m[3]:         # number
                if "." in m[3]:
                    result[key] = float(m[3])
                else:
                    result[key] = int(m[3])
        if result:
            return result
    except Exception:
        pass

    return None


# ─── MAIN AGENT LOOP ─────────────────────────────────────────────────────
def run_agent(user_message: str, conversation_history: List[Dict[str, str]] = None) -> Dict[str, Any]:
    """
    Run the agent with ReAct-style tool calling.
    Returns: { "response": str, "tool_calls": List[dict], "action_card": Optional[dict] }
    """
    if conversation_history is None:
        conversation_history = []

    # Desktop tools act on the host machine, which is only meaningful for a
    # request made from it. Anything arriving over WhatsApp gets the cloud set.
    channel = get_current_channel()
    active_tools, active_functions = tools_for(channel)

    client = get_groq_client()
    if client is None:
        return {
            "response": "Groq client unavailable - check GROQ_API_KEY in .env",
            "tool_calls": [],
            "action_card": None,
            "history": [],
        }

    # System prompt with current time + warnings about apostrophes / quoting
    now_iso = datetime.datetime.now().isoformat()
    # Describe only the tools this channel actually has. Advertising desktop
    # tools over WhatsApp made the model attempt open_app, get rejected by the
    # API, fall through to the no-tools retry, and then report "Opened VS Code"
    # having done nothing at all. Claiming an action happened is worse than
    # refusing it.
    if channel == "web":
        desktop_section = """Opening things splits in two, and picking the wrong one sends the request
to the wrong machine:
  - open_link  — websites and online services (Netflix, YouTube, Instagram,
    Maps, Spotify). Opens on the device in the user's hand. Use this by
    default; on a phone it opens the real app.
  - open_app   — programs installed on the HOST computer (VS Code, the file
    manager), plus creating folders and scaffolding projects there.

Two things about the host-computer actions:
  - They happen on the computer running Recalla. If the user is on a phone or
    tablet, the folder or app appears there, not on the device in their hand.
    Say so if it seems relevant.
  - You cannot run arbitrary commands, delete anything, or touch files outside
    the user's home folder. If asked, explain that plainly rather than trying."""
    else:
        desktop_section = """Use open_link for websites and online services (Netflix, YouTube, Instagram,
Maps, Spotify). It returns a link the user taps, which opens the real app on
their phone.

You are NOT connected to the user's computer in this conversation. You cannot
open applications such as VS Code, create folders, or start projects from
here. If asked, say plainly that this only works from the Recalla app on that
computer. Never claim to have done it."""

    system_prompt = f"""You are Recalla, an AI meeting assistant with tool access.

Current datetime: {now_iso}
Default timezone: Asia/Karachi

You have tools to manage reminders, calendar events, and emails for the user.

You can also search everything the user has ever recorded. search_memory finds
passages from their past meetings by meaning, not keywords, so it works even
when the transcript never used the words in the question.

{desktop_section}

You are also a general assistant. If the user asks a question that no tool can
answer — general knowledge, explanations, advice, casual conversation — just
answer it directly from your own knowledge. Do NOT call a tool in that case.
Only use tools for reminders, calendar events, email, and meeting memory.

CRITICAL RULES:
1. Always call tools using the proper tool_calls format, never as inline text like <function=...>.
2. For integer parameters (limit, duration, etc.), pass them as numbers (5), NOT strings ("5").
3. Avoid apostrophes in email bodies - they cause JSON parsing issues.
4. Emails are two steps, never one:
   a) draft_email creates a preview. It does NOT send.
   b) When the user confirms — "send it", "send as is", "yes", "go ahead" — call
      send_email_draft. Leave draft_id empty and it sends the most recent draft.
   Never ask the user to repeat the recipient, subject or body at the confirm
   step: the draft already holds them. If you are unsure whether a draft exists,
   call send_email_draft anyway; it will tell you if there is nothing pending.
5. Anything about the past belongs to search_memory. If the user asks what was
   said, decided, agreed, promised or discussed — or refers to "the meeting",
   "last week", "we talked about" — search FIRST and answer from what comes
   back. Never say you have no record of something without searching for it.
   When you answer from memory, name the source: the meeting title and who
   said it. If the search returns nothing, say so plainly rather than guessing.
6. Be concise and direct in your responses.
"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    tool_calls_made = []
    action_card = None

    def _history():
        """
        Conversation so far, minus the system prompt, safe to JSON-encode and
        send straight back on the next request.

        Without this the agent forgets the previous turn entirely — the user
        says "send it" and there is no draft in context to send.
        """
        out = []
        for m in messages[1:]:
            if not isinstance(m, dict):
                continue
            item = {"role": m.get("role")}
            if m.get("content") is not None:
                item["content"] = m["content"]
            if m.get("tool_calls"):
                item["tool_calls"] = m["tool_calls"]
            if m.get("tool_call_id"):
                item["tool_call_id"] = m["tool_call_id"]
            out.append(item)
        # Keep the tail only, so a long chat cannot grow past the context window.
        return out[-24:]

    for iteration in range(MAX_ITERATIONS):
        try:
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                tools=active_tools,
                tool_choice="auto",
                temperature=0.1,
                max_tokens=800,
            )
        except Exception as e:
            # ─── BULLETPROOF RECOVERY ───────────────────────────────────
            # If Groq returned tool_use_failed, parse the failed_generation
            # and try to execute the tool with coerced args.
            err_str = str(e)
            if "tool_use_failed" in err_str:
                print(f"[agent] Recovering from tool_use_failed (iter {iteration})")
                tool_name, args = parse_failed_function_call_from_exception(e)

                if tool_name and args is not None:
                    # COERCE arg types to match the tool schema
                    args = coerce_args_to_schema(tool_name, args)
                    print(f"[agent] Recovered tool call: {tool_name}({args})")

                    if tool_name in active_functions:
                        try:
                            result = active_functions[tool_name](**args)
                            tool_calls_made.append({"name": tool_name, "args": args, "result": result})

                            # Capture action card if this was an email draft / calendar event
                            if isinstance(result, dict):
                                if result.get("type") in ("email_preview", "calendar_event", "reminder_created"):
                                    action_card = result

                            # Add tool result to conversation and continue
                            messages.append({
                                "role": "assistant",
                                "content": None,
                                "tool_calls": [{
                                    "id": f"recovered_{iteration}",
                                    "type": "function",
                                    "function": {"name": tool_name, "arguments": json.dumps(args)},
                                }],
                            })
                            messages.append({
                                "role": "tool",
                                "tool_call_id": f"recovered_{iteration}",
                                "content": json.dumps(result, default=str),
                            })
                            continue
                        except Exception as exec_err:
                            print(f"[agent] Recovered call execution failed: {exec_err}")
                            return {
                                "response": f"Sorry, I had trouble executing that. ({exec_err})",
                                "tool_calls": tool_calls_made,
                                "action_card": action_card,
                            }

                # No recoverable tool call. This is the common case for a plain
                # question ("explain cloud computing") — Llama emits a malformed
                # function blob even though no tool is needed. Ask again with
                # tools switched off so it simply answers.
                print("[agent] No tool to recover; retrying without tools")
                try:
                    plain = client.chat.completions.create(
                        model=DEFAULT_MODEL,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=800,
                    )
                    text = plain.choices[0].message.content or ""
                    messages.append({"role": "assistant", "content": text})
                    return {
                        "response": text,
                        "tool_calls": tool_calls_made,
                        "action_card": action_card,
                        "history": _history(),
                    }
                except Exception as plain_err:
                    print(f"[agent] Tool-free retry also failed: {plain_err}")
                    return {
                        "response": "Sorry, I had trouble processing that request. Please try rephrasing it.",
                        "tool_calls": tool_calls_made,
                        "action_card": action_card,
                        "history": _history(),
                    }

            # Non-recoverable error
            print(f"[agent] Unrecoverable error: {e}")
            raise

        msg = response.choices[0].message

        # No tool calls = final answer
        if not msg.tool_calls:
            messages.append({"role": "assistant", "content": msg.content or ""})
            return {
                "response": msg.content or "",
                "tool_calls": tool_calls_made,
                "action_card": action_card,
                "history": _history(),
            }

        # Execute each tool call
        messages.append({
            "role": "assistant",
            "content": msg.content,
            "tool_calls": [tc.model_dump() for tc in msg.tool_calls],
        })

        for tc in msg.tool_calls:
            fn_name = tc.function.name
            try:
                fn_args = json.loads(tc.function.arguments)
            except json.JSONDecodeError:
                fn_args = {}

            # COERCE arg types before execution
            fn_args = coerce_args_to_schema(fn_name, fn_args)

            if fn_name in active_functions:
                try:
                    result = active_functions[fn_name](**fn_args)
                    tool_calls_made.append({"name": fn_name, "args": fn_args, "result": result})

                    if isinstance(result, dict):
                        if result.get("type") in ("email_preview", "calendar_event", "reminder_created"):
                            action_card = result

                except Exception as exec_err:
                    result = {"error": str(exec_err)}
                    print(f"[agent] Tool {fn_name} raised: {exec_err}")
            else:
                result = {"error": f"Unknown tool: {fn_name}"}

            messages.append({
                "role": "tool",
                "tool_call_id": tc.id,
                "content": json.dumps(result, default=str),
            })

    # Max iterations reached
    return {
        "response": "I worked on that but couldn't complete it within the limit. Try a simpler request?",
        "tool_calls": tool_calls_made,
        "action_card": action_card,
        "history": _history(),
    }