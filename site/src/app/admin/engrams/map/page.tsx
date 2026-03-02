import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

const ENGRAMS_V2_DIR = path.join(process.cwd(), "..", "engrams-v2");

type MapNode = {
  id: string;
  title: string;
  type: "engram" | "concept" | "lesson" | "placeholder";
};

type EngramMap = {
  id: string;
  title: string;
  description: string;
  concepts: MapNode[];
  lessons: MapNode[];
};

type PositionedNode = MapNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

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

function truncateLabel(label: string, max = 28): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

function getNodeStyles(type: MapNode["type"]) {
  switch (type) {
    case "engram":
      return {
        fill: "#ECFDF3",
        stroke: "#7AEFB1",
        text: "#0F5F4C",
      };
    case "concept":
      return {
        fill: "#EFF6FF",
        stroke: "#93C5FD",
        text: "#1D4ED8",
      };
    case "lesson":
      return {
        fill: "#FEF3C7",
        stroke: "#F59E0B",
        text: "#92400E",
      };
    default:
      return {
        fill: "#F3F4F6",
        stroke: "#D1D5DB",
        text: "#6B7280",
      };
  }
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

      <div className="flex flex-wrap items-center gap-3 text-xs text-[#231F20]/70 mb-6">
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#ECFDF3] border border-[#7AEFB1]" />
          Engram
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#EFF6FF] border border-[#93C5FD]" />
          Concept
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#FEF3C7] border border-[#F59E0B]" />
          Lesson
        </span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-[#F3F4F6] border border-[#D1D5DB]" />
          Placeholder
        </span>
      </div>

      <div className="bg-white border border-[#B1C3BD]/30 rounded-2xl p-4 shadow-sm overflow-x-auto">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-[980px]"
        >
          <rect width={width} height={height} fill="#FFFFFF" rx={24} />
          {lines.map((line, index) => (
            <line
              key={`line-${index}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
          ))}
          {nodes.map((node) => {
            const styles = getNodeStyles(node.type);
            return (
              <g key={`${node.type}-${node.id}`}>
                <rect
                  x={node.x}
                  y={node.y}
                  width={node.width}
                  height={node.height}
                  rx={12}
                  fill={styles.fill}
                  stroke={styles.stroke}
                  strokeWidth={1.5}
                />
                <title>{node.title}</title>
                <text
                  x={node.x + 12}
                  y={node.y + node.height / 2 + 4}
                  fontSize={12}
                  fill={styles.text}
                  fontWeight={node.type === "engram" ? 600 : 500}
                >
                  {truncateLabel(node.title)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

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
