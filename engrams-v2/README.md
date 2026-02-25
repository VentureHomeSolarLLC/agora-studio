# Engrams v2 — Agora Architecture

This directory contains properly structured Engrams using the Agora architecture.

## Structure

```
engrams-v2/<engram-name>/
├── _index.md              # Entry point — map of all content
├── SKILL.md               # Lean procedure for agents
├── concepts/              # Reference material
│   ├── concept-1.md
│   └── concept-2.md
└── lessons/               # Learned experiences & edge cases
    └── YYYY-MM-DD-lesson-name.md
```

## Status

| Engram | Status | Migrated From |
|--------|--------|---------------|
| financing-enfin-tpo | ✅ Complete | New — not in v1 |
| battery-add-on | ⏳ Not started | engrams/battery-add-on/ |
| production-low | ⏳ Not started | engrams/production-low/ |
| ... | ... | ... |

## Migration Rule

**Only migrate when you need to edit.** Leave working content alone until you touch it.

## Creating New Engrams

Use the content builder at help.venturehome.com/admin — it outputs to this directory.
