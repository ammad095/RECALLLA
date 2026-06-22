import spacy

nlp = spacy.load("en_core_web_sm")

# Known tech terms to ignore as people/orgs
TECH_TERMS = {
    "whisper", "chromadb", "spacy", "fastapi", "react", "vite",
    "postgresql", "api", "ui", "css", "html", "json", "tsx", "jsx",
    "ai", "ml", "nlp", "gpt", "llm", "bart", "langchain"
}

TASK_KEYWORDS     = ["assign", "todo", "task", "complete", "finish", "implement", "build", "fix", "update", "create", "deploy", "test", "review", "write", "send", "submit", "responsible for", "need to", "have to", "must"]
DEADLINE_KEYWORDS = ["deadline", "due", "by friday", "by monday", "by tuesday", "by wednesday", "by thursday", "by saturday", "by sunday", "by tomorrow", "by next", "before friday", "before monday", "end of week", "eow", "eod", "asap"]
DECISION_KEYWORDS = ["decided", "agreed", "confirmed", "approved", "will use", "going with", "we chose", "finalized", "settled on", "let's use"]


def extract_tags_and_entities(text: str) -> dict:
    doc = nlp(text)

    people, dates, orgs, topics = [], [], [], []

    for ent in doc.ents:
        text_lower = ent.text.lower().strip()

        # Skip if it's a known tech term
        if any(term in text_lower for term in TECH_TERMS):
            if ent.label_ != "PRODUCT":
                topics.append(ent.text)
            continue

        if ent.label_ == "PERSON" and ent.text not in people:
            people.append(ent.text)
        elif ent.label_ in ("DATE", "TIME") and ent.text not in dates:
            # Filter out non-date words misclassified
            if not any(w in text_lower for w in ["vector", "version", "v1", "v2", "v3"]):
                dates.append(ent.text)
        elif ent.label_ == "ORG" and ent.text not in orgs:
            orgs.append(ent.text)
        elif ent.label_ in ("PRODUCT", "EVENT", "WORK_OF_ART") and ent.text not in topics:
            topics.append(ent.text)

    tasks, decisions, deadlines, questions = [], [], [], []

    for sent in doc.sents:
        s = sent.text.strip()
        sl = s.lower()
        is_question = "?" in s or any(sl.startswith(qw) for qw in ["what", "how", "when", "who", "why", "can we", "should we", "could we", "would we", "is there", "are we"])

        # Questions take priority — don't double-classify as tasks
        if is_question:
            questions.append(s)
            continue

        if any(kw in sl for kw in TASK_KEYWORDS):
            tasks.append(s)
        if any(kw in sl for kw in DEADLINE_KEYWORDS) or any(d.lower() in sl for d in dates):
            deadlines.append(s)
        if any(kw in sl for kw in DECISION_KEYWORDS):
            decisions.append(s)

    auto_tags = []
    text_lower = text.lower()

    tag_map = {
        "Backend":     ["api", "database", "server", "endpoint", "backend", "fastapi", "django"],
        "Frontend":    ["react", "ui", "interface", "component", "css", "frontend", "design", "tailwind"],
        "AI/ML":       ["model", "whisper", "spacy", "nlp", "machine learning", "ai ", "embedding", "transformer", "gpt"],
        "Database":    ["chromadb", "postgresql", "schema", "migration", "vector", "sql", "mongodb"],
        "Sprint":      ["sprint", "backlog", "scrum", "agile", "standup", "velocity"],
        "FYP":         ["fyp", "final year", "supervisor", "report", "submission", "dr. adnan", "dr adnan"],
        "Engineering": ["architecture", "microservice", "deployment", "staging", "docker", "infrastructure"],
        "Research":    ["research", "literature", "paper", "study", "analysis"],
        "Meeting":     ["meeting", "sync", "call", "discussion", "session"],
        "Finance":     ["budget", "cost", "investor", "funding", "revenue", "pitch"],
        "Bug":         ["bug", "fix", "broken", "error", "issue", "crash"],
    }

    for tag, keywords in tag_map.items():
        if any(kw in text_lower for kw in keywords):
            auto_tags.append(tag)

    return {
        "entities": {
            "people":  people[:10],
            "dates":   dates[:10],
            "orgs":    orgs[:10],
            "topics":  topics[:10],
        },
        "auto_tags": auto_tags,
        "tasks":     list(set(tasks))[:10],
        "decisions": list(set(decisions))[:10],
        "deadlines": list(set(deadlines))[:10],
        "questions": list(set(questions))[:10],
    }