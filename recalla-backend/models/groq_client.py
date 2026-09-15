"""
Groq API client — used for summarization, agent reasoning, and email drafting.
Loads API key from .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

_client = None

# Model IDs move around on Groq — the Llama 3.x ids this project originally used
# now return 404 for this account. Verified working as of the last check:
#   openai/gpt-oss-120b   larger, better reasoning, supports tool calling
#   openai/gpt-oss-20b    faster, also supports tool calling
#
# Override without editing code by setting GROQ_MODEL / GROQ_FAST_MODEL in .env.
# If both start failing with model_not_found, run scripts/check_models.py to see
# what the key can actually reach.
DEFAULT_MODEL = os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
FAST_MODEL    = os.getenv("GROQ_FAST_MODEL", "openai/gpt-oss-20b")


def get_groq_client():
    """Lazy-load Groq client. Raises clear error if API key missing."""
    global _client
    if _client is None:
        api_key = os.getenv("GROQ_API_KEY")
        if not api_key:
            raise ValueError(
                "GROQ_API_KEY not found. Create a .env file in recalla-backend/ with:\n"
                "GROQ_API_KEY=gsk_your_key_here\n"
                "Get a free key at https://console.groq.com"
            )
        try:
            from groq import Groq
        except ImportError:
            raise ImportError("Groq not installed. Run: pip install groq python-dotenv")

        _client = Groq(api_key=api_key)
        print("[Recalla] Groq client initialized")
    return _client


def is_groq_available():
    """Check if Groq is configured without raising an error."""
    return os.getenv("GROQ_API_KEY") is not None