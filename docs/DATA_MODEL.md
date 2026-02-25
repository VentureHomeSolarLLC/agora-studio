# Agora Studio - Data Model & Architecture

## Overview

Agora Studio is a unified knowledge management system that powers:
- **Customer self-help** (help.venturehome.com)
- **Internal knowledge base** (employee wiki)
- **AI agent skills** (Forge skills library)

## Core Concepts

### Engram
An **Engram** is a self-contained unit of knowledge that includes:
- Human-readable documentation (`_index.md`)
- AI agent instructions (`SKILL.md`)
- Reusable concepts (`concepts/`)
- Learned experiences (`lessons/`)

### Concept
A **Concept** is an atomic, reusable piece of knowledge. Concepts can be shared across multiple Engrams.

### Lesson
A **Lesson** captures learned experience from real-world cases (feedback loop).

### Customer Page
A **Customer Page** is assembled from Concepts and Engrams, filtered by visibility.

---

## File Structure

```
agora-studio/
├── concepts/                    # Reusable knowledge atoms
│   ├── backup-reserve.md
│   ├── net-metering-basics.md
│   └── storm-guard.md
├── engrams/                     # Knowledge units with skills
│   ├── battery-add-on/
│   │   ├── _index.md           # Human-facing guide
│   │   ├── SKILL.md            # Agent instructions
│   │   └── concepts/           # Engram-specific concepts
│   └── power-outage/
│       ├── _index.md
│       ├── SKILL.md
│       └── concepts/
├── lessons/                     # Learned experiences
│   └── 2026-02-24-customer-expectations.md
├── customer-pages/              # Assembled human-facing content
│   └── manifests/
│       └── battery-guide.yaml
├── api/                         # Python classification service
│   ├── main.py
│   └── requirements.txt
└── scripts/                     # Build & deploy
    └── assemble-page.js
```

---

## YAML Schemas

### Concept Schema

```yaml
---
concept_id: string              # Required, unique, kebab-case
title: string                   # Required, human-readable
content_type: concept           # Required, always "concept"
audience:                       # Required, array
  - customer                    #   customer: visible on help site
  - agent                       #   agent: AI can use
  - internal                    #   internal: employees only
tags:                           # Required, array of strings
  - battery
  - settings
  - backup-power
created: ISO8601                # Required, auto-generated
updated: ISO8601                # Auto-updated on change
author: string                  # Required, email or name
used_by_engrams:                # Auto-populated
  - battery-add-on
  - power-outage
related_concepts:               # Suggested by AI
  - storm-guard
  - backup-duration
  - powerwall-settings
---

# Content follows YAML frontmatter
```

### Engram Schema

```yaml
# _index.md (Human-facing guide)
---
engram_id: string               # Required, unique, kebab-case
title: string                   # Required
description: string             # Required, 1-2 sentences
category: string                # e.g., post-install, troubleshooting
audience:                       # Required
  - customer
  - agent
tags: string[]                  # Required
created: ISO8601
updated: ISO8601
---

# Content follows
```

```yaml
# SKILL.md (Agent instructions)
---
skill_id: string                # Required, matches engram_id
name: string                    # Required, display name
type: enum                      # consultation | diagnostic | procedural | creative
triggers:                       # Required, keywords that activate skill
  - "battery not working"
  - "no backup power"
  - "battery won't charge"
required_concepts:              # Concepts this skill needs
  - backup-reserve
  - storm-guard
  - envoy-troubleshooting
related_skills:                 # Other skills often used together
  - battery-troubleshooting
  - financing-explainer
---

# Skill instructions follow
```

### Lesson Schema

```yaml
---
lesson_id: string               # Required, unique
title: string                   # Required
source:                         # Where this lesson came from
  type: support_ticket | customer_feedback | agent_observation
  reference: string             # Ticket ID, etc.
date: ISO8601                   # When lesson was learned
author: string                  # Who captured it
related_engrams:                # Which Engrams benefit
  - battery-add-on
  - customer-expectations
tags: string[]
---

# Lesson content follows
```

### Page Manifest Schema

```yaml
# customer-pages/manifests/battery-guide.yaml
---
page_id: string                 # Required, unique
title: string                   # Required
card: string                    # Topic category
description: string             # SEO/meta description
visibility: enum                # external | internal | both
tags: string[]
author: string
updated: ISO8601

assemble_from:                  # Ordered list of content
  - source: concepts/backup-reserve.md
    sections: [summary, settings]  # Specific sections, or "all"
    transform: simplify            # Optional: simplify, full
    
  - source: concepts/storm-guard.md
    sections: all
    transform: full
    
  - source: engrams/battery-add-on/_index.md
    sections: all
    transform: simplify
---
```

---

## Visibility System

| Tag | Customer Site | Employee Wiki | AI Agents |
|-----|---------------|---------------|-----------|
| `internal` | ❌ | ✅ | ✅ |
| `external` | ✅ | ❌ | ✅ |
| `both` | ✅ | ✅ | ✅ |

**Default:** `both` (most content serves all audiences)

---

## File Naming Conventions

- **Concepts**: `kebab-case.md` (e.g., `backup-reserve.md`)
- **Engrams**: Folder `kebab-case/`, files `_index.md`, `SKILL.md`
- **Lessons**: `YYYY-MM-DD-brief-description.md`
- **Page manifests**: `kebab-case.yaml`

---

## Validation Rules

1. **concept_id** must be unique across all concepts
2. **engram_id** must be unique across all engrams
3. **used_by_engrams** auto-populated, don't edit manually
4. **audience** must have at least one value
5. **triggers** in SKILL.md should be 3-10 phrases
6. Content must pass markdown linting

---

## Workflow: Creating New Content

### Option A: Via Web UI (Phase 2)
1. Open Agora Studio web interface
2. Write/paste content
3. Click "Analyze" → AI classifies
4. Review suggested YAML
5. Adjust tags/visibility
6. Click "Create" → Auto-commits to GitHub

### Option B: Direct Git (Power Users)
1. Create file in proper location
2. Write YAML frontmatter
3. Write markdown content
4. Commit and push
5. GitHub Actions validates and deploys

---

## Git Workflow

**Main branch:** `main` (production)
**Feature branches:** `feat/engram-name`

```bash
# Create new Engram
git checkout -b feat/battery-troubleshooting
mkdir engrams/battery-troubleshooting
cat > engrams/battery-troubleshooting/SKILL.md << 'EOF'
---
skill_id: battery-troubleshooting
...
EOF
git add .
git commit -m "feat: Add battery troubleshooting Engram"
git push origin feat/battery-troubleshooting
# Open PR via GitHub
```

---

## Integration Points

### Forge Skills (Phase 3)
- Engram `SKILL.md` → Forge skill auto-sync
- Webhook on GitHub push triggers update
- Version tracked via Git commit SHA

### Customer Site (Phase 2)
- Page manifests trigger static site build
- Filter by visibility: `external` or `both`
- Deploy to help.venturehome.com

### Agent Workspace (Phase 3)
- Agents download Engrams to `~/.openclaw/engrams/`
- Local file access during task execution
- Heartbeat syncs updates

---

## Example: Complete Engram

```yaml
# engrams/battery-add-on/SKILL.md
---
skill_id: battery-add-on
name: "Guide Customer Through Battery Add-On"
type: consultation
triggers:
  - "add battery"
  - "battery upgrade"
  - "get a battery"
  - "storage system"
required_concepts:
  - battery-add-on
  - backup-reserve
  - system-compatibility
  - battery-incentives
related_skills:
  - battery-troubleshooting
  - financing-explainer
---

# Skill instructions here...
```

```markdown
# engrams/battery-add-on/_index.md
---
engram_id: battery-add-on
title: "Adding a Battery to Your Existing Solar System"
description: "Complete guide to battery add-ons, from compatibility to installation"
category: post-install
audience: [customer]
tags: [battery, add-on, upgrade, storage, backup]
created: 2026-02-24
updated: 2026-02-24
---

# Adding a Battery to Your Existing Solar System

Yes — and it's one of the most common upgrades...
```

---

## Next Steps

1. ✅ Define data model (this document)
2. 🔄 Scaffold GitHub repo
3. 🔄 Build Python classification service
4. ⏳ Convert initial content (waiting for Alex)
5. ⏳ Build Visual Engram Creator (Phase 2)
6. ⏳ Deploy customer site (Phase 2)
7. ⏳ Forge sync (Phase 3)
8. ⏳ Agent workspace sync (Phase 3)

---

*Agora Studio — The knowledge system our future selves will thank us for.*
