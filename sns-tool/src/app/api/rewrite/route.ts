import { NextRequest, NextResponse } from "next/server";
import { rewriteInJapanese } from "@/lib/claude-client";

// POST: AIリライト
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.text) {
    return NextResponse.json({ error: "text is required" }, { status: 400 });
  }

  try {
    const rewritten = await rewriteInJapanese(
      body.text,
      body.style || "informative"
    );

    return NextResponse.json({ rewrittenText: rewritten });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Rewrite failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
