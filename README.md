# Agora Studio - Visual Knowledge Base Builder

A unified knowledge management system for Venture Home that powers customer self-help, internal documentation, and AI agent skills.

## Quick Start

```bash
# Clone the repo
git clone https://github.com/VentureHomeSolarLLC/agora-studio.git
cd agora-studio

# Install Python dependencies
cd api
pip install -r requirements.txt
cd ..

# Start the API server
cd api
python main.py

# In another terminal, start the frontend
cd frontend
npm install
npm run dev
```

## Architecture

```
agora-studio/
├── concepts/           # Reusable knowledge atoms
├── engrams/           # Knowledge units with skills
├── lessons/           # Learned experiences
├── customer-pages/    # Assembled content
├── api/               # Python FastAPI service
└── scripts/           # Build automation
```

## Documentation

- [Data Model & Architecture](docs/DATA_MODEL.md)
- [API Reference](docs/API.md) (coming soon)
- [Contributing Guide](docs/CONTRIBUTING.md) (coming soon)

## Project Status

**Phase 1: Foundation** (In Progress)
- ✅ Data model defined
- 🔄 GitHub repo scaffold
- 🔄 Python classification service
- ⏳ Content conversion

**Phase 2: Human Interfaces** (Pending)
- Visual Engram Creator
- Page Builder
- Customer site deployment

**Phase 3: Agent Integration** (Pending)
- Forge skills sync
- Engram search
- Local workspace sync

**Phase 4: Intelligence** (Pending)
- LLM chat for customers
- LLM chat for employees
- Autonomous agents

## License

© 2026 Venture Home Solar, LLC
trigger deploy
