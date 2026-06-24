"""
Groq API client — used for summarization, agent reasoning, and email drafting.
Loads API key from .env file.
"""

import os
from dotenv import load_dotenv

load_dotenv()

_client = None

# Default model — Llama 3.3 70B is fast, free tier friendly, and excellent quality
DEFAULT_MODEL = "llama-3.3-70b-versatile"
FAST_MODEL = "llama-3.1-8b-instant"  # For lightweight tasks


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