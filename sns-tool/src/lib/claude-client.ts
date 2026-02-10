import Anthropic from "@anthropic-ai/sdk";

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY not configured. Check .env.local");
  }
  return new Anthropic({ apiKey });
}

export async function rewriteInJapanese(
  originalText: string,
  style: "informative" | "casual" | "professional" = "informative"
): Promise<string> {
  const client = getClient();

  const styleGuide = {
    informative: "分かりやすく情報を伝える、ニュースキャスターのような文体",
    casual: "親しみやすく読みやすい、友達に話すような文体",
    professional: "ビジネス向けの信頼感のある文体",
  };

  const message = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `あなたはAI・テクノロジー分野のSNS投稿専門のライターです。

以下の海外の投稿/ニュースを日本語でリライトしてください。

【ルール】
- ${styleGuide[style]}
- 280文字以内（X投稿制限）
- 日本の読者向けに分かりやすく
- 元の情報の正確性を保つ
- ハッシュタグを2-3個付ける（例: #AI #テクノロジー）
- 丸コピーではなく、独自の視点を加える
- 絵文字は適度に使用

【元の投稿】
${originalText}

【リライト結果のみを出力してください】`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }
  throw new Error("Unexpected response format from Claude API");
}
