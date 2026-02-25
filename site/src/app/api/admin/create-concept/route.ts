import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, concept_id, audience, tags, content } = body;

    // Validation
    if (!title || !concept_id || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!audience || audience.length === 0) {
      return NextResponse.json(
        { error: "At least one audience must be selected" },
        { status: 400 }
      );
    }

    // Generate markdown content
    const markdown = `---
concept_id: ${concept_id}
title: "${title}"
content_type: concept
audience:
${audience.map((a: string) => `  - ${a}`).join("\n")}
tags:
${tags.map((t: string) => `  - ${t}`).join("\n")}
created: ${new Date().toISOString()}
updated: ${new Date().toISOString()}
author: ${session.user?.email || "unknown"}
---

# ${title}

${content}
`;

    // In production, this would:
    // 1. Call Python service to validate content
    // 2. Use GitHub API to commit the file
    // 3. Trigger auto-deployment
    
    // For now, return the generated markdown
    // The actual GitHub integration can be added later
    
    console.log("Generated concept:", {
      concept_id,
      title,
      audience,
      tags,
      contentLength: content.length,
    });

    return NextResponse.json({
      success: true,
      concept_id,
      title,
      markdown,
      message: "Concept validated and ready for submission",
    });

  } catch (error) {
    console.error("Error creating concept:", error);
    return NextResponse.json(
      { error: "Failed to create concept" },
      { status: 500 }
    );
  }
}
