const assert = require('node:assert/strict');
const test = require('node:test');

const { QueryClient } = require('@tanstack/react-query');
const {
  applyCommentAdded,
  applyPostLike,
  commentsQueryKey,
  postQueryKey,
} = require('../.test-build/features/feed/model/feedQueryCache.js');

const author = {
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'Bio',
  displayName: 'Creator',
  id: 'author-1',
  isVerified: true,
  subscribersCount: 42,
  username: 'creator',
};

function createPost(overrides = {}) {
  return {
    author,
    body: 'Body',
    commentsCount: 0,
    coverUrl: 'https://example.com/cover.png',
    createdAt: '2026-05-04T10:00:00.000Z',
    id: 'post-1',
    isLiked: false,
    likesCount: 3,
    preview: 'Preview',
    tier: 'free',
    title: 'Title',
    ...overrides,
  };
}

function createComment(overrides = {}) {
  return {
    author,
    createdAt: '2026-05-04T10:00:00.000Z',
    id: 'comment-1',
    postId: 'post-1',
    text: 'Hello',
    ...overrides,
  };
}

function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        gcTime: Infinity,
        retry: false,
      },
    },
  });
}

test('applyPostLike updates post and matching feed pages', () => {
  const queryClient = createQueryClient();
  const post = createPost();

  queryClient.setQueryData(postQueryKey(post.id), post);
  queryClient.setQueryData(['feed', 'all'], {
    pageParams: [undefined],
    pages: [
      {
        hasMore: false,
        nextCursor: null,
        posts: [post],
      },
    ],
  });

  applyPostLike(queryClient, post.id, {
    isLiked: true,
    likesCount: 4,
  });

  assert.equal(queryClient.getQueryData(postQueryKey(post.id)).isLiked, true);
  assert.equal(queryClient.getQueryData(postQueryKey(post.id)).likesCount, 4);
  assert.equal(
    queryClient.getQueryData(['feed', 'all']).pages[0].posts[0].likesCount,
    4,
  );
});

test('applyCommentAdded inserts a comment and deduplicates realtime echoes', () => {
  const queryClient = createQueryClient();
  const post = createPost();
  const comment = createComment();

  queryClient.setQueryData(postQueryKey(post.id), post);
  queryClient.setQueryData(commentsQueryKey(post.id), {
    pageParams: [undefined],
    pages: [
      {
        comments: [],
        hasMore: false,
        nextCursor: null,
      },
    ],
  });

  applyCommentAdded(queryClient, comment);
  applyCommentAdded(queryClient, comment);

  assert.equal(
    queryClient.getQueryData(commentsQueryKey(post.id)).pages[0].comments.length,
    1,
  );
  assert.equal(queryClient.getQueryData(postQueryKey(post.id)).commentsCount, 1);
});
