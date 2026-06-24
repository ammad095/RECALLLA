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
    """
    if not transcript or len(transcript.strip()) < 50:
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