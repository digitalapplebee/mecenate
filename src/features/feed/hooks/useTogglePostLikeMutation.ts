import { useMutation, useQueryClient } from '@tanstack/react-query';

import { togglePostLike } from '../api/feedApi';
import type { Post } from '../api/feed.types';
import {
  applyPostLike,
  feedQueryKey,
  postQueryKey,
  updateCachedPost,
} from '../model/feedQueryCache';

export function useTogglePostLikeMutation(post: Post) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => togglePostLike(post.id),
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: postQueryKey(post.id) }),
        queryClient.cancelQueries({ queryKey: feedQueryKey }),
      ]);

      const cachedPost =
        queryClient.getQueryData<Post>(postQueryKey(post.id)) ?? post;
      const nextIsLiked = !cachedPost.isLiked;
      const nextLikesCount = Math.max(
        0,
        cachedPost.likesCount + (nextIsLiked ? 1 : -1),
      );

      applyPostLike(queryClient, post.id, {
        isLiked: nextIsLiked,
        likesCount: nextLikesCount,
      });

      return {
        previousPost: cachedPost,
      };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPost) {
        updateCachedPost(queryClient, post.id, () => context.previousPost);
      }
    },
    onSuccess: (data) => {
      applyPostLike(queryClient, post.id, data);
    },
  });
}
