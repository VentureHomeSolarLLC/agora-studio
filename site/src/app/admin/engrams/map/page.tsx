import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { EngramMapClient } from "@/components/engram-map/EngramMapClient";
import type { EngramMap, Line, MapNode, PositionedNode } from "@/components/engram-map/types";

const ENGRAMS_V2_DIR = path.join(process.cwd(), "..", "engrams-v2");

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

    const conceptsDir = path.join(engramDir, "concepts");
    const lessonsDir = path.join(engramDir, "lessons");

    const concepts = loadChildNodes(conceptsDir, "concept");
    const lessons = loadChildNodes(lessonsDir, "lesson");

    engrams.push({
      id: entry.name,
      title,
      description,
      concepts,
      lessons,
    });
  });

  return engrams.sort((a, b) => a.title.localeCompare(b.title));
}

function loadChildNodes(dirPath: string, type: "concept" | "lesson"): MapNode[] {
  if (!fs.existsSync(dirPath)) {
    return [
      {
        id: `${type}-none`,
        title: type === "concept" ? "No concepts yet" : "No lessons yet",
        type: "placeholder",
      },
    ];
  }

  const files = fs.readdirSync(dirPath).filter((file) => file.endsWith(".md"));
  if (files.length === 0) {
    return [
      {
        id: `${type}-none`,
        title: type === "concept" ? "No concepts yet" : "No lessons yet",
        type: "placeholder",
      },
    ];
  }

  return files
    .map((file) => {
      const filePath = path.join(dirPath, file);
      const { data } = matter(fs.readFileSync(filePath, "utf-8"));
      const title = data.title || file.replace(/\.md$/, "");
      return {
        id: file.replace(/\.md$/, ""),
        title,
        type,
      } as MapNode;
    })
    .sort((a, b) => a.title.localeCompare(b.title));
}

function buildLayout(engrams: EngramMap[]) {
  const nodeWidth = 220;
  const nodeHeight = 44;
  const itemGap = 64;
  const rowGap = 56;
  const engramX = 40;
  const conceptX = 360;
  const lessonX = 700;

  const nodes: PositionedNode[] = [];
  const lines: Line[] = [];
  let currentY = 40;

  engrams.forEach((engram) => {
    const conceptCount = Math.max(engram.concepts.length, 1);
    const lessonCount = Math.max(engram.lessons.length, 1);
    const rowItems = Math.max(conceptCount, lessonCount);
    const rowHeight = rowItems * itemGap;
    const rowTop = currentY;

    const engramY = rowTop + (rowHeight - nodeHeight) / 2;
    const engramNode: PositionedNode = {
      id: engram.id,
      title: engram.title,
      type: "engram",
      x: engramX,
      y: engramY,
      width: nodeWidth,
      height: nodeHeight,
    };
    nodes.push(engramNode);

    engram.concepts.forEach((concept, index) => {
      const y = rowTop + index * itemGap;
      const node: PositionedNode = {
        ...concept,
        x: conceptX,
        y,
        width: nodeWidth,
        height: nodeHeight,
      };
      nodes.push(node);
      lines.push({
        x1: engramX + nodeWidth,
        y1: engramY + nodeHeight / 2,
        x2: conceptX,
        y2: y + nodeHeight / 2,
      });
    });

    engram.lessons.forEach((lesson, index) => {
      const y = rowTop + index * itemGap;
      const node: PositionedNode = {
        ...lesson,
        x: lessonX,
        y,
        width: nodeWidth,
        height: nodeHeight,
      };
      nodes.push(node);
      lines.push({
        x1: engramX + nodeWidth,
        y1: engramY + nodeHeight / 2,
        x2: lessonX,
        y2: y + nodeHeight / 2,
      });
    });

    currentY += rowHeight + rowGap;
  });

  const width = 980;
  const height = Math.max(currentY, 300);
  return { nodes, lines, width, height };
}

export default async function EngramMapPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/auth/signin");
  }

  const engrams = getEngramMapData();
  const { nodes, lines, width, height } = buildLayout(engrams);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#231F20]">Engram Map</h1>
        <p className="text-[#231F20]/70 mt-2">
          A visual map of Engram v2 relationships (skills → concepts → lessons).
        </p>
      </div>
      <EngramMapClient nodes={nodes} lines={lines} width={width} height={height} />

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
