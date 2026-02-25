import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CONCEPTS_DIR = path.join(process.cwd(), "..", "concepts");
const ENGRAMS_DIR = path.join(process.cwd(), "..", "engrams");

export interface Concept {
  slug: string;
  concept_id: string;
  title: string;
  content_type: string;
  audience: string[];
  tags: string[];
  content: string;
  excerpt?: string;
}

export interface Engram {
  slug: string;
  engram_id: string;
  title: string;
  description: string;
  hasSkill: boolean;
}

export function getAllConcepts(): Concept[] {
  if (!fs.existsSync(CONCEPTS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(CONCEPTS_DIR);
  const concepts: Concept[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    
    const slug = file.replace(".md", "");
    const concept = getConceptBySlug(slug);
    if (concept) concepts.push(concept);
  }

  return concepts.sort((a, b) => a.title.localeCompare(b.title));
}

export function getConceptBySlug(slug: string): Concept | null {
  const filePath = path.join(CONCEPTS_DIR, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  return {
    slug,
    concept_id: data.concept_id || slug,
    title: data.title || slug,
    content_type: data.content_type || "concept",
    audience: data.audience || [],
    tags: data.tags || [],
    content,
    excerpt: content.slice(0, 200).replace(/#.*\n/g, "").trim(),
  };
}

export function getAllEngrams(): Engram[] {
  if (!fs.existsSync(ENGRAMS_DIR)) {
    return [];
  }

  const dirs = fs.readdirSync(ENGRAMS_DIR);
  const engrams: Engram[] = [];

  for (const dir of dirs) {
    const engramPath = path.join(ENGRAMS_DIR, dir);
    if (!fs.statSync(engramPath).isDirectory()) continue;

    const indexPath = path.join(engramPath, "_index.md");
    const skillPath = path.join(engramPath, "SKILL.md");

    if (fs.existsSync(indexPath)) {
      const fileContent = fs.readFileSync(indexPath, "utf-8");
      const { data } = matter(fileContent);

      engrams.push({
        slug: dir,
        engram_id: data.engram_id || dir,
        title: data.title || dir,
        description: data.description || "",
        hasSkill: fs.existsSync(skillPath),
      });
    }
  }

  return engrams.sort((a, b) => a.title.localeCompare(b.title));
}

export function searchConcepts(query: string): Concept[] {
  const concepts = getAllConcepts();
  const lowerQuery = query.toLowerCase();
  
  return concepts.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      c.content.toLowerCase().includes(lowerQuery)
  );
}
