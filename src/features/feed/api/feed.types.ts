export type FeedTier = 'free' | 'paid';

export interface Author {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  bio: string;
  subscribersCount: number;
  isVerified: boolean;
}

export interface Post {
  id: string;
  author: Author;
  title: string;
  body: string;
  preview: string;
  coverUrl: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  tier: FeedTier;
  createdAt: string;
}

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

interface ApiErrorPayload {
  code: string;
  message: string;
}

export interface FeedApiResponse {
  ok: boolean;
  data?: FeedPage;
  error?: ApiErrorPayload;
}

export interface FeedRequestParams {
  limit: number;
  cursor?: string;
  tier?: FeedTier;
}
