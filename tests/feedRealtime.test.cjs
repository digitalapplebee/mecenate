const assert = require('node:assert/strict');
const test = require('node:test');

const {
  parseFeedRealtimeEvent,
} = require('../.test-build/features/feed/api/feedRealtime.js');

const author = {
  avatarUrl: 'https://example.com/avatar.png',
  bio: 'Bio',
  displayName: 'Creator',
  id: 'author-1',
  isVerified: true,
  subscribersCount: 42,
  username: 'creator',
};

test('parseFeedRealtimeEvent parses like updates', () => {
  assert.deepEqual(
    parseFeedRealtimeEvent(
      JSON.stringify({
        likesCount: 7,
        postId: 'post-1',
        type: 'like_updated',
      }),
    ),
    {
      likesCount: 7,
      postId: 'post-1',
      type: 'like_updated',
    },
  );
});

test('parseFeedRealtimeEvent parses comments with runtime validation', () => {
  const comment = {
    author,
    createdAt: '2026-05-04T10:00:00.000Z',
    id: 'comment-1',
    postId: 'post-1',
    text: 'Hello',
  };

  assert.deepEqual(
    parseFeedRealtimeEvent(
      JSON.stringify({
        comment,
        postId: 'post-1',
        type: 'comment_added',
      }),
    ),
    {
      comment,
      postId: 'post-1',
      type: 'comment_added',
    },
  );
});

test('parseFeedRealtimeEvent ignores malformed payloads', () => {
  assert.equal(parseFeedRealtimeEvent('not-json'), null);
  assert.equal(
    parseFeedRealtimeEvent(
      JSON.stringify({
        likesCount: '7',
        postId: 'post-1',
        type: 'like_updated',
      }),
    ),
    null,
  );
});
