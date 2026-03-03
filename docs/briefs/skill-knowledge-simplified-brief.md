# Skill + Knowledge Simplified Model (One‑Page)

**Objective**  
Reduce friction for skill creation while keeping human content clean, searchable, and AI‑ready.

## Proposed Model (Two Tracks)

**1) Skills live in Forge (agent‑first)**
- Agents create and refine skills directly using OpenClaw.
- Engrams follow a strict structure: `_index.md`, `SKILL.md`, `CONCEPT*.md`, `LESSON*.md`.
- Skills sync to Forge’s skills library and propagate to any agents using them.
- When agents discover a new edge case, they append a new Lesson/Concept and resync.

**2) Knowledge lives in Help (human‑first)**
- Human users create customer/internal articles in Help with AI copy assistance.
- The wizard detects **net‑new facts** and writes AI‑optimized notes into a **knowledge repo**.
- Agents access this repo via a single `knowledge-library` skill when facts are missing locally.

## Repos & Ownership

**Forge (skills only)**
- Source: agent‑generated Engrams  
- Audience: agents  
- Updates: continuous, via OpenClaw

**Help (content only)**
- Source: human authors  
- Audience: customers + internal team  
- Updates: wizard + editorial review

**Knowledge Repo (facts only)**
- Source: Help wizard’s net‑new extraction  
- Audience: agents (facts lookup)  
- Updates: automatic, deduped

## User Flows (Summary)

**Agent Skill Flow**
1. User trains skill with OpenClaw  
2. Agent writes Engram structure in Forge  
3. Forge syncs skill → all agents updated

**Human Content Flow**
1. User writes article in Help  
2. AI polishes + checks duplicates  
3. Net‑new facts → knowledge repo  
4. Agents query knowledge repo only when needed

## Benefits
- Skills are built where agents already work (OpenClaw).  
- Human content is simplified and focused on clarity.  
- Agents avoid context bloat by querying facts only when needed.  
- Clear separation of “how to do” (skills) vs “what is true” (facts).

## Next Steps
- Implement `skill-builder` skill in OpenClaw (Engram authoring).  
- Add `knowledge-library` skill for fact retrieval.  
- Keep Help wizard focused on human content + net‑new fact extraction.  
