import { NextResponse } from "next/server";
import { getAllConcepts } from "@/lib/content";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.toLowerCase() || "";
    
    const concepts = getAllConcepts(true); // Include all concepts
    
    // If no query, return all (for initial load)
    if (!query) {
      const simplified = concepts.map(c => ({
        slug: c.slug,
        concept_id: c.concept_id,
        title: c.title,
        tags: c.tags,
        excerpt: c.excerpt,
      }));
      return NextResponse.json({ concepts: simplified });
    }
    
    // Search through all content
    const filtered = concepts.filter(c => {
      const searchableText = `
        ${c.title} 
        ${c.concept_id} 
        ${c.tags.join(" ")} 
        ${c.content}
      `.toLowerCase();
      
      return searchableText.includes(query);
    });

    const simplified = filtered.map(c => ({
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
