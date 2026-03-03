---
name: skill-builder
description: Build or update Forge Engrams (skills) from user-provided instructions. Outputs a structured Engram folder with _index.md, SKILL.md, and supporting CONCEPT/LESSON files, keeping it concise and non-duplicative.
---

# Skill Builder (Forge Engrams)

Use this skill when a user wants to **create or update a skill** in Forge. Your job is to translate their instructions into the Engram file structure and keep it clean, complete, and searchable.

## Inputs You Need

- Skill intent and scope (what task does the agent perform?)
- Domain + subdomains
- Triggers (what starts this skill)
- Outcome (definition of done)
- Allowed systems / integrations
- Constraints / no‑go rules
- Required inputs
- Steps (for procedural skills)
- Known edge cases or exceptions
- Sources or references (if available)

If anything is missing, ask targeted questions or mark as `TODO` in the file.

## Output Structure (Required)

```
engrams/<engram_id>/
  _index.md
  SKILL.md
  CONCEPT_<slug>.md (optional, repeatable)
  LESSON_<slug>.md  (optional, repeatable)
```

### File naming rules
- `engram_id` and file slugs are **kebab‑case**
- `CONCEPT_*.md` = variable conditions / reusable facts  
- `LESSON_*.md` = edge cases, failures, exceptions

## Minimal Frontmatter (Use YAML)

**_index.md**
```
---
engram_id: <kebab-case>
title: <human title>
summary: <1–2 sentences>
mode: procedure | knowledge
domain: <domain>
subdomains: [a, b, c]
updated_at: <YYYY-MM-DD>
required_integrations: [Graph, Salesforce, Google, ...]
tags: [optional]
files:
  - SKILL.md
  - CONCEPT_<slug>.md
  - LESSON_<slug>.md
---
```

**SKILL.md**
```
---
engram_id: <kebab-case>
type: skill
mode: procedure | knowledge
skill_type: procedural | consultation | diagnostic | creative | knowledge
risk_level: low | medium | high
domain: <domain>
subdomains: [a, b, c]
triggers: [..]
required_inputs: [..]
constraints: [..]
allowed_systems: [..]
escalation_criteria: [..]
stop_conditions: [..]
---
```

## Content Rules

- **Skills = how to do** (process).  
- **Concepts = what varies** (utility‑specific, market‑specific, etc).  
- **Lessons = exceptions** (edge cases, reversals, unexpected outcomes).  
- Prefer **smaller files**; avoid giant monoliths.  
- Never create duplicates; if a file exists, **append or update** instead.  
- Always update `_index.md` when files change.

## Update Behavior

When updating an existing Engram:
1. Reuse existing file names if possible.
2. Add new Concepts/Lessons only if truly new.
3. Update `updated_at` in `_index.md`.
4. If replacing content, keep a short “Updated:” note in the file body.

## Prompt Template (Use for OpenClaw)

```
You are the Forge Skill Builder. Create or update an Engram for:
<skill description / monolith skill>

Constraints:
- Use the Engram structure (index + skill + concepts + lessons)
- Keep files small and focused
- Ask for missing info or add TODOs
- Avoid duplicates
- Update _index.md
```
