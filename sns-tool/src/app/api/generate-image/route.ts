import { NextRequest, NextResponse } from "next/server";
import { generateImage, generateImagePrompt } from "@/lib/gemini-client";

// POST: Gemini画像生成
export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.prompt && !body.postText) {
    return NextResponse.json(
      { error: "prompt or postText is required" },
      { status: 400 }
    );
  }

  try {
    // postTextが渡された場合、まず画像プロンプトを生成
    const prompt = body.prompt || (await generateImagePrompt(body.postText));

    const { base64, mimeType } = await generateImage(prompt);

    return NextResponse.json({
      imageData: `data:${mimeType};base64,${base64}`,
      prompt,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
