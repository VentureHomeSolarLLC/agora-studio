# Agora Studio - Visual Knowledge Base Builder

A unified knowledge management platform that bridges customer-facing documentation, internal knowledge base, and AI agent skills.

## Quick Start

```bash
# Install dependencies
pip install -r api/requirements.txt
npm install

# Start development server
npm run dev        # Frontend (React)
python api/main.py # Backend (FastAPI)
```

## Project Structure

```
agora-studio/
├── concepts/           # Reusable knowledge atoms
│   ├── backup-reserve.md
│   ├── net-metering-basics.md
│   └── storm-guard.md
├── engrams/           # Knowledge units with skills
│   ├── battery-add-on/
│   │   ├── _index.md
│   │   ├── SKILL.md
│   │   └── concepts/
│   └── power-outage/
│       ├── _index.md
│       ├── SKILL.md
│       └── concepts/
├── customer-pages/    # Assembled human-facing content
│   └── manifests/
├── api/               # Python backend
│   ├── main.py
│   ├── classifier.py
│   └── git_ops.py
└── scripts/           # Build & deploy
    ├── assemble-page.js
    └── deploy.sh
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md)
