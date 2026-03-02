import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { EngramMapClient } from "@/components/engram-map/EngramMapClient";
import type { EngramMap, GraphLink, GraphNode, MapNode } from "@/components/engram-map/types";

const ENGRAMS_V2_DIR = path.join(process.cwd(), "..", "engrams-v2");
const REPO_TREE_BASE = "https://github.com/VentureHomeSolarLLC/agora-studio/tree/main";
const REPO_BLOB_BASE = "https://github.com/VentureHomeSolarLLC/agora-studio/blob/main";

function getEngramMapData(): EngramMap[] {
  if (!fs.existsSync(ENGRAMS_V2_DIR)) return [];

  const entries = fs.readdirSync(ENGRAMS_V2_DIR, { withFileTypes: true });
  const engrams: EngramMap[] = [];

  entries.forEach((entry) => {
    if (!entry.isDirectory()) return;
    const engramDir = path.join(ENGRAMS_V2_DIR, entry.name);
    const indexPath = path.join(engramDir, "_index.md");
    if (!fs.existsSync(indexPath)) return;

    const { data } = matter(fs.readFileSync(indexPath, "utf-8"));
    const title = data.title || entry.name;
    const description = data.description || "";
    const tags = Array.isArray(data.tags) ? data.tags : [];

    const conceptsDir = path.join(engramDir, "concepts");
    const lessonsDir = path.join(engramDir, "lessons");

    const concepts = loadChildNodes(conceptsDir, "concept", entry.name);
    const lessons = loadChildNodes(lessonsDir, "lesson", entry.name);

    engrams.push({
      id: entry.name,
      title,
      description,
      concepts,
      lessons,
      tags,
    });
  });

  return engrams.sort((a, b) => a.title.localeCompare(b.title));
}

function loadChildNodes(dirPath: string, type: "concept" | "lesson", parentId: string): MapNode[] {
  if (!fs.existsSync(dirPath)) {
    return [
      {
        id: `${parentId}-${type}-none`,
        title: type === "concept" ? "No concepts yet" : "No lessons yet",
        type: "placeholder",
        parentId,
      },
    ];
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".md"));
  if (files.length === 0) {
    return [
      {
        id: `${parentId}-${type}-none`,
        title: type === "concept" ? "No concepts yet" : "No lessons yet",
        type: "placeholder",
        parentId,
      },
    ];
  }

  return files
    .map((file) => {
      const filePath = path.join(dirPath, file);
      const { data } = matter(fs.readFileSync(filePath, "utf-8"));
      const title = data.title || file.replace(/\.md$/, "");
      const tags = Array.isArray(data.tags) ? data.tags : [];
      const folder = type === "concept" ? "concepts" : "lessons";
      const relativePath = `engrams-v2/${parentId}/${folder}/${file}`;
      return {
        id: file.replace(/\.md$/, ""),
        title,
        type,
        parentId,
        url: `${REPO_BLOB_BASE}/${relativePath}`,
        tags,
      } as MapNode;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildGraph(engrams: EngramMap[]) {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const tagBuckets = new Map<string, GraphNode[]>();
  const engramNodeIds = new Set<string>();

  engrams.forEach((engram) => {
    const engramNodeId = `engram:${engram.id}`;
    engramNodeIds.add(engramNodeId);
    const conceptCount = engram.concepts.filter((c) => c.type !== "placeholder").length;
    const lessonCount = engram.lessons.filter((l) => l.type !== "placeholder").length;
    const engramNode: GraphNode = {
      id: engramNodeId,
      name: engram.title,
      type: "engram",
      url: `${REPO_TREE_BASE}/engrams-v2/${engram.id}`,
      counts: { concepts: conceptCount, lessons: lessonCount },
      tags: engram.tags || [],
    };
    nodes.push(engramNode);

    const addTagBucket = (node: GraphNode) => {
      if (!node.tags || node.tags.length === 0) return;
      node.tags.forEach((tag) => {
        const key = tag.toLowerCase();
        const bucket = tagBuckets.get(key) || [];
        bucket.push(node);
        tagBuckets.set(key, bucket);
      });
    };

    engram.concepts
      .filter((concept) => concept.type !== "placeholder")
      .forEach((concept) => {
        const nodeId = `concept:${engram.id}/${concept.id}`;
        const node: GraphNode = {
          id: nodeId,
          name: concept.title,
          type: "concept",
          url: concept.url,
          parentId: engramNodeId,
          tags: concept.tags || [],
        };
        nodes.push(node);
        links.push({ source: engramNodeId, target: nodeId, type: "structure" });
        addTagBucket(node);
      });

    engram.lessons
      .filter((lesson) => lesson.type !== "placeholder")
      .forEach((lesson) => {
        const nodeId = `lesson:${engram.id}/${lesson.id}`;
        const node: GraphNode = {
          id: nodeId,
          name: lesson.title,
          type: "lesson",
          url: lesson.url,
          parentId: engramNodeId,
          tags: lesson.tags || [],
        };
        nodes.push(node);
        links.push({ source: engramNodeId, target: nodeId, type: "structure" });
        addTagBucket(node);
      });
  });

  const tagLinkSet = new Set<string>();
  const linkCounts = new Map<string, number>();
  const MAX_TAG_LINKS = 3;

  tagBuckets.forEach((bucket) => {
    for (let i = 0; i < bucket.length; i += 1) {
      for (let j = i + 1; j < bucket.length; j += 1) {
        const source = bucket[i];
        const target = bucket[j];
        const key = [source.id, target.id].sort().join("|");
        if (tagLinkSet.has(key)) continue;
        const sourceCount = linkCounts.get(source.id) || 0;
        const targetCount = linkCounts.get(target.id) || 0;
        if (sourceCount >= MAX_TAG_LINKS || targetCount >= MAX_TAG_LINKS) continue;
        tagLinkSet.add(key);
        links.push({ source: source.id, target: target.id, type: "tag" });
        linkCounts.set(source.id, sourceCount + 1);
        linkCounts.set(target.id, targetCount + 1);
      }
    }
  });

  return { nodes, links };
}

export default async function EngramMapPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const engrams = getEngramMapData();
  const { nodes, links } = buildGraph(engrams);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20]">Engram Map</h1>
        <p className="text-[#231F20]/70 mt-2">
          A visual map of Engram v2 relationships (skills → concepts → lessons).
        </p>
      </div>
      <EngramMapClient nodes={nodes} links={links} />

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {engrams.map((engram) => (
          <div key={engram.id} className="bg-white border border-[#B1C3BD]/30 rounded-xl p-4">
            <h2 className="text-lg font-semibold text-[#231F20]">{engram.title}</h2>
            <p className="text-sm text-[#231F20]/60 mt-1">{engram.description || "No description yet."}</p>
            <div className="flex flex-wrap gap-3 text-xs text-[#231F20]/70 mt-3">
              <span>{engram.concepts.filter((c) => c.type !== "placeholder").length} concepts</span>
              <span>{engram.lessons.filter((l) => l.type !== "placeholder").length} lessons</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
