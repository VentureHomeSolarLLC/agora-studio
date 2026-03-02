import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

const EXCLUDED_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".vercel",
  ".turbo",
  "dist",
  "build",
]);

type WikiSource = {
  id: string;
  title: string;
  tags: string[];
  excerpt?: string;
  type: string;
  collection: string;
  path: string;
};

function walkMarkdownFiles(dir: string, baseDir: string, results: string[]) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walkMarkdownFiles(path.join(dir, entry.name), baseDir, results);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".md")) {
      const filePath = path.join(dir, entry.name);
      const relativePath = path
        .relative(baseDir, filePath)
        .replace(/\\/g, "/");
      results.push(relativePath);
    }
  }
}

function inferType(relativePath: string, data: Record<string, any>) {
  const frontType = typeof data.type === "string" ? data.type : "";
  const contentType = typeof data.content_type === "string" ? data.content_type : "";
  if (frontType) return frontType;
  if (contentType) return contentType;

  if (relativePath.startsWith("engrams-v2/")) {
    if (relativePath.includes("/concepts/")) return "engram-concept";
    if (relativePath.includes("/lessons/")) return "engram-lesson";
    if (relativePath.endsWith("/SKILL.md")) return "engram-skill";
    if (relativePath.endsWith("/_index.md")) return "engram-index";
    return "engram-v2";
  }

  if (relativePath.startsWith("engrams/")) {
    if (relativePath.includes("/concepts/")) return "engram-concept";
    if (relativePath.includes("/lessons/")) return "engram-lesson";
    if (relativePath.endsWith("/SKILL.md")) return "engram-skill";
    if (relativePath.endsWith("/_index.md")) return "engram-index";
    return "engram";
  }

  if (relativePath.startsWith("customer-pages/")) return "customer-article";
  if (relativePath.startsWith("concepts/")) return "internal-concept";
  if (relativePath.startsWith("docs/")) return "doc";

  return "markdown";
}

function inferCollection(relativePath: string) {
  const [top] = relativePath.split("/");
  switch (top) {
    case "customer-pages":
      return "Customer";
    case "concepts":
      return "Internal";
    case "engrams-v2":
      return "Engram v2";
    case "engrams":
      return "Engram";
    case "docs":
      return "Docs";
    default:
      return "Repo";
  }
}

function buildExcerpt(content: string) {
  return content.slice(0, 200).replace(/#.*\n/g, "").trim();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";

    const repoRoot = path.join(process.cwd(), "..");
    const files: string[] = [];
    walkMarkdownFiles(repoRoot, repoRoot, files);

    const indexed = files.map((relativePath) => {
      const fullPath = path.join(repoRoot, relativePath);
      const fileContent = fs.readFileSync(fullPath, "utf-8");
      const { data, content } = matter(fileContent);
      const title =
        (typeof data.title === "string" && data.title.trim()) ||
        relativePath.split("/").slice(-1)[0].replace(/\.md$/, "");
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const type = inferType(relativePath, data);
      const collection = inferCollection(relativePath);
      const source: WikiSource = {
        id: relativePath,
        title,
        tags,
        excerpt: buildExcerpt(content),
        type,
        collection,
        path: relativePath,
      };
      const searchText = `
        ${title}
        ${tags.join(" ")}
        ${relativePath}
        ${type}
        ${collection}
        ${content}
      `.toLowerCase();
      return { source, searchText };
    });

    const sorted = indexed
      .map((entry) => entry.source)
      .sort(
        (a, b) =>
          a.collection.localeCompare(b.collection) || a.title.localeCompare(b.title)
      );

    if (!query) {
      return NextResponse.json({ sources: sorted });
    }

    const filtered = indexed
      .filter((entry) => entry.searchText.includes(query))
      .map((entry) => entry.source)
      .sort(
        (a, b) =>
          a.collection.localeCompare(b.collection) || a.title.localeCompare(b.title)
      );

    return NextResponse.json({ sources: filtered });
  } catch (error) {
    console.error("Error fetching wiki sources:", error);
    return NextResponse.json(
      { error: "Failed to fetch markdown sources" },
      { status: 500 }
    );
  }
}
