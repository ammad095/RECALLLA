# ============================================================
# FILE PATH:  recalla-backend/models/agent.py
# PURPOSE:    The brain. Runs Groq + tool calling loop.
#             Now with reminders + calendar + email tools.
# ============================================================

"""
Recalla Agent — decides which tool to call based on user input.
Uses Groq (Llama 3.3 70B) with function calling (ReAct pattern).

Now supports:
- Reminders (local JSON storage)
- Calendar (Google Calendar API)
- Email (Gmail API, draft-first preview pattern)
"""

import json
from datetime import datetime
from models.groq_client import get_groq_client, DEFAULT_MODEL
from tools.reminder_tools import REMINDER_TOOLS, REMINDER_FUNCTIONS
from tools.calendar_tools import CALENDAR_TOOLS, CALENDAR_FUNCTIONS
from tools.email_tools    import EMAIL_TOOLS,    EMAIL_FUNCTIONS


def build_system_prompt():
    """Build system prompt with current date + tool guidance."""
    now = datetime.now()
    return f"""You are Recalla, an AI meeting assistant for Ammad Ahmad.

Today's date and time: {now.strftime('%A, %B %d, %Y at %I:%M %p')}
Current ISO datetime: {now.isoformat()}
User's timezone: Asia/Karachi (Pakistan Standard Time)

You can do these things by calling the right tool:

REMINDERS (instant — no confirmation needed):
- create_reminder, list_reminders, complete_reminder, delete_reminder

CALENDAR (instant — events can be deleted if wrong):
- create_calendar_event, list_calendar_events, find_free_slot, delete_calendar_event

EMAIL (DRAFT only — never send directly):
- draft_email creates a draft for the user to review and send
- read_recent_emails, search_emails read inbox
- CRITICAL: you cannot send emails. Only draft them. The user clicks 'Send' themselves.

GUIDELINES:
- When user asks something you can do with a tool, use the tool — don't just describe.
- Convert natural language times to ISO format using today's date as reference.
  Examples:
    "tomorrow at 3pm" → calculate tomorrow's date, time 15:00:00
    "Friday at noon"  → next Friday at 12:00:00
    "in 2 hours"      → add 2 hours to current time
- For multi-step requests (e.g. "schedule a meeting and email them"), chain tools.
- After calling tools, give a short 1-2 sentence confirmation.
- For email drafts, just say what you drafted — DO NOT ask the user if they want it sent. The UI shows a Send button.
- If unsure, ask a brief clarifying question instead of guessing.
- Use natural casual language, not formal business speak.
- Sign emails as "Ammad" unless user specifies otherwise.

You speak directly to Ammad, who is a BSCS student working on his FYP (Recalla)."""


# ── Tool registry ─────────────────────────────────────────────────────────────
ALL_TOOLS = REMINDER_TOOLS + CALENDAR_TOOLS + EMAIL_TOOLS
ALL_FUNCTIONS = {
    **REMINDER_FUNCTIONS,
    **CALENDAR_FUNCTIONS,
    **EMAIL_FUNCTIONS,
}


def execute_tool(name: str, arguments: dict) -> dict:
    """Execute a tool by name with the given arguments."""
    if name not in ALL_FUNCTIONS:
        return {"success": False, "error": f"Unknown tool: {name}"}
    try:
        return ALL_FUNCTIONS[name](**arguments)
    except TypeError as e:
        return {"success": False, "error": f"Invalid arguments for {name}: {e}"}
    except Exception as e:
        return {"success": False, "error": f"Tool {name} failed: {e}"}


def run_agent(user_message: str, conversation_history: list = None, max_iterations: int = 6) -> dict:
    """Run the agent loop. Returns response + actions + history."""
    client = get_groq_client()

    messages = [{"role": "system", "content": build_system_prompt()}]
    if conversation_history:
        messages.extend(conversation_history)
    messages.append({"role": "user", "content": user_message})

    actions = []

    for iteration in range(max_iterations):
        response = client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=messages,
            tools=ALL_TOOLS,
            tool_choice="auto",
            temperature=0.3,
            max_tokens=800,
        )

        msg = response.choices[0].message

        # No tool calls = agent is done
        if not msg.tool_calls:
            final_response = msg.content or "Done."
            messages.append({"role": "assistant", "content": final_response})
            return {
                "response":   final_response,
                "actions":    actions,
                "history":    _clean_history_for_storage(messages),
                "iterations": iteration + 1,
            }

        # Add tool-call message
        messages.append({
            "role":       "assistant",
            "content":    msg.content or "",
            "tool_calls": [
                {
                    "id":   tc.id,
                    "type": "function",
                    "function": {
                        "name":      tc.function.name,
                        "arguments": tc.function.arguments,
                    },
                }
                for tc in msg.tool_calls
            ],
        })

        # Execute each tool call
        for tool_call in msg.tool_calls:
            tool_name = tool_call.function.name
            try:
                arguments = json.loads(tool_call.function.arguments)
            except json.JSONDecodeError:
                arguments = {}

            print(f"[Agent] Calling: {tool_name}({arguments})")
            result = execute_tool(tool_name, arguments)

            actions.append({
                "tool":      tool_name,
                "arguments": arguments,
                "result":    result,
            })

            messages.append({
                "role":         "tool",
                "tool_call_id": tool_call.id,
                "content":      json.dumps(result),
            })

    return {
        "response":   "I took too many steps. Let me know what you'd like me to focus on.",
        "actions":    actions,
        "history":    _clean_history_for_storage(messages),
        "iterations": max_iterations,
    }


def _clean_history_for_storage(messages: list) -> list:
    """Strip system prompt from history (rebuilt fresh each call)."""
    return [m for m in messages if m.get("role") != "system"]