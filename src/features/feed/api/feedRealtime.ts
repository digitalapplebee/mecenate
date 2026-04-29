import { API_BASE_URL, API_TOKEN } from './feedApi';
import type { Comment } from './feed.types';

const rawFeedWebsocketUrl = process.env.EXPO_PUBLIC_FEED_WS_URL?.trim();

export const FEED_WEBSOCKET_URL =
  rawFeedWebsocketUrl && rawFeedWebsocketUrl.length > 0
    ? rawFeedWebsocketUrl
    : buildDefaultWebsocketUrl();

export type FeedRealtimeEvent =
  | {
      type: 'ping';
    }
  | {
      likesCount: number;
      postId: string;
      type: 'like_updated';
    }
  | {
      comment: Comment;
      postId: string;
      type: 'comment_added';
    };

export type FeedRealtimeStatus =
  | 'connected'
  | 'connecting'
  | 'disabled'
  | 'error';

export function parseFeedRealtimeEvent(message: string): FeedRealtimeEvent | null {
  let payload: unknown;

  try {
    payload = JSON.parse(message);
  } catch {
    return null;
  }

  if (!isRecord(payload) || typeof payload.type !== 'string') {
    return null;
  }

  if (payload.type === 'ping') {
    return { type: 'ping' };
  }

  if (payload.type === 'like_updated') {
    const postId = getString(payload, 'postId');
    const likesCount = getNumber(payload, 'likesCount');

    return postId && likesCount !== null
      ? {
          likesCount,
          postId,
          type: 'like_updated',
        }
      : null;
  }

  if (payload.type === 'comment_added') {
    const postId = getString(payload, 'postId');

    return postId && isComment(payload.comment)
      ? {
          comment: payload.comment,
          postId,
          type: 'comment_added',
        }
      : null;
  }

  return null;
}

function isComment(value: unknown): value is Comment {
  if (!isRecord(value) || !isRecord(value.author)) {
    return false;
  }

  return (
    getString(value, 'id') !== null &&
    getString(value, 'postId') !== null &&
    getString(value, 'text') !== null &&
    getString(value, 'createdAt') !== null &&
    getString(value.author, 'id') !== null &&
    getString(value.author, 'username') !== null &&
    getString(value.author, 'displayName') !== null &&
    getString(value.author, 'avatarUrl') !== null &&
    getString(value.author, 'bio') !== null &&
    getNumber(value.author, 'subscribersCount') !== null &&
    typeof value.author.isVerified === 'boolean'
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === 'string' ? value : null;
}

function getNumber(record: Record<string, unknown>, key: string) {
  const value = record[key];

  return typeof value === 'number' ? value : null;
}

function buildDefaultWebsocketUrl() {
  try {
    const url = new URL(API_BASE_URL);

    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    url.pathname = `${url.pathname.replace(/\/+$/, '')}/ws`;
    url.search = `token=${encodeURIComponent(API_TOKEN)}`;

    return url.toString();
  } catch {
    return null;
  }
}
