import { NextResponse } from "next/server";
import { getAllConcepts } from "@/lib/content";

export async function GET() {
  try {
    const concepts = getAllConcepts(true); // Include all concepts
    
    // Return simplified data for the builder
    const simplified = concepts.map(c => ({
      slug: c.slug,
      concept_id: c.concept_id,
      title: c.title,
      tags: c.tags,
      excerpt: c.excerpt,
    }));

    return NextResponse.json({ concepts: simplified });
  } catch (error) {
    console.error("Error fetching concepts:", error);
    return NextResponse.json(
      { error: "Failed to fetch concepts" },
      { status: 500 }
    );
  }
}
