---
name: knowledge-library
description: Retrieve factual notes from the Venture Home Knowledge Library. Use domain + subdomain frontmatter and Facts sections to answer questions without pulling unrelated context.
---

# Knowledge Library (Fact Retrieval)

Use this skill when you need **facts or reference data** that may not exist in a local skill. The knowledge library is a Markdown repo optimized for fast, precise retrieval.

## Repository Structure

```
knowledge/
  _index.md
  <domain>/
    _index.md
    <note>.md
```

Each note has YAML frontmatter and a “Facts” section. Prefer the smallest set of notes needed to answer the question.

## Retrieval Steps

1. **Identify domain + subdomains** from the user question.
2. **Scan the domain folder** for matching titles or tags.
3. **Open the most relevant note(s)** and read only the “Facts” and “When to use” sections.
4. **Answer using facts only**. If unclear, ask for more context.

## Frontmatter Signals (Priority)

- `domain`, `subdomains`
- `visibility` (external vs internal)
- `confidence` + `last_verified`
- `tags`
- `summary`

Prefer higher confidence and most recently verified notes.

## Output Rules

- Do not quote entire notes. Summarize relevant facts concisely.
- If facts conflict, call out both and recommend verification.
- If no note exists, report “not found” and suggest adding it.
