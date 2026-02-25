from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
from typing import List, Optional, Literal
import yaml
import os
import re
import json
from datetime import datetime
from git import Repo
import openai
import chromadb
from chromadb.config import Settings

app = FastAPI(title="Agora Studio API", version="1.0.0")

# Initialize ChromaDB for vector search
chroma_client = chromadb.Client(Settings(
    chroma_db_impl="duckdb+parquet",
    persist_directory="./chroma_db"
))
concepts_collection = chroma_client.get_or_create_collection("concepts")

# OpenAI setup
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# Models
class ContentClassification(BaseModel):
    content_type: Literal["concept", "lesson", "skill", "update"]
    confidence: float = Field(ge=0, le=1)
    suggested_title: str
    suggested_tags: List[str]
    related_concepts: List[str]
    if_update: Optional[str] = None
    reasoning: str

class ConceptCreate(BaseModel):
    title: str
    content: str
    author: str
    suggested_tags: Optional[List[str]] = []

class EngramCreate(BaseModel):
    engram_id: str
    title: str
    description: str
    category: str
    author: str
    concept_content: Optional[str] = None
    skill_content: Optional[str] = None

class PageManifest(BaseModel):
    page_id: str
    title: str
    card: str
    description: str
    visibility: Literal["internal", "external", "both"]
    tags: List[str]
    author: str
    assemble_from: List[dict]

class SearchQuery(BaseModel):
    query: str
    limit: int = 10

# Helper functions
def kebab_case(text: str) -> str:
    """Convert text to kebab-case"""
    text = text.lower()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[-\s]+', '-', text)
    return text.strip('-')

def generate_yaml_frontmatter(data: dict) -> str:
    """Generate YAML frontmatter from dict"""
    return yaml.dump(data, default_flow_style=False, allow_unicode=True, sort_keys=False)

def get_embedding(text: str) -> List[float]:
    """Get OpenAI embedding for text"""
    if not openai.api_key:
        return []
    response = openai.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

# Routes
@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0", "timestamp": datetime.now().isoformat()}

@app.post("/api/classify", response_model=ContentClassification)
async def classify_content(payload: ConceptCreate):
    """
    Analyze content and determine if it should be a concept, lesson, skill, or update.
    """
    if not openai.api_key:
        # Fallback classification without OpenAI
        content_lower = payload.content.lower()
        
        if "how to" in content_lower or "steps:" in content_lower:
            content_type = "skill"
            confidence = 0.75
        elif "customer" in content_lower and ("expected" in content_lower or "thought" in content_lower):
            content_type = "lesson"
            confidence = 0.70
        elif "what is" in content_lower or "explains" in content_lower:
            content_type = "concept"
            confidence = 0.80
        else:
            content_type = "concept"
            confidence = 0.60
        
        return ContentClassification(
            content_type=content_type,
            confidence=confidence,
            suggested_title=payload.title,
            suggested_tags=payload.suggested_tags or ["general"],
            related_concepts=[],
            reasoning=f"Detected {content_type} patterns in content (fallback classification)"
        )
    
    # OpenAI classification
    prompt = f"""Analyze this knowledge base content and classify it:

CONTENT TITLE: {payload.title}
CONTENT: {payload.content[:2000]}

Classify as one of:
- CONCEPT: Explains what something is, how it works. Examples: "What is net metering?", "How does Storm Guard work?"
- LESSON: Captures learned experience from a specific case. Examples: "Customer expected whole-home backup but only had partial"
- SKILL: Step-by-step instructions for an agent. Examples: "How to troubleshoot Envoy connectivity"
- UPDATE: Should this modify an existing concept?

Return JSON with:
- content_type: concept|lesson|skill|update
- confidence: 0-1
- suggested_title: improved title if needed
- suggested_tags: 3-5 relevant tags
- if_update: which concept to update (if applicable)
- reasoning: brief explanation
"""
    
    response = openai.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "You are a knowledge management classifier. Return only valid JSON."},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    result = json.loads(response.choices[0].message.content)
    
    return ContentClassification(
        content_type=result.get("content_type", "concept"),
        confidence=result.get("confidence", 0.5),
        suggested_title=result.get("suggested_title", payload.title),
        suggested_tags=result.get("suggested_tags", []),
        related_concepts=result.get("related_concepts", []),
        if_update=result.get("if_update"),
        reasoning=result.get("reasoning", "")
    )

@app.post("/api/concepts")
async def create_concept(payload: ConceptCreate, classification: ContentClassification):
    """
    Create a new concept file with proper YAML frontmatter.
    """
    concept_id = kebab_case(payload.title)
    
    frontmatter = {
        "concept_id": concept_id,
        "title": payload.title,
        "content_type": "concept",
        "audience": ["customer", "agent"],
        "tags": classification.suggested_tags,
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat(),
        "author": payload.author,
        "used_by_engrams": [],
        "related_concepts": classification.related_concepts
    }
    
    content = f"""---
{generate_yaml_frontmatter(frontmatter)}---

{payload.content}
"""
    
    filepath = f"concepts/{concept_id}.md"
    
    # Save to disk (in production, commit to GitHub)
    os.makedirs("concepts", exist_ok=True)
    with open(filepath, "w") as f:
        f.write(content)
    
    # Add to vector DB for search
    embedding = get_embedding(payload.content)
    if embedding:
        concepts_collection.add(
            ids=[concept_id],
            embeddings=[embedding],
            metadatas=[{
                "title": payload.title,
                "tags": ",".join(classification.suggested_tags)
            }],
            documents=[payload.content]
        )
    
    return {
        "success": True,
        "filepath": filepath,
        "concept_id": concept_id,
        "preview": content[:500]
    }

@app.post("/api/engrams")
async def create_engram(payload: EngramCreate):
    """
    Create a new Engram structure with _index.md and SKILL.md.
    """
    engram_dir = f"engrams/{payload.engram_id}"
    os.makedirs(engram_dir, exist_ok=True)
    os.makedirs(f"{engram_dir}/concepts", exist_ok=True)
    
    # Create _index.md (human-facing guide)
    index_frontmatter = {
        "engram_id": payload.engram_id,
        "title": payload.title,
        "description": payload.description,
        "category": payload.category,
        "audience": ["customer"],
        "tags": [payload.category],
        "created": datetime.now().isoformat(),
        "updated": datetime.now().isoformat()
    }
    
    index_content = f"""---
{generate_yaml_frontmatter(index_frontmatter)}---

# {payload.title}

{payload.concept_content or "(Content to be added)"}
"""
    
    with open(f"{engram_dir}/_index.md", "w") as f:
        f.write(index_content)
    
    # Create SKILL.md (agent instructions)
    skill_frontmatter = {
        "skill_id": f"{payload.engram_id}-skill",
        "name": f"Handle {payload.title}",
        "type": "consultation",
        "triggers": [payload.title.lower(), payload.category],
        "required_concepts": [],
        "related_skills": []
    }
    
    skill_content = f"""---
{generate_yaml_frontmatter(skill_frontmatter)}---

# Skill: {payload.title}

## Goal
Handle customer inquiries about {payload.title}.

## Prerequisites
- Understand customer's situation
- Check relevant context

## Instructions
{payload.skill_content or "(Instructions to be added)"}
"""
    
    with open(f"{engram_dir}/SKILL.md", "w") as f:
        f.write(skill_content)
    
    return {
        "success": True,
        "engram_id": payload.engram_id,
        "directory": engram_dir,
        "files_created": ["_index.md", "SKILL.md", "concepts/"]
    }

@app.get("/api/concepts/search")
async def search_concepts(q: str, limit: int = 10):
    """
    Search concepts by content similarity.
    """
    if not openai.api_key:
        return {
            "query": q,
            "results": [],
            "note": "OpenAI API key not configured, search unavailable"
        }
    
    query_embedding = get_embedding(q)
    
    results = concepts_collection.query(
        query_embeddings=[query_embedding],
        n_results=limit
    )
    
    return {
        "query": q,
        "results": [
            {
                "concept_id": id,
                "title": meta.get("title", ""),
                "tags": meta.get("tags", "").split(","),
                "score": 1 - distance  # Convert distance to similarity
            }
            for id, meta, distance in zip(
                results["ids"][0],
                results["metadatas"][0],
                results["distances"][0]
            )
        ]
    }

@app.post("/api/pages/assemble")
async def assemble_page(manifest: PageManifest):
    """
    Assemble a customer-facing page from concept references.
    """
    assembled_sections = []
    
    for item in manifest.assemble_from:
        source_path = item.get("source", "")
        sections = item.get("sections", "all")
        transform = item.get("transform", "full")
        
        # Read source file
        try:
            with open(source_path, "r") as f:
                content = f.read()
            
            # Extract content after YAML frontmatter
            if "---" in content:
                parts = content.split("---", 2)
                if len(parts) >= 3:
                    body = parts[2].strip()
                else:
                    body = content
            else:
                body = content
            
            # Apply transformation
            if transform == "simplify":
                # Remove internal links, simplify technical terms
                body = re.sub(r'\[\[.*?\]\]', '', body)
            
            assembled_sections.append({
                "source": source_path,
                "content": body
            })
            
        except FileNotFoundError:
            assembled_sections.append({
                "source": source_path,
                "error": "File not found"
            })
    
    # Generate output
    output_content = f"""---
title: {manifest.title}
description: {manifest.description}
card: {manifest.card}
visibility: {manifest.visibility}
tags: {manifest.tags}
author: {manifest.author}
updated: {datetime.now().isoformat()}
---

# {manifest.title}

"""
    
    for section in assembled_sections:
        if "error" not in section:
            output_content += section["content"] + "\n\n"
    
    return {
        "page_id": manifest.page_id,
        "title": manifest.title,
        "sections": len(assembled_sections),
        "content": output_content
    }

@app.post("/api/commit")
async def commit_changes(background_tasks: BackgroundTasks, message: str):
    """
    Commit changes to GitHub.
    """
    def do_commit():
        try:
            repo = Repo(".")
            repo.git.add("-A")
            repo.index.commit(message)
            origin = repo.remote("origin")
            origin.push()
            return {"success": True, "message": message}
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    background_tasks.add_task(do_commit)
    
    return {"status": "commit queued", "message": message}

if __name__ == "__main__":
    import uvicorn
    import json
    
    # Ensure directories exist
    os.makedirs("concepts", exist_ok=True)
    os.makedirs("engrams", exist_ok=True)
    os.makedirs("lessons", exist_ok=True)
    os.makedirs("customer-pages", exist_ok=True)
    
    uvicorn.run(app, host="0.0.0.0", port=8000)
