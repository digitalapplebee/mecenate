import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import {
  FEED_WEBSOCKET_URL,
  type FeedRealtimeStatus,
  parseFeedRealtimeEvent,
} from '../api/feedRealtime';
import { applyCommentAdded, applyPostLike } from '../model/feedQueryCache';

const RECONNECT_DELAY_MS = 3_000;

export function useFeedRealtime(): FeedRealtimeStatus {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FeedRealtimeStatus>(
    FEED_WEBSOCKET_URL ? 'connecting' : 'disabled',
  );

  useEffect(() => {
    const websocketUrl = FEED_WEBSOCKET_URL;

    if (!websocketUrl) {
      setStatus('disabled');
      return undefined;
    }

    let socket: WebSocket | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closedByCleanup = false;

    const connect = () => {
      setStatus('connecting');

      const nextSocket = new WebSocket(websocketUrl);
      socket = nextSocket;

      nextSocket.onopen = () => {
        setStatus('connected');
      };

      nextSocket.onmessage = (event) => {
        if (typeof event.data !== 'string') {
          return;
        }

        const realtimeEvent = parseFeedRealtimeEvent(event.data);

        if (!realtimeEvent || realtimeEvent.type === 'ping') {
          return;
        }

        if (realtimeEvent.type === 'like_updated') {
          applyPostLike(queryClient, realtimeEvent.postId, {
            likesCount: realtimeEvent.likesCount,
          });
          return;
        }

        applyCommentAdded(queryClient, realtimeEvent.comment);
      };

      nextSocket.onerror = () => {
        setStatus('error');
      };

      nextSocket.onclose = () => {
        if (closedByCleanup || socket !== nextSocket) {
          return;
        }

        setStatus('error');
        reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      closedByCleanup = true;

      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }

      socket?.close();
    };
  }, [queryClient]);

  return status;
}
