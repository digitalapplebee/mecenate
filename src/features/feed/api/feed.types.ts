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

export interface Comment {
  id: string;
  postId: string;
  author: Author;
  text: string;
  createdAt: string;
  likesCount?: number;
  isLiked?: boolean;
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

export interface PostDetailApiResponse {
  ok: boolean;
  data?: {
    post: Post;
  };
  error?: ApiErrorPayload;
}

export interface LikeApiResponse {
  ok: boolean;
  data?: {
    isLiked: boolean;
    likesCount: number;
  };
  error?: ApiErrorPayload;
}

export interface CommentsPage {
  comments: Comment[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CommentsApiResponse {
  ok: boolean;
  data?: CommentsPage;
  error?: ApiErrorPayload;
}

export interface CommentCreatedApiResponse {
  ok: boolean;
  data?: {
    comment: Comment;
  };
  error?: ApiErrorPayload;
}

export interface FeedRequestParams {
  limit: number;
  cursor?: string;
  tier?: FeedTier;
}

export interface CommentsRequestParams {
  cursor?: string;
  limit: number;
  postId: string;
}
