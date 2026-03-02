"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { ForceGraphMethods } from "react-force-graph-2d";
import type { GraphLink, GraphNode } from "@/components/engram-map/types";

const NODE_STYLE = {
  engram: { fill: "#7AEFB1", stroke: "#0F5F4C" },
  concept: { fill: "#93C5FD", stroke: "#1D4ED8" },
  lesson: { fill: "#FCD34D", stroke: "#92400E" },
};

const LINK_STYLE = {
  structure: "rgba(148, 163, 184, 0.7)",
  tag: "rgba(167, 139, 250, 0.35)",
};

const BASE_RADIUS = {
  engram: 12,
  concept: 9,
  lesson: 8,
};

const ZOOM_STEP = 0.2;

type EngramMapClientProps = {
  nodes: GraphNode[];
  links: GraphLink[];
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function EngramMapClient({ nodes, links }: EngramMapClientProps) {
  const fgRef = useRef<ForceGraphMethods | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 900, height: 600 });
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [showTagLinks, setShowTagLinks] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(1);

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
    fgRef.current.d3Force("charge")?.strength(-140);
    fgRef.current.d3Force("link")?.distance((link: any) =>
      link.type === "tag" ? 160 : 110
    );
    fgRef.current.d3Force("center")?.strength(0.3);
  }, [nodes.length, links.length]);

  useEffect(() => {
    if (!fgRef.current) return;
    const timer = setTimeout(() => {
      fgRef.current?.zoomToFit(400, 80);
    }, 250);
    return () => clearTimeout(timer);
  }, [dimensions.width, dimensions.height]);

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

  const drawNode = (node: GraphNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const style = NODE_STYLE[node.type];
    const radius = BASE_RADIUS[node.type] * (node.type === "engram" ? 1.25 : 1);
    const isMatch = normalizedQuery && matchingIds.has(node.id);
    const isDim = normalizedQuery && !isMatch;
    const x = node.x ?? 0;
    const y = node.y ?? 0;

    const gradient = ctx.createRadialGradient(
      x - radius / 3,
      y - radius / 3,
      radius / 4,
      x,
      y,
      radius
    );
    gradient.addColorStop(0, "#FFFFFF");
    gradient.addColorStop(0.3, style.fill);
    gradient.addColorStop(1, style.stroke);

    ctx.save();
    ctx.globalAlpha = isDim ? 0.25 : 1;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.shadowColor = "rgba(0,0,0,0.15)";
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.lineWidth = isMatch ? 2.5 : 1.2;
    ctx.strokeStyle = style.stroke;
    ctx.stroke();
    ctx.restore();

    const labelThreshold = 1.05;
    if (globalScale >= labelThreshold || node === hoveredNode) {
      const fontSize = clamp(14 / globalScale, 10, 16);
      ctx.font = `${fontSize}px "Inter", system-ui, -apple-system, sans-serif`;
      ctx.fillStyle = "#1F2937";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(node.name, x, y + radius + 6);
    }
  };

  const drawLink = (link: GraphLink & { source: any; target: any }, ctx: CanvasRenderingContext2D) => {
    const color = LINK_STYLE[link.type as "structure" | "tag"] || LINK_STYLE.structure;
    ctx.strokeStyle = color;
    ctx.lineWidth = link.type === "tag" ? 0.8 : 1.2;
  };

  const zoomIn = () => {
    if (!fgRef.current) return;
    fgRef.current.zoom(zoom * (1 + ZOOM_STEP), 200);
  };

  const zoomOut = () => {
    if (!fgRef.current) return;
    fgRef.current.zoom(zoom * (1 - ZOOM_STEP), 200);
  };

  const fitGraph = () => {
    fgRef.current?.zoomToFit(400, 80);
  };

  const resetGraph = () => {
    fgRef.current?.centerAt(0, 0, 400);
    fgRef.current?.zoom(1, 400);
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            −
          </button>
          <span className="text-xs min-w-[52px] text-center">{Math.round(zoom * 100)}%</span>
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

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <label className="flex items-center gap-2 text-xs text-[#231F20]/70">
          <input
            type="checkbox"
            checked={showTagLinks}
            onChange={(event) => setShowTagLinks(event.target.checked)}
          />
          Show tag connections
        </label>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search nodes..."
          className="w-full max-w-xs rounded-lg border border-[#B1C3BD]/40 bg-white px-3 py-2 text-sm text-[#231F20] placeholder:text-[#231F20]/40 focus:border-[#7AEFB1] focus:outline-none"
        />
      </div>

      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-2xl border border-[#E6ECE8] bg-[#FBFBF6] h-[600px]"
      >
        <ForceGraph2D<GraphNode, GraphLink>
          ref={fgRef}
          width={dimensions.width}
          height={dimensions.height}
          graphData={graphData}
          backgroundColor="#FBFBF6"
          linkDirectionalParticles={0}
          nodeRelSize={4}
          nodeCanvasObject={drawNode}
          linkCanvasObject={drawLink}
          onNodeHover={(node) => setHoveredNode(node ? (node as GraphNode) : null)}
          onNodeClick={(node) => handleNodeClick(node as GraphNode)}
          onZoom={(transform) => setZoom(transform.k)}
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
