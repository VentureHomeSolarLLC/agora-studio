from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Literal
import yaml
import os
from datetime import datetime

app = FastAPI(title="Agora Studio API", version="1.0.0")

# Models
class ContentClassification(BaseModel):
    content_type: Literal["concept", "lesson", "skill", "update"]
    confidence: float
    suggested_title: str
    suggested_tags: List[str]
    related_concepts: List[str]
    if_update: Optional[str] = None
    reasoning: str

class PageManifest(BaseModel):
    page_id: str
    title: str
    card: str
    assemble_from: List[dict]
    visibility: Literal["customer", "internal", "both"]
    tags: List[str]

class ConceptCreate(BaseModel):
    title: str
    content: str
    author: str
    suggested_tags: Optional[List[str]] = []

# Routes
@app.post("/api/classify", response_model=ContentClassification)
async def classify_content(payload: ConceptCreate):
    """
    Analyze content and determine if it should be a concept, lesson, skill, or update.
    """
    # TODO: Integrate with OpenAI for classification
    # For now, return mock response based on content analysis
    
    content_lower = payload.content.lower()
    
    # Simple heuristics (replace with LLM call)
    if "how to" in content_lower or "steps:" in content_lower:
        content_type = "skill"
        confidence = 0.85
    elif "customer" in content_lower and "expected" in content_lower:
        content_type = "lesson"
        confidence = 0.80
    elif "what is" in content_lower or "explains" in content_lower:
        content_type = "concept"
        confidence = 0.90
    else:
        content_type = "concept"
        confidence = 0.70
    
    return ContentClassification(
        content_type=content_type,
        confidence=confidence,
        suggested_title=payload.title,
        suggested_tags=payload.suggested_tags or ["battery", "troubleshooting"],
        related_concepts=["backup-reserve", "storm-guard"],
        reasoning=f"Detected {content_type} patterns in content"
    )

@app.post("/api/concepts")
async def create_concept(payload: ConceptCreate, classification: ContentClassification):
    """
    Create a new concept file with proper YAML frontmatter.
    """
    concept_id = payload.title.lower().replace(" ", "-").replace("?", "").replace("'", "")
    
    frontmatter = {
        "concept_id": concept_id,
        "title": payload.title,
        "content_type": classification.content_type,
        "audience": ["customer", "agent"],
        "tags": classification.suggested_tags,
        "created": datetime.now().isoformat(),
        "author": payload.author,
        "used_by_engrams": [],
        "related_concepts": classification.related_concepts
    }
    
    content = f"""---
{yaml.dump(frontmatter, default_flow_style=False)}---

{payload.content}
"""
    
    # TODO: Commit to GitHub
    filepath = f"concepts/{concept_id}.md"
    
    return {
        "success": True,
        "filepath": filepath,
        "concept_id": concept_id,
        "preview": content[:500]
    }

@app.post("/api/pages/assemble")
async def assemble_page(manifest: PageManifest):
    """
    Assemble a customer-facing page from concept references.
    """
    # TODO: Read manifests, pull content, filter by audience, generate final markdown
    
    return {
        "page_id": manifest.page_id,
        "title": manifest.title,
        "sections": len(manifest.assemble_from),
        "status": "assembled",
        "output_path": f"customer-pages/{manifest.page_id}.md"
    }

@app.get("/api/concepts/search")
async def search_concepts(q: str, limit: int = 10):
    """
    Search concepts by content similarity.
    """
    # TODO: Implement vector search with ChromaDB
    
    return {
        "query": q,
        "results": [
            {
                "concept_id": "backup-reserve",
                "title": "Backup Reserve Settings",
                "preview": "Your backup reserve is the percentage...",
                "score": 0.92
            },
            {
                "concept_id": "storm-guard",
                "title": "Storm Guard Feature",
                "preview": "Storm Guard automatically pre-charges...",
                "score": 0.85
            }
        ]
    }

@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
