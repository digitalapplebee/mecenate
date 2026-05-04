import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchFeedPage } from '../api/feedApi';
import type { FeedTier } from '../api/feed.types';

const PAGE_SIZE = 10;

export function useFeedQuery(tier?: FeedTier) {
  return useInfiniteQuery({
    queryKey: ['feed', tier ?? 'all'],
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      fetchFeedPage(
        {
          limit: PAGE_SIZE,
          cursor: pageParam,
          tier,
        },
        signal,
      ),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}
