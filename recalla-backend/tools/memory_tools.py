# ============================================================
# FILE PATH:  recalla-backend/tools/memory_tools.py
# PURPOSE:    Let the agent search past meetings.
# ============================================================

"""
Semantic search over the signed-in user's meetings.

This is the tool that makes Recalla a memory assistant rather than a chatbot
with a microphone. Questions like "what did we decide about the database"
match on meaning, so the answer is found even when the transcript never used
the words in the question.

Results carry the meeting title, speaker and timestamp so the agent can say
where something came from. An answer about a meeting is only trustworthy if
it can be traced back to the moment it was said.
"""

from typing import Optional

from auth.context import get_current_user_id
from models import vector_store


def _uid() -> Optional[str]:
    return get_current_user_id()


def search_memory(query: str, limit: int = 5, kind: str = "") -> dict:
    """Find passages from this user's meetings that answer a question."""
    uid = _uid()
    if not uid:
        return {"success": False, "error": "No signed-in user.", "results": []}

    try:
        hits = vector_store.search(query, user_id=uid, limit=limit or 5,
                                   kind=kind or None)

        # A filter that empties the results is worse than no filter: the model
        # picks kind="decision" for a question about a decision, finds nothing
        # because only transcripts are indexed, and reports that the meeting
        # never happened. Fall back to searching everything.
        if kind and not hits:
            hits = vector_store.search(query, user_id=uid, limit=limit or 5)
    except Exception as e:
        return {"success": False, "error": f"Memory search failed: {e}", "results": []}

    if not hits:
        return {
            "success": True, "count": 0, "results": [],
            "message": ("Nothing in your meetings matches that. Either it was not "
                        "discussed, or that meeting has not been recorded yet."),
        }

    return {
        "success": True,
        "count": len(hits),
        "results": [{
            "text": h["text"],
            "meeting": h["meeting_title"],
            "meeting_id": h["meeting_id"],
            "speaker": h["speaker"],
            "when": (h["date"] or "")[:10],
            "at_seconds": h["start_s"],
            "relevance": h["similarity"],
        } for h in hits],
    }


MEMORY_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "search_memory",
            "description": (
                "Search the user's past meetings by meaning. Use this for ANY question "
                "about what was said, decided, agreed, promised or discussed previously "
                "— for example 'what did we decide about the database', 'what did "
                "Muzammal say about the deadline', 'what are my action items'. Always "
                "search before saying you do not know something about a past meeting."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The question or topic to look for, in natural language.",
                    },
                    "limit": {
                        "type": "integer",
                        "description": "How many passages to return (default 5).",
                    },
                    "kind": {
                        "type": "string",
                        "description": (
                            "Rarely needed — leave empty to search everything, which is "
                            "almost always what you want. Only set it to 'task' or "
                            "'decision' when the user explicitly asks for a list of "
                            "their action items or decisions."
                        ),
                    },
                },
                "required": ["query"],
            },
        },
    },
]

MEMORY_FUNCTIONS = {"search_memory": search_memory}
