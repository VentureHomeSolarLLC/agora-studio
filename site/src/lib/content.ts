import fs from "fs";
import path from "path";
import matter from "gray-matter";

const CUSTOMER_PAGES_DIR = path.join(process.cwd(), "..", "customer-pages");
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

export interface Article {
  slug: string;
  title: string;
  content_type: string;
  audience: string[];
  tags: string[];
  content: string;
  excerpt?: string;
  description?: string;
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

function normalizeAudience(data: Record<string, any>): string[] {
  if (Array.isArray(data.audience) && data.audience.length > 0) {
    return data.audience;
  }
  const visibility = data.visibility;
  const tags = Array.isArray(data.tags) ? data.tags : [];
  if (visibility === "customer" || visibility === "external" || tags.includes("external")) {
    return ["customer"];
  }
  return [];
}

function buildExcerpt(content: string): string {
  return content.slice(0, 200).replace(/#.*\n/g, "").trim();
}

export function getAllCustomerPages(): Article[] {
  if (!fs.existsSync(CUSTOMER_PAGES_DIR)) {
    return [];
  }

  const entries = fs.readdirSync(CUSTOMER_PAGES_DIR, { withFileTypes: true });
  const articles: Article[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const slug = entry.name.replace(".md", "");
      const filePath = path.join(CUSTOMER_PAGES_DIR, entry.name);
      const fileContent = fs.readFileSync(filePath, "utf-8");
      const { data, content } = matter(fileContent);
      const audience = normalizeAudience(data);

      articles.push({
        slug,
        title: data.title || slug,
        content_type: data.content_type || "customer-page",
        audience,
        tags: data.tags || [],
        content,
        description: data.description || data.card || "",
        excerpt: buildExcerpt(content),
      });
      continue;
    }

    if (entry.isDirectory()) {
      const indexPath = path.join(CUSTOMER_PAGES_DIR, entry.name, "_index.md");
      if (!fs.existsSync(indexPath)) continue;
      const fileContent = fs.readFileSync(indexPath, "utf-8");
      const { data, content } = matter(fileContent);
      const audience = normalizeAudience(data);

      articles.push({
        slug: entry.name,
        title: data.title || entry.name,
        content_type: data.content_type || "customer-page",
        audience,
        tags: data.tags || [],
        content,
        description: data.description || data.card || "",
        excerpt: buildExcerpt(content),
      });
    }
  }

  return articles.sort((a, b) => a.title.localeCompare(b.title));
}

export function getCustomerPageBySlug(slug: string): Article | null {
  if (!fs.existsSync(CUSTOMER_PAGES_DIR)) return null;

  const filePath = path.join(CUSTOMER_PAGES_DIR, `${slug}.md`);
  const folderPath = path.join(CUSTOMER_PAGES_DIR, slug, "_index.md");

  let targetPath: string | null = null;
  if (fs.existsSync(folderPath)) {
    targetPath = folderPath;
  } else if (fs.existsSync(filePath)) {
    targetPath = filePath;
  }

  if (!targetPath) return null;

  const fileContent = fs.readFileSync(targetPath, "utf-8");
  const { data, content } = matter(fileContent);
  const audience = normalizeAudience(data);

  return {
    slug,
    title: data.title || slug,
    content_type: data.content_type || "customer-page",
    audience,
    tags: data.tags || [],
    content,
    description: data.description || data.card || "",
    excerpt: buildExcerpt(content),
  };
}

export function getPublicArticles(): Article[] {
  return getAllCustomerPages().filter((article) => isPublicContent(article.audience));
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
  return getAllConcepts(false).filter((c) => isPublicContent(c.audience));
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
    excerpt: buildExcerpt(content),
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

export function getArticlesByCategory(category: string): Article[] {
  const concepts = getPublicArticles();
  
  const categoryMap: Record<string, string[]> = {
    "billing": ["net-metering", "utility", "bill", "metering"],
    "incentives": ["incentive", "srec", "rec", "tax", "credit", "rebate"],
    "batteries": ["battery", "powerwall", "enphase", "backup", "outage"],
    "maintenance": ["panel", "cleaning", "maintenance", "warranty", "equipment"],
    "troubleshooting": ["troubleshoot", "issue", "problem", "error"],
    "installation": ["install", "pto", "permission", "interconnection"],
  };
  
  const tags = categoryMap[category] || [category];
  
  return concepts.filter((c) =>
    tags.some((tag) =>
      c.tags.some((t) => t.toLowerCase().includes(tag)) ||
      c.title.toLowerCase().includes(tag)
    )
  );
}
