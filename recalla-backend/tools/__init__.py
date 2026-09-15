# tools package — agent tools live here
# Each module exports TOOL_SCHEMAS list and a name → function dict
# tools/__init__.py
# Aggregates all agent tools (schemas + Python implementations)

from .reminder_tools import REMINDER_TOOLS, REMINDER_FUNCTIONS
from .calendar_tools import CALENDAR_TOOLS, CALENDAR_FUNCTIONS
from .email_tools    import EMAIL_TOOLS,    EMAIL_FUNCTIONS
from .desktop_tools  import DESKTOP_TOOLS,  DESKTOP_FUNCTIONS
from .memory_tools   import MEMORY_TOOLS,   MEMORY_FUNCTIONS
from .link_tools     import LINK_TOOLS,     LINK_FUNCTIONS

# Combined schemas for Groq tool-use
ALL_TOOLS = (REMINDER_TOOLS + CALENDAR_TOOLS + EMAIL_TOOLS + MEMORY_TOOLS
             + LINK_TOOLS + DESKTOP_TOOLS)

# Combined function dispatch table
ALL_FUNCTIONS = {
    **REMINDER_FUNCTIONS,
    **CALENDAR_FUNCTIONS,
    **EMAIL_FUNCTIONS,
    **MEMORY_FUNCTIONS,
    **LINK_FUNCTIONS,
    **DESKTOP_FUNCTIONS,
}

# Tools that only make sense on the machine running Recalla. A request that
# arrived from somewhere else (WhatsApp today, SMS or a phone tomorrow) gets
# the cloud set instead — those act on the user's accounts, not on hardware.
DEVICE_ONLY = set(DESKTOP_FUNCTIONS)

# Links work on every device — they are the mobile answer to open_app.
CLOUD_TOOLS = (REMINDER_TOOLS + CALENDAR_TOOLS + EMAIL_TOOLS + MEMORY_TOOLS
               + LINK_TOOLS)
CLOUD_FUNCTIONS = {**REMINDER_FUNCTIONS, **CALENDAR_FUNCTIONS, **EMAIL_FUNCTIONS,
                   **MEMORY_FUNCTIONS, **LINK_FUNCTIONS}


def tools_for(channel: str = "web"):
    """(schemas, functions) appropriate to where the request came from."""
    if channel == "web":
        return ALL_TOOLS, ALL_FUNCTIONS
    return CLOUD_TOOLS, CLOUD_FUNCTIONS
