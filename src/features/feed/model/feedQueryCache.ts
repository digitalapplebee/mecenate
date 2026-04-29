import type { InfiniteData, QueryClient } from '@tanstack/react-query';

import type { Comment, CommentsPage, FeedPage, Post } from '../api/feed.types';

export const feedQueryKey = ['feed'] as const;

export function postQueryKey(postId: string) {
  return ['post', postId] as const;
}

export function commentsQueryKey(postId: string) {
  return ['comments', postId] as const;
}

type LikePatch = {
  isLiked?: boolean;
  likesCount: number;
};

const appliedCommentIds = new Set<string>();

export function applyPostLike(
  queryClient: QueryClient,
  postId: string,
  patch: LikePatch,
) {
  updateCachedPost(queryClient, postId, (post) => ({
    ...post,
    isLiked: patch.isLiked ?? post.isLiked,
    likesCount: patch.likesCount,
  }));
}

export function applyCommentAdded(
  queryClient: QueryClient,
  comment: Comment,
) {
  // Realtime can echo a comment that was already inserted after createComment.
  if (appliedCommentIds.has(comment.id)) {
    return;
  }

  appliedCommentIds.add(comment.id);

  if (hasCachedComment(queryClient, comment)) {
    return;
  }

  queryClient.setQueryData<InfiniteData<CommentsPage>>(
    commentsQueryKey(comment.postId),
    (data) => {
      if (!data || data.pages.length === 0) {
        return data;
      }

      const lastPageIndex = data.pages.length - 1;

      return {
        ...data,
        pages: data.pages.map((page, index) =>
          index === lastPageIndex
            ? {
                ...page,
                comments: [...page.comments, comment],
              }
            : page,
        ),
      };
    },
  );

  updateCachedPost(queryClient, comment.postId, (post) => ({
    ...post,
    commentsCount: post.commentsCount + 1,
  }));
}

export function updateCachedPost(
  queryClient: QueryClient,
  postId: string,
  updater: (post: Post) => Post,
) {
  queryClient.setQueryData<Post>(postQueryKey(postId), (post) =>
    post ? updater(post) : post,
  );

  queryClient.setQueriesData<InfiniteData<FeedPage>>(
    { queryKey: feedQueryKey },
    (data) => {
      if (!data) {
        return data;
      }

      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          posts: page.posts.map((post) =>
            post.id === postId ? updater(post) : post,
          ),
        })),
      };
    },
  );
}

function hasCachedComment(queryClient: QueryClient, comment: Comment) {
  const data = queryClient.getQueryData<InfiniteData<CommentsPage>>(
    commentsQueryKey(comment.postId),
  );

  return Boolean(
    data?.pages.some((page) =>
      page.comments.some((cachedComment) => cachedComment.id === comment.id),
    ),
  );
}
