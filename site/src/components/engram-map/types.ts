export type MapNode = {
  id: string;
  title: string;
  type: "engram" | "concept" | "lesson" | "placeholder";
  url?: string;
  parentId?: string;
  counts?: {
    concepts: number;
    lessons: number;
  };
  tags?: string[];
};

export type EngramMap = {
  id: string;
  title: string;
  description: string;
  concepts: MapNode[];
  lessons: MapNode[];
  tags?: string[];
};

export type PositionedNode = MapNode & {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Line = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  fromId: string;
  toId: string;
};

export type GraphNode = {
  id: string;
  name: string;
  type: "engram" | "concept" | "lesson";
  url?: string;
  parentId?: string;
  tags?: string[];
  x?: number;
  y?: number;
  z?: number;
  counts?: {
    concepts: number;
    lessons: number;
  };
};

export type GraphLink = {
  source: string;
  target: string;
  type: "structure" | "tag";
};
