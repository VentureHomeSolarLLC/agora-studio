"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph3D, { ForceGraphMethods } from "react-force-graph-3d";
import type { GraphLink, GraphNode } from "@/components/engram-map/types";

const NODE_STYLE = {
  engram: { fill: "#7AEFB1", stroke: "#0F5F4C" },
  concept: { fill: "#93C5FD", stroke: "#1D4ED8" },
  lesson: { fill: "#FCD34D", stroke: "#92400E" },
};

const LINK_STYLE = {
  structure: "rgba(148, 163, 184, 0.55)",
  tag: "rgba(167, 139, 250, 0.35)",
};

const BASE_VALUE = {
  engram: 9,
  concept: 6,
  lesson: 5,
};

const ZOOM_STEP = 1.2;

type EngramMapClientProps = {
  nodes: GraphNode[];
  links: GraphLink[];
};

function resolveNodeId(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in (value as any)) {
    return String((value as any).id);
  }
  return "";
}

export function EngramMapClient({ nodes, links }: EngramMapClientProps) {
  const fgRef = useRef<ForceGraphMethods<GraphNode, GraphLink> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showTagLinks, setShowTagLinks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [autoRotate, setAutoRotate] = useState(true);

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setDimensions({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force("charge")?.strength(-120);
    fgRef.current.d3Force("link")?.distance((link: any) =>
      link.type === "tag" ? 190 : 130
    );
    fgRef.current.d3Force("center")?.strength(0.3);
  }, [nodes.length, links.length]);

  useEffect(() => {
    if (!fgRef.current) return;
    const controls = (fgRef.current as any)?.controls?.();
    if (!controls) return;
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.rotateSpeed = 0.6;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.6;
    controls.minDistance = 80;
    controls.maxDistance = 1400;
    controls.update();
  }, [autoRotate]);

  useEffect(() => {
    if (!fgRef.current) return;
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(600, 120);
    }, 300);
    return () => clearTimeout(timer);
  }, [dimensions.width, dimensions.height, nodes.length, links.length]);

  const filteredLinks = useMemo(() => {
    if (showTagLinks) return links;
    return links.filter((link) => link.type === "structure");
  }, [links, showTagLinks]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return new Set<string>();
    return new Set(
      nodes
        .filter((node) => node.name.toLowerCase().includes(normalizedQuery))
        .map((node) => node.id)
    );
  }, [nodes, normalizedQuery]);

  const graphData = useMemo(() => ({ nodes, links: filteredLinks }), [nodes, filteredLinks]);

  const handleNodeClick = (node: GraphNode) => {
    if (!node.url) return;
    window.open(node.url, "_blank", "noopener,noreferrer");
  };

  const nodeColor = (node: GraphNode) => {
    if (!normalizedQuery) return NODE_STYLE[node.type].fill;
    return matchingIds.has(node.id) ? "#22C55E" : "#D1D5DB";
  };

  const nodeVal = (node: GraphNode) => {
    const base = BASE_VALUE[node.type] ?? 6;
    if (!normalizedQuery) return base;
    return matchingIds.has(node.id) ? base * 1.35 : base * 0.7;
  };

  const linkColor = (link: GraphLink & { source: any; target: any }) => {
    const base = LINK_STYLE[link.type as "structure" | "tag"] || LINK_STYLE.structure;
    if (!normalizedQuery) return base;
    const sourceId = resolveNodeId(link.source);
    const targetId = resolveNodeId(link.target);
    if (matchingIds.has(sourceId) || matchingIds.has(targetId)) {
      return link.type === "tag" ? "rgba(34, 197, 94, 0.45)" : "rgba(15, 95, 76, 0.55)";
    }
    return "rgba(148, 163, 184, 0.2)";
  };

  const linkWidth = (link: GraphLink) => (link.type === "tag" ? 0.6 : 1.4);

  const zoomIn = () => {
    const controls = (fgRef.current as any)?.controls?.();
    if (!controls) return;
    controls.dollyIn(ZOOM_STEP);
    controls.update();
  };

  const zoomOut = () => {
    const controls = (fgRef.current as any)?.controls?.();
    if (!controls) return;
    controls.dollyOut(ZOOM_STEP);
    controls.update();
  };

  const fitGraph = () => {
    fgRef.current?.zoomToFit(600, 120);
  };

  const resetGraph = () => {
    fgRef.current?.cameraPosition(
      { x: 0, y: 0, z: 420 },
      { x: 0, y: 0, z: 0 },
      800
    );
  };

  return (
    <div className="bg-white border border-[#B1C3BD]/30 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm text-[#231F20]/70">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[#7AEFB1]" />
            Engram
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[#93C5FD]" />
            Concept
          </span>
          <span className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-[#FCD34D]" />
            Lesson
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            −
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            +
          </button>
          <button
            type="button"
            onClick={fitGraph}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={resetGraph}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <label className="flex items-center gap-2 text-xs text-[#231F20]/70">
          <input
            type="checkbox"
            checked={showTagLinks}
            onChange={(event) => setShowTagLinks(event.target.checked)}
          />
          Show tag connections
        </label>
        <label className="flex items-center gap-2 text-xs text-[#231F20]/70">
          <input
            type="checkbox"
            checked={autoRotate}
            onChange={(event) => setAutoRotate(event.target.checked)}
          />
          Auto-rotate
        </label>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search nodes..."
          className="w-full max-w-xs rounded-lg border border-[#B1C3BD]/40 bg-white px-3 py-2 text-sm text-[#231F20] placeholder:text-[#231F20]/40 focus:border-[#7AEFB1] focus:outline-none"
        />
      </div>
      <p className="mb-4 text-xs text-[#231F20]/55">
        Drag to rotate · Scroll to zoom · Shift + drag to pan
      </p>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-[#E6ECE8] bg-[#FBFBF6] h-[620px]"
      >
        <ForceGraph3D<GraphNode, GraphLink>
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#FBFBF6"
          nodeColor={nodeColor}
          nodeVal={nodeVal}
          nodeOpacity={0.95}
          nodeLabel={(node) => `${node.name} (${node.type})`}
          linkColor={linkColor}
          linkWidth={linkWidth}
          linkDirectionalParticles={(link) => (link.type === "tag" ? 2 : 0)}
          linkDirectionalParticleWidth={1.6}
          linkDirectionalParticleSpeed={0.0025}
          linkOpacity={0.65}
          linkCurvature={(link) => (link.type === "tag" ? 0.18 : 0.04)}
          onNodeHover={(node) => setHoveredNode(node ? (node as GraphNode) : null)}
          onNodeClick={(node) => handleNodeClick(node as GraphNode)}
        />
        {hoveredNode && (
          <div className="absolute left-4 bottom-4 rounded-xl border border-[#B1C3BD]/40 bg-white px-3 py-2 text-xs text-[#231F20] shadow-lg">
            <p className="font-semibold">{hoveredNode.name}</p>
            <p className="text-[#231F20]/60 capitalize">{hoveredNode.type}</p>
            {hoveredNode.counts && (
              <p className="text-[#231F20]/60">
                {hoveredNode.counts.concepts} concepts · {hoveredNode.counts.lessons} lessons
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
