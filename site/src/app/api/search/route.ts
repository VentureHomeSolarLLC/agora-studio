import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { searchConcepts, getAllEngrams } from "@/lib/content";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // Search concepts
  const concepts = searchConcepts(query);
  const conceptResults = concepts.map((c) => ({
    slug: c.slug,
    title: c.title,
    type: "concept" as const,
    excerpt: c.excerpt || c.content.slice(0, 200).replace(/#.*\n/g, "").trim(),
    tags: c.tags,
  }));

  // Search engrams
  const engrams = getAllEngrams();
  const engramResults = engrams
    .filter(
      (e) =>
        e.title.toLowerCase().includes(query.toLowerCase()) ||
        e.description.toLowerCase().includes(query.toLowerCase())
    )
    .map((e) => ({
      slug: e.slug,
      title: e.title,
      type: "engram" as const,
      excerpt: e.description,
      tags: [e.hasSkill ? "AI Skill" : ""].filter(Boolean),
    }));

  // Combine and sort
  const results = [...conceptResults, ...engramResults].slice(0, 20);

  return NextResponse.json({ results });
}
