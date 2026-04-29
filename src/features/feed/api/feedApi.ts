import type {
  Comment,
  CommentCreatedApiResponse,
  CommentsApiResponse,
  CommentsPage,
  CommentsRequestParams,
  FeedApiResponse,
  FeedPage,
  FeedRequestParams,
  LikeApiResponse,
  Post,
  PostDetailApiResponse,
} from './feed.types';

const DEFAULT_API_BASE_URL = 'https://k8s.mectest.ru/test-app';
const DEFAULT_API_TOKEN = '123e4567-e89b-12d3-a456-426614174000';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ??
  DEFAULT_API_BASE_URL;
export const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? DEFAULT_API_TOKEN;
const SHOULD_SIMULATE_ERROR =
  process.env.EXPO_PUBLIC_FEED_SIMULATE_ERROR === 'true';

export class FeedRequestError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'FeedRequestError';
    this.status = status;
    this.code = code;
  }
}

function buildFeedQueryString(params: FeedRequestParams) {
  const parts = [`limit=${params.limit}`];

  if (params.cursor) {
    parts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  }

  if (params.tier) {
    parts.push(`tier=${params.tier}`);
  }

  if (SHOULD_SIMULATE_ERROR) {
    parts.push('simulate_error=true');
  }

  return parts.join('&');
}

function buildCommentsQueryString(params: CommentsRequestParams) {
  const parts = [`limit=${params.limit}`];

  if (params.cursor) {
    parts.push(`cursor=${encodeURIComponent(params.cursor)}`);
  }

  return parts.join('&');
}

function buildAuthHeaders() {
  return {
    Authorization: `Bearer ${API_TOKEN}`,
  };
}

export async function fetchFeedPage(
  params: FeedRequestParams,
): Promise<FeedPage> {
  const response = await fetch(
    `${API_BASE_URL}/posts?${buildFeedQueryString(params)}`,
    {
      headers: buildAuthHeaders(),
    },
  );

  let payload: FeedApiResponse | null = null;

  try {
    payload = (await response.json()) as FeedApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new FeedRequestError(
      'Не удалось загрузить публикации',
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data;
}

export async function fetchPost(postId: string): Promise<Post> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
    headers: buildAuthHeaders(),
  });

  let payload: PostDetailApiResponse | null = null;

  try {
    payload = (await response.json()) as PostDetailApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data?.post) {
    throw new FeedRequestError(
      'Не удалось загрузить публикацию',
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data.post;
}

export async function togglePostLike(postId: string) {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/like`, {
    headers: buildAuthHeaders(),
    method: 'POST',
  });

  let payload: LikeApiResponse | null = null;

  try {
    payload = (await response.json()) as LikeApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new FeedRequestError(
      'Не удалось обновить лайк',
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data;
}

export async function fetchCommentsPage(
  params: CommentsRequestParams,
): Promise<CommentsPage> {
  const response = await fetch(
    `${API_BASE_URL}/posts/${params.postId}/comments?${buildCommentsQueryString(params)}`,
    {
      headers: buildAuthHeaders(),
    },
  );

  let payload: CommentsApiResponse | null = null;

  try {
    payload = (await response.json()) as CommentsApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data) {
    throw new FeedRequestError(
      'Не удалось загрузить комментарии',
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data;
}

export async function createComment(
  postId: string,
  text: string,
): Promise<Comment> {
  const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
    body: JSON.stringify({ text }),
    headers: {
      ...buildAuthHeaders(),
      'Content-Type': 'application/json',
    },
    method: 'POST',
  });

  let payload: CommentCreatedApiResponse | null = null;

  try {
    payload = (await response.json()) as CommentCreatedApiResponse;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.ok || !payload.data?.comment) {
    throw new FeedRequestError(
      'Не удалось отправить комментарий',
      response.status,
      payload?.error?.code,
    );
  }

  return payload.data.comment;
}
