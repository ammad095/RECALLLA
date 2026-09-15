"""
Meeting summarization using Groq + Llama 3.3 70B.
Generates real abstractive summaries (not just first 3 sentences).
"""

from models.groq_client import get_groq_client, DEFAULT_MODEL


SUMMARY_SYSTEM_PROMPT = """You are an expert meeting summarizer. Given a meeting transcript, produce a concise, well-structured summary.

Your summary must:
- Be 3-5 sentences long
- Capture the main topic and key decisions
- Mention specific people and concrete action items
- Use past tense ("The team discussed...", "Ammad agreed to...")
- Avoid filler phrases like "in this meeting" or "the participants talked about"
- Be readable and professional — not a bulleted list

Return ONLY the summary text, no preamble or headers."""


def summarize_meeting(transcript: str, max_tokens: int = 350) -> dict:
    """
    Generate a real abstractive summary of a meeting transcript.

    Returns:
        {
            "summary": "...",
            "model": "llama-3.3-70b-versatile",
            "input_tokens": int,
            "output_tokens": int,
        }
    """
    if not transcript or len(transcript.strip()) < 50:
        return {
            "summary": "Transcript too short to summarize.",
            "model": DEFAULT_MODEL,
            "input_tokens": 0,
            "output_tokens": 0,
        }

    client = get_groq_client()

    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": SUMMARY_SYSTEM_PROMPT},
            {"role": "user", "content": f"Summarize this meeting transcript:\n\n{transcript}"},
        ],
        max_tokens=max_tokens,
        temperature=0.3,  # Low temp for consistent, factual summaries
    )

    summary_text = response.choices[0].message.content.strip()

    return {
        "summary":       summary_text,
        "model":         DEFAULT_MODEL,
        "input_tokens":  response.usage.prompt_tokens,
        "output_tokens": response.usage.completion_tokens,
    }


def generate_key_points(transcript: str, max_points: int = 5) -> list:
    """
    Extract key bullet points from a transcript (separate from summary).
    Useful for the 'Key Points' section in Meeting Detail.

    Two things to know about the request below:

    * json_object mode requires the model to emit an *object*. The prompt used
      to ask for a bare array, which Groq rejects during validation — the call
      failed with json_validate_failed and no content at all. Ask for
      {"points": [...]} so the format and the instruction agree.
    * Key points are a nice-to-have beside the summary, so any failure returns
      an empty list rather than raising. Losing the bullets is a small loss;
      losing the summary with them is not.
    """
    if not transcript or len(transcript.strip()) < 50:
        return []

    import json

    client = get_groq_client()

    def _ask(**extra):
        return client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[
                {"role": "system", "content": (
                    f"Extract the {max_points} most important key points from this meeting. "
                    'Reply with a JSON object of the form {"points": ["...", "..."]} '
                    "and nothing else."
                )},
                {"role": "user", "content": transcript},
            ],
            max_tokens=400,
            temperature=0.2,
            **extra,
        )

    content = None
    try:
        content = _ask(response_format={"type": "json_object"}).choices[0].message.content
    except Exception as e:
        print(f"[Recalla] Key points JSON mode failed ({e}); retrying as plain text")
        try:
            content = _ask().choices[0].message.content
        except Exception as e2:
            print(f"[Recalla] Key points unavailable: {e2}")
            return []

    if not content:
        return []

    # Models occasionally wrap JSON in a fenced block; strip it before parsing.
    text = content.strip()
    if text.startswith("```"):
        text = text.split("```")[1].removeprefix("json").strip()

    try:
        data = json.loads(text)
        if isinstance(data, dict):
            for key in ("points", "key_points", "items", "results"):
                if isinstance(data.get(key), list):
                    return [str(x) for x in data[key][:max_points]]
            for v in data.values():
                if isinstance(v, list):
                    return [str(x) for x in v[:max_points]]
        elif isinstance(data, list):
            return [str(x) for x in data[:max_points]]
    except Exception:
        # Last resort: the model answered in prose. Take its bullet lines.
        lines = [
            ln.strip(" -*\u2022\t")
            for ln in text.splitlines()
            if ln.strip(" -*\u2022\t")
        ]
        if lines:
            return lines[:max_points]

    return []

    client = get_groq_client()

    response = client.chat.completions.create(
        model=DEFAULT_MODEL,
        messages=[
            {"role": "system", "content": (
                f"Extract the {max_points} most important key points from this meeting. "
                "Return ONLY a JSON array of strings. No preamble, no markdown, no explanations.\n"
                'Example: ["Point 1", "Point 2", "Point 3"]'
            )},
            {"role": "user", "content": transcript},
        ],
        max_tokens=400,
        temperature=0.2,
        response_format={"type": "json_object"},
    )

    import json
    try:
        content = response.choices[0].message.content
        data = json.loads(content)
        # Handle both formats: {"points": [...]} or just [...]
        if isinstance(data, dict):
            for key in ["points", "key_points", "items", "results"]:
                if key in data:
                    return data[key][:max_points]
            # Fallback: take first list value found
            for v in data.values():
                if isinstance(v, list):
                    return v[:max_points]
        elif isinstance(data, list):
            return data[:max_points]
    except Exception as e:
        print(f"[Recalla] Key points parsing failed: {e}")

    return []

def extract_tasks_and_decisions(transcript: str) -> dict:
    """
    Pull structured action items and decisions out of a transcript.

    The old approach matched keywords over spaCy sentences, which returned
    whole sentences with no assignee, no deadline and no priority — and could
    not tell "we should probably test this" from "Muzammal will run the tests
    by Thursday". A model reads the difference.

    json_object mode requires the reply to be an OBJECT. Asking for a bare
    array is what made key-point extraction fail with json_validate_failed and
    no content at all, so the prompt and the format have to agree.
    """
    import json

    if not transcript or len(transcript.strip()) < 60:
        return {"tasks": [], "decisions": []}

    client = get_groq_client()

    system = (
        "Extract action items and decisions from this meeting transcript.\n"
        "Reply with a JSON object of exactly this shape and nothing else:\n"
        '{"tasks": [{"text": "", "assignee": "", "due": "", "priority": "high|medium|low"}],\n'
        ' "decisions": [{"text": "", "context": ""}]}\n\n'
        "Rules:\n"
        "- A task is something a person committed to do. Speculation "
        '("we could maybe look at this") is not a task.\n'
        "- assignee is the speaker name if stated, otherwise an empty string. "
        "Never invent a name.\n"
        "- due is what was actually said (\"Friday\", \"next sprint\"), or empty. "
        "Do not guess dates.\n"
        "- A decision is a settled choice, not an option under discussion.\n"
        "- Return empty lists rather than inventing entries."
    )

    def _ask(**extra):
        return client.chat.completions.create(
            model=DEFAULT_MODEL,
            messages=[{"role": "system", "content": system},
                      {"role": "user", "content": transcript}],
            max_tokens=900, temperature=0.1, **extra,
        )

    content = None
    try:
        content = _ask(response_format={"type": "json_object"}).choices[0].message.content
    except Exception as e:
        print(f"[Recalla] Extraction JSON mode failed ({e}); retrying as text")
        try:
            content = _ask().choices[0].message.content
        except Exception as e2:
            print(f"[Recalla] Extraction unavailable: {e2}")
            return {"tasks": [], "decisions": []}

    text = (content or "").strip()
    if text.startswith("```"):
        text = text.split("```")[1].removeprefix("json").strip()

    try:
        data = json.loads(text)
    except Exception:
        return {"tasks": [], "decisions": []}

    def _clean(items, fields):
        out = []
        for it in (items or [])[:12]:
            if not isinstance(it, dict):
                continue
            body = str(it.get("text") or "").strip()
            if not body:
                continue
            row = {"text": body}
            for f in fields:
                row[f] = str(it.get(f) or "").strip()
            out.append(row)
        return out

    return {
        "tasks": _clean(data.get("tasks"), ["assignee", "due", "priority"]),
        "decisions": _clean(data.get("decisions"), ["context"]),
    }
