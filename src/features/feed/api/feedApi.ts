import type { FeedApiResponse, FeedPage, FeedRequestParams } from './feed.types';

const DEFAULT_API_BASE_URL = 'https://k8s.mectest.ru/test-app';
const DEFAULT_API_TOKEN = '123e4567-e89b-12d3-a456-426614174000';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL?.replace(/\/+$/, '') ??
  DEFAULT_API_BASE_URL;
const API_TOKEN = process.env.EXPO_PUBLIC_API_TOKEN ?? DEFAULT_API_TOKEN;
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

function buildQueryString(params: FeedRequestParams) {
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

export async function fetchFeedPage(
  params: FeedRequestParams,
): Promise<FeedPage> {
  const response = await fetch(
    `${API_BASE_URL}/posts?${buildQueryString(params)}`,
    {
      headers: {
        Authorization: `Bearer ${API_TOKEN}`,
      },
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
