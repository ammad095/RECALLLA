# ============================================================
# FILE PATH:  recalla-backend/tools/link_tools.py
# PURPOSE:    Open a site or app on the device the user is holding.
# ============================================================

"""
Opening things on the user's own device.

open_app in desktop_tools runs xdg-open on the machine hosting Recalla. That
is right when you are sitting at that machine and wrong everywhere else: ask
from your phone and Netflix opens on the laptop in the other room.

A link does not have that problem. The tool returns a URL, the client renders
a button, and the user taps it — which opens the app on *their* device.
Browsers refuse to launch apps silently, and rightly so, but a link the user
taps is allowed. So this is not a workaround; it is the only correct way for
a web app to reach the device.

The URLs below are https:// on purpose rather than custom schemes like
instagram://. On iOS and Android an https link to a site that publishes an
app association opens the app when installed and the website when not, so one
link covers both. A custom scheme just fails on a device without the app.
"""

from typing import Optional
from urllib.parse import quote_plus

# name -> (base url, optional search template)
SITES = {
    "netflix":   ("https://www.netflix.com", "https://www.netflix.com/search?q={q}"),
    "youtube":   ("https://www.youtube.com", "https://www.youtube.com/results?search_query={q}"),
    "instagram": ("https://www.instagram.com", "https://www.instagram.com/{q}"),
    "facebook":  ("https://www.facebook.com", None),
    "whatsapp":  ("https://web.whatsapp.com", "https://wa.me/{q}"),
    "x":         ("https://x.com", "https://x.com/search?q={q}"),
    "twitter":   ("https://x.com", "https://x.com/search?q={q}"),
    "linkedin":  ("https://www.linkedin.com", "https://www.linkedin.com/search/results/all/?keywords={q}"),
    "github":    ("https://github.com", "https://github.com/search?q={q}"),
    "gmail":     ("https://mail.google.com", None),
    "calendar":  ("https://calendar.google.com", None),
    "drive":     ("https://drive.google.com", None),
    "maps":      ("https://maps.google.com", "https://www.google.com/maps/search/?api=1&query={q}"),
    "spotify":   ("https://open.spotify.com", "https://open.spotify.com/search/{q}"),
    "amazon":    ("https://www.amazon.com", "https://www.amazon.com/s?k={q}"),
    "wikipedia": ("https://www.wikipedia.org", "https://en.wikipedia.org/w/index.php?search={q}"),
    "chatgpt":   ("https://chatgpt.com", None),
    "google":    ("https://www.google.com", "https://www.google.com/search?q={q}"),
}


def _resolve(target: str, query: str = "") -> Optional[str]:
    t = (target or "").strip().lower()
    if not t:
        return None

    # Already a URL.
    if t.startswith(("http://", "https://")):
        return target.strip()

    # A bare domain, e.g. "netflix.com".
    if "." in t and " " not in t:
        return "https://" + t.lstrip("/")

    t = t.removeprefix("the ").removesuffix(" website").removesuffix(" app").strip()

    entry = SITES.get(t)
    if not entry:
        return None

    base, search = entry
    if query and search:
        return search.format(q=quote_plus(query.strip()))
    return base


def open_link(target: str, query: str = "") -> dict:
    """Hand the user a link to open on their own device."""
    url = _resolve(target, query)

    if not url:
        # Unknown name: a web search is a more useful answer than an error.
        term = f"{target} {query}".strip()
        return {
            "success": True,
            "type": "open_link",
            "url": f"https://www.google.com/search?q={quote_plus(term)}",
            "label": f"Search for {term}",
            "note": f"I don't have a direct link for '{target}', so this searches for it.",
        }

    name = (target or "").strip().title()
    return {
        "success": True,
        "type": "open_link",
        "url": url,
        "label": f"Open {name}" + (f" — {query}" if query else ""),
    }


LINK_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "open_link",
            "description": (
                "Open a website or app on the user's OWN device — their phone, tablet "
                "or laptop, whichever they are using. Use this for anything on the "
                "internet: 'open Netflix', 'play Coke Studio on YouTube', 'open "
                "Instagram', 'show me directions to Riphah'. On a phone this opens the "
                "real app when it is installed. Prefer this over open_app for websites "
                "and services; open_app is only for programs on the host computer such "
                "as VS Code."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "target": {
                        "type": "string",
                        "description": (
                            "Site or app name (netflix, youtube, instagram, maps, "
                            "spotify, github...), a domain like example.com, or a full URL."
                        ),
                    },
                    "query": {
                        "type": "string",
                        "description": (
                            "Optional search term or profile, e.g. 'Coke Studio' for "
                            "youtube, a username for instagram, a place for maps."
                        ),
                    },
                },
                "required": ["target"],
            },
        },
    },
]

LINK_FUNCTIONS = {"open_link": open_link}
