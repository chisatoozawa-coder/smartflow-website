const THREADS_API_BASE = "https://graph.threads.net/v1.0";

function getCredentials() {
  const accessToken = process.env.THREADS_ACCESS_TOKEN;
  const userId = process.env.THREADS_USER_ID;

  if (!accessToken || !userId) {
    throw new Error("Threads API credentials not configured. Check .env.local");
  }

  return { accessToken, userId };
}

// ユーザーの投稿一覧を取得
export async function fetchUserPosts(
  threadsUserId: string,
  limit: number = 10
): Promise<ThreadsPost[]> {
  const { accessToken } = getCredentials();

  const res = await fetch(
    `${THREADS_API_BASE}/${threadsUserId}/threads?fields=id,text,timestamp,media_url,media_type,permalink,like_count&limit=${limit}&access_token=${accessToken}`
  );

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Threads API error: ${error}`);
  }

  const data = await res.json();
  return data.data || [];
}

// テキスト投稿を作成
export async function postToThreads(text: string): Promise<{ id: string }> {
  const { accessToken, userId } = getCredentials();

  // Step 1: コンテナ作成
  const createRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "TEXT",
        text,
        access_token: accessToken,
      }),
    }
  );

  if (!createRes.ok) throw new Error(`Threads create error: ${await createRes.text()}`);
  const { id: containerId } = await createRes.json();

  // Step 2: 公開
  const publishRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) throw new Error(`Threads publish error: ${await publishRes.text()}`);
  const result = await publishRes.json();
  return { id: result.id };
}

// 画像付き投稿
export async function postToThreadsWithImage(
  text: string,
  imageUrl: string
): Promise<{ id: string }> {
  const { accessToken, userId } = getCredentials();

  // Step 1: 画像コンテナ作成
  const createRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        media_type: "IMAGE",
        image_url: imageUrl,
        text,
        access_token: accessToken,
      }),
    }
  );

  if (!createRes.ok) throw new Error(`Threads create error: ${await createRes.text()}`);
  const { id: containerId } = await createRes.json();

  // 画像処理待ち
  await new Promise((resolve) => setTimeout(resolve, 3000));

  // Step 2: 公開
  const publishRes = await fetch(
    `${THREADS_API_BASE}/${userId}/threads_publish`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        creation_id: containerId,
        access_token: accessToken,
      }),
    }
  );

  if (!publishRes.ok) throw new Error(`Threads publish error: ${await publishRes.text()}`);
  const result = await publishRes.json();
  return { id: result.id };
}

export interface ThreadsPost {
  id: string;
  text?: string;
  timestamp: string;
  media_url?: string;
  media_type?: string;
  permalink?: string;
  like_count?: number;
}
