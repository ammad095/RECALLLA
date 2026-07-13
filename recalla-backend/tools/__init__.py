# tools package — agent tools live here
# Each module exports TOOL_SCHEMAS list and a name → function dict
# tools/__init__.py
# Aggregates all agent tools (schemas + Python implementations)

from .reminder_tools import REMINDER_TOOLS, REMINDER_FUNCTIONS
from .calendar_tools import CALENDAR_TOOLS, CALENDAR_FUNCTIONS
from .email_tools    import EMAIL_TOOLS,    EMAIL_FUNCTIONS

# Combined schemas for Groq tool-use
ALL_TOOLS = REMINDER_TOOLS + CALENDAR_TOOLS + EMAIL_TOOLS

# Combined function dispatch table
ALL_FUNCTIONS = {
    **REMINDER_FUNCTIONS,
    **CALENDAR_FUNCTIONS,
    **EMAIL_FUNCTIONS,
}