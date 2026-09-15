#!/usr/bin/env python
"""
Which Groq models can this key actually use?

Model ids get retired without warning; when the agent starts returning
model_not_found, run this to find a live replacement and set GROQ_MODEL in .env.

    python scripts/check_models.py
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))
from groq import Groq

CANDIDATES = [
    "openai/gpt-oss-120b", "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile", "llama-3.1-8b-instant",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "moonshotai/kimi-k2-instruct", "qwen/qwen3-32b", "gemma2-9b-it",
]
TOOL = [{"type": "function", "function": {
    "name": "ping", "description": "ping",
    "parameters": {"type": "object", "properties": {"x": {"type": "string"}}}}}]

def main():
    key = os.getenv("GROQ_API_KEY")
    if not key:
        sys.exit("GROQ_API_KEY missing from .env")
    c = Groq(api_key=key)
    print(f"{'model':<46}{'chat':<8}tools")
    print("-" * 62)
    for m in CANDIDATES:
        try:
            c.chat.completions.create(model=m, messages=[{"role": "user", "content": "hi"}], max_tokens=5)
            chat = "yes"
        except Exception as e:
            print(f"{m:<46}{'no':<8}-    ({str(e)[:40]})" if "does not exist" not in str(e)
                  else f"{m:<46}{'no':<8}-")
            continue
        try:
            c.chat.completions.create(model=m, messages=[{"role": "user", "content": "call ping"}],
                                      tools=TOOL, tool_choice="auto", max_tokens=60)
            tools = "yes"
        except Exception:
            tools = "no"
        print(f"{m:<46}{chat:<8}{tools}")
    print("\nThe agent needs a model with tools=yes. Set it in .env:\n  GROQ_MODEL=<id>")

if __name__ == "__main__":
    main()
