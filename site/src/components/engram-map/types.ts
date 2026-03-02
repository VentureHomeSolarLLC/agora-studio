export type MapNode = {
  id: string;
  title: string;
  type: "engram" | "concept" | "lesson" | "placeholder";
};

export type EngramMap = {
  id: string;
  title: string;
  description: string;
  concepts: MapNode[];
  lessons: MapNode[];
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
};
