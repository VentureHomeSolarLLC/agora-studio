"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Line, PositionedNode } from "@/components/engram-map/types";

type EngramMapClientProps = {
  nodes: PositionedNode[];
  lines: Line[];
  width: number;
  height: number;
};

type Point = { x: number; y: number };

const MIN_SCALE = 0.4;
const MAX_SCALE = 2.6;
const ZOOM_STEP = 0.12;
const PADDING = 48;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getNodeStyles(type: PositionedNode["type"]) {
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

function truncateLabel(label: string, max = 28): string {
  if (label.length <= max) return label;
  return `${label.slice(0, max - 1)}…`;
}

export function EngramMapClient({ nodes, lines, width, height }: EngramMapClientProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState<Point>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef<Point>({ x: 0, y: 0 });
  const panOrigin = useRef<Point>({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [hoveredNode, setHoveredNode] = useState<PositionedNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!containerRef.current) return;
    const element = containerRef.current;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (!rect) return;
      setContainerSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fitToView = () => {
    if (!containerSize.width || !containerSize.height) return;
    const scaleX = (containerSize.width - PADDING * 2) / width;
    const scaleY = (containerSize.height - PADDING * 2) / height;
    const nextScale = clamp(Math.min(scaleX, scaleY), MIN_SCALE, MAX_SCALE);
    const offsetX = (containerSize.width - width * nextScale) / 2;
    const offsetY = (containerSize.height - height * nextScale) / 2;
    setScale(nextScale);
    setTranslate({ x: offsetX, y: offsetY });
  };

  useEffect(() => {
    fitToView();
  }, [containerSize.width, containerSize.height, width, height]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cursorX = event.clientX - rect.left;
    const cursorY = event.clientY - rect.top;
    const zoomDirection = event.deltaY < 0 ? 1 + ZOOM_STEP : 1 - ZOOM_STEP;
    const nextScale = clamp(scale * zoomDirection, MIN_SCALE, MAX_SCALE);
    const worldX = (cursorX - translate.x) / scale;
    const worldY = (cursorY - translate.y) / scale;
    const nextTranslate = {
      x: cursorX - worldX * nextScale,
      y: cursorY - worldY * nextScale,
    };
    setScale(nextScale);
    setTranslate(nextTranslate);
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    const target = event.target as Element | null;
    if (target && target.closest("[data-node='true']")) return;
    setIsPanning(true);
    panStart.current = { x: event.clientX, y: event.clientY };
    panOrigin.current = { ...translate };
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isPanning) return;
    const dx = event.clientX - panStart.current.x;
    const dy = event.clientY - panStart.current.y;
    setTranslate({ x: panOrigin.current.x + dx, y: panOrigin.current.y + dy });
  };

  const stopPanning = () => setIsPanning(false);

  const zoomIn = () => setScale((prev) => clamp(prev * (1 + ZOOM_STEP), MIN_SCALE, MAX_SCALE));
  const zoomOut = () => setScale((prev) => clamp(prev * (1 - ZOOM_STEP), MIN_SCALE, MAX_SCALE));
  const resetView = () => {
    setScale(1);
    setTranslate({ x: 0, y: 0 });
  };

  const formattedScale = useMemo(() => `${Math.round(scale * 100)}%`, [scale]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const matchingIds = useMemo(() => {
    if (!normalizedQuery) return new Set<string>();
    return new Set(
      nodes
        .filter((node) => node.type !== "placeholder" && node.title.toLowerCase().includes(normalizedQuery))
        .map((node) => node.id)
    );
  }, [nodes, normalizedQuery]);

  const matchedEngramIds = useMemo(() => {
    if (!normalizedQuery) return new Set<string>();
    return new Set(
      nodes
        .filter(
          (node) =>
            node.type === "engram" && node.title.toLowerCase().includes(normalizedQuery)
        )
        .map((node) => node.id)
    );
  }, [nodes, normalizedQuery]);

  const tooltipPosition = useMemo(() => {
    if (!hoveredNode || !containerRef.current) return null;
    const x = translate.x + (hoveredNode.x + hoveredNode.width / 2) * scale;
    const y = translate.y + hoveredNode.y * scale;
    return { x, y };
  }, [hoveredNode, translate, scale]);

  const handleNodeClick = (node: PositionedNode) => {
    if (!node.url) return;
    window.open(node.url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="bg-white border border-[#B1C3BD]/30 rounded-2xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 text-sm text-[#231F20]/70">
        <div className="flex items-center gap-3">
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
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={zoomOut}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            −
          </button>
          <span className="min-w-[58px] text-center text-xs text-[#231F20]/70">{formattedScale}</span>
          <button
            type="button"
            onClick={zoomIn}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            +
          </button>
          <button
            type="button"
            onClick={fitToView}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            Fit
          </button>
          <button
            type="button"
            onClick={resetView}
            className="px-3 py-1 rounded-lg border border-[#B1C3BD]/40 text-[#231F20] hover:border-[#7AEFB1] transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2 text-xs text-[#231F20]/60">
          <span className="font-medium text-[#231F20]/70">Search</span>
          <span>Highlights matching nodes.</span>
        </div>
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
        className={`relative overflow-hidden rounded-2xl border border-[#E6ECE8] bg-[#FBFBF6] h-[560px] ${
          isPanning ? "cursor-grabbing" : "cursor-grab"
        }`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopPanning}
        onMouseLeave={stopPanning}
      >
        {hoveredNode && tooltipPosition && (
          <div
            className="absolute z-10 pointer-events-none rounded-lg border border-[#B1C3BD]/40 bg-white px-3 py-2 text-xs text-[#231F20] shadow-lg"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y - 12,
              transform: "translate(-50%, -100%)",
            }}
          >
            <p className="font-semibold text-[#231F20]">{hoveredNode.title}</p>
            <p className="text-[#231F20]/60 capitalize">{hoveredNode.type}</p>
            {hoveredNode.type === "engram" && hoveredNode.counts && (
              <p className="text-[#231F20]/60 mt-1">
                {hoveredNode.counts.concepts} concepts · {hoveredNode.counts.lessons} lessons
              </p>
            )}
          </div>
        )}
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${containerSize.width || width} ${containerSize.height || height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <pattern id="map-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#E6ECE8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#FBFBF6" />
          <rect width="100%" height="100%" fill="url(#map-grid)" opacity="0.7" />
          <g transform={`translate(${translate.x} ${translate.y}) scale(${scale})`}>
            {lines.map((line, index) => {
              const isHighlighted =
                !normalizedQuery ||
                matchingIds.has(line.fromId) ||
                matchingIds.has(line.toId) ||
                matchedEngramIds.has(line.fromId) ||
                matchedEngramIds.has(line.toId);
              return (
                <line
                  key={`line-${index}`}
                  x1={line.x1}
                  y1={line.y1}
                  x2={line.x2}
                  y2={line.y2}
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                  opacity={normalizedQuery && !isHighlighted ? 0.15 : 1}
                />
              );
            })}
            {nodes.map((node) => {
              const styles = getNodeStyles(node.type);
              const isMatch = normalizedQuery
                ? node.type !== "placeholder" && node.title.toLowerCase().includes(normalizedQuery)
                : false;
              const isRelated = normalizedQuery
                ? !isMatch && !!node.parentId && matchedEngramIds.has(node.parentId)
                : false;
              const dimOpacity = normalizedQuery && !isMatch && !isRelated ? 0.25 : 1;
              const isInteractive = !!node.url && node.type !== "placeholder";
              return (
                <g
                  key={`${node.type}-${node.id}`}
                  data-node="true"
                  onMouseEnter={() => setHoveredNode(node)}
                  onMouseLeave={() => setHoveredNode(null)}
                  onClick={() => handleNodeClick(node)}
                  style={{ cursor: isInteractive ? "pointer" : "default" }}
                  opacity={dimOpacity}
                >
                  <rect
                    x={node.x}
                    y={node.y}
                    width={node.width}
                    height={node.height}
                    rx={12}
                    fill={styles.fill}
                    stroke={styles.stroke}
                    strokeWidth={isMatch ? 2.5 : 1.5}
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
          </g>
        </svg>
      </div>
    </div>
  );
}
