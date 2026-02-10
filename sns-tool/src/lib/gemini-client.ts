import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not configured. Check .env.local");
  }
  return new GoogleGenerativeAI(apiKey);
}

// Gemini で画像を生成（Nano banana / Imagen）
export async function generateImage(
  prompt: string
): Promise<{ base64: string; mimeType: string }> {
  const client = getClient();

  const model = client.getGenerativeModel({
    model: "gemini-2.0-flash-exp",
    generationConfig: {
      responseModalities: ["image", "text"],
    } as Record<string, unknown>,
  });

  const result = await model.generateContent(
    `Generate a visually appealing image for a social media post about: ${prompt}.
     Style: modern, clean, tech-themed. No text in the image.`
  );

  const response = result.response;
  const parts = response.candidates?.[0]?.content?.parts;

  if (!parts) {
    throw new Error("No image generated from Gemini API");
  }

  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inlineData = (part as any).inlineData as
      | { data: string; mimeType: string }
      | undefined;
    if (inlineData) {
      return {
        base64: inlineData.data,
        mimeType: inlineData.mimeType,
      };
    }
  }

  throw new Error("No image data in Gemini response");
}

// テキストから投稿用の画像プロンプトを生成
export async function generateImagePrompt(postText: string): Promise<string> {
  const client = getClient();
  const model = client.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(
    `Based on this social media post text, generate a concise English image prompt (1-2 sentences) for creating an eye-catching illustration. The image should be suitable for a tech/AI news post on social media.

Post: ${postText}

Output only the image prompt, nothing else.`
  );

  return result.response.text();
}
