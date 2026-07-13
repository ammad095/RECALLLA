# FILE PATH: recalla-backend/models/agent.py
# PURPOSE: ReAct-style agent loop with bulletproof recovery for tool_use_failed errors.
#          Now includes argument type coercion to handle Llama returning "5" instead of 5.

import json
import ast
import re
from typing import List, Dict, Any
from models.groq_client import get_groq_client, DEFAULT_MODEL
from tools import ALL_TOOLS, ALL_FUNCTIONS
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

    client = get_groq_client()
    if client is None:
        return {
            "response": "Groq client unavailable - check GROQ_API_KEY in .env",
            "tool_calls": [],
            "action_card": None,
        }

    # System prompt with current time + warnings about apostrophes / quoting
    now_iso = datetime.datetime.now().isoformat()
    system_prompt = f"""You are Recalla, an AI meeting assistant with tool access.

Current datetime: {now_iso}
Default timezone: Asia/Karachi

You have tools to manage reminders, calendar events, and emails for the user.

CRITICAL RULES:
1. Always call tools using the proper tool_calls format, never as inline text like <function=...>.
2. For integer parameters (limit, duration, etc.), pass them as numbers (5), NOT strings ("5").
3. Avoid apostrophes in email bodies - they cause JSON parsing issues.
4. For emails: NEVER call send_email directly. Always use draft_email first to show the user
   a preview, then they will confirm sending via a separate Send button.
5. Be concise and direct in your responses.
"""

    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    tool_calls_made = []
    action_card = None

    for iteration in range(MAX_ITERATIONS):
        try:
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=messages,
                tools=ALL_TOOLS,
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

                    if tool_name in ALL_FUNCTIONS:
                        try:
                            result = ALL_FUNCTIONS[tool_name](**args)
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

                # Recovery failed - return graceful message
                return {
                    "response": "Sorry, I had trouble processing that request. Please try rephrasing it.",
                    "tool_calls": tool_calls_made,
                    "action_card": action_card,
                }

            # Non-recoverable error
            print(f"[agent] Unrecoverable error: {e}")
            raise

        msg = response.choices[0].message

        # No tool calls = final answer
        if not msg.tool_calls:
            return {
                "response": msg.content or "",
                "tool_calls": tool_calls_made,
                "action_card": action_card,
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

            if fn_name in ALL_FUNCTIONS:
                try:
                    result = ALL_FUNCTIONS[fn_name](**fn_args)
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
    }