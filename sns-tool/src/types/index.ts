export type Platform = "x" | "threads";

export type DraftStatus =
  | "draft"
  | "scheduled"
  | "publishing"
  | "published"
  | "failed";

export type ImageSource = "gemini" | "original" | "manual";

export interface CreateDraftInput {
  sourcePostId?: string;
  originalText?: string;
  rewrittenText: string;
  imageUrl?: string;
  imageSource?: ImageSource;
  scheduledAt?: string;
  platforms?: Platform[];
}

export interface UpdateDraftInput {
  rewrittenText?: string;
  imageUrl?: string;
  imageSource?: ImageSource;
  status?: DraftStatus;
  scheduledAt?: string;
  platforms?: Platform[];
}

export interface RewriteRequest {
  text: string;
  style?: "informative" | "casual" | "professional";
}

export interface GenerateImageRequest {
  prompt: string;
  style?: string;
}

export interface AccountInput {
  platform: Platform;
  username: string;
  profileUrl: string;
}
