import { useQuery } from '@tanstack/react-query';

import { fetchPost } from '../api/feedApi';
import type { Post } from '../api/feed.types';
import { postQueryKey } from '../model/feedQueryCache';

export function usePostQuery(postId: string, initialPost?: Post) {
  return useQuery({
    queryKey: postQueryKey(postId),
    queryFn: () => fetchPost(postId),
    placeholderData: initialPost,
  });
}
