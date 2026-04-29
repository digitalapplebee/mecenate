import { useInfiniteQuery } from '@tanstack/react-query';

import { fetchCommentsPage } from '../api/feedApi';
import { commentsQueryKey } from '../model/feedQueryCache';

const COMMENTS_PAGE_SIZE = 8;

export function usePostCommentsQuery(postId: string, enabled = true) {
  return useInfiniteQuery({
    enabled,
    queryKey: commentsQueryKey(postId),
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam }) =>
      fetchCommentsPage({
        cursor: pageParam,
        limit: COMMENTS_PAGE_SIZE,
        postId,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? (lastPage.nextCursor ?? undefined) : undefined,
  });
}
