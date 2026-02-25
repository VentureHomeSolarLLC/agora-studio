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
  audience?: string[];
}

// Check if content is public (customer-facing)
export function isPublicContent(audience: string[]): boolean {
  return audience.includes("customer") || audience.includes("external");
}

export function getAllConcepts(includeInternal = false): Concept[] {
  if (!fs.existsSync(CONCEPTS_DIR)) {
    return [];
  }
  
  const files = fs.readdirSync(CONCEPTS_DIR);
  const concepts: Concept[] = [];

  for (const file of files) {
    if (!file.endsWith(".md")) continue;
    
    const slug = file.replace(".md", "");
    const concept = getConceptBySlug(slug, includeInternal);
    if (concept) concepts.push(concept);
  }

  return concepts.sort((a, b) => a.title.localeCompare(b.title));
}

export function getPublicConcepts(): Concept[] {
  return getAllConcepts(false).filter(c => isPublicContent(c.audience));
}

export function getConceptBySlug(slug: string, includeInternal = false): Concept | null {
  const filePath = path.join(CONCEPTS_DIR, `${slug}.md`);
  
  if (!fs.existsSync(filePath)) return null;

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  const audience = data.audience || [];
  
  // If not logged in and not public content, return null
  if (!includeInternal && !isPublicContent(audience)) {
    return null;
  }

  return {
    slug,
    concept_id: data.concept_id || slug,
    title: data.title || slug,
    content_type: data.content_type || "concept",
    audience,
    tags: data.tags || [],
    content,
    excerpt: content.slice(0, 200).replace(/#.*\n/g, "").trim(),
  };
}

export function getAllEngrams(includeInternal = false): Engram[] {
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
      const audience = data.audience || [];

      // Skip internal-only engrams for public
      if (!includeInternal && !isPublicContent(audience) && !audience.includes("agent")) {
        // Still include agent-facing engrams as they might have customer value
      }

      engrams.push({
        slug: dir,
        engram_id: data.engram_id || dir,
        title: data.title || dir,
        description: data.description || "",
        hasSkill: fs.existsSync(skillPath),
        audience,
      });
    }
  }

  return engrams.sort((a, b) => a.title.localeCompare(b.title));
}

export function searchConcepts(query: string, includeInternal = false): Concept[] {
  const concepts = getAllConcepts(includeInternal);
  const lowerQuery = query.toLowerCase();
  
  return concepts.filter(
    (c) =>
      c.title.toLowerCase().includes(lowerQuery) ||
      c.tags.some((t) => t.toLowerCase().includes(lowerQuery)) ||
      c.content.toLowerCase().includes(lowerQuery)
  );
}

export function getConceptsByCategory(category: string): Concept[] {
  const concepts = getPublicConcepts();
  
  const categoryMap: Record<string, string[]> = {
    "billing": ["net-metering", "utility", "bill", "metering"],
    "incentives": ["incentive", "srec", "rec", "tax", "credit", "rebate"],
    "batteries": ["battery", "powerwall", "enphase", "backup", "outage"],
    "maintenance": ["panel", "cleaning", "maintenance", "warranty", "equipment"],
    "troubleshooting": ["troubleshoot", "issue", "problem", "error"],
    "installation": ["install", "pto", "permission", "interconnection"],
  };
  
  const tags = categoryMap[category] || [category];
  
  return concepts.filter(c => 
    tags.some(tag => 
      c.tags.some(t => t.toLowerCase().includes(tag)) ||
      c.title.toLowerCase().includes(tag)
    )
  );
}
