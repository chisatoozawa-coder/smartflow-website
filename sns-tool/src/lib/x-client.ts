import { TwitterApi } from "twitter-api-v2";

function getClient(): TwitterApi {
  const apiKey = process.env.X_API_KEY;
  const apiSecret = process.env.X_API_SECRET;
  const accessToken = process.env.X_ACCESS_TOKEN;
  const accessTokenSecret = process.env.X_ACCESS_TOKEN_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
    throw new Error("X API credentials not configured. Check .env.local");
  }

  return new TwitterApi({
    appKey: apiKey,
    appSecret: apiSecret,
    accessToken,
    accessSecret: accessTokenSecret,
  });
}

// テキストのみ投稿
export async function postToX(text: string): Promise<{ id: string }> {
  const client = getClient();
  const result = await client.v2.tweet(text);
  return { id: result.data.id };
}

// 画像付き投稿
export async function postToXWithImage(
  text: string,
  imageBuffer: Buffer
): Promise<{ id: string }> {
  const client = getClient();

  // v1 APIで画像をアップロード
  const mediaId = await client.v1.uploadMedia(imageBuffer, {
    mimeType: "image/png",
  });

  const result = await client.v2.tweet(text, {
    media: { media_ids: [mediaId] },
  });

  return { id: result.data.id };
}
