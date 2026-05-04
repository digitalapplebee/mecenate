const assert = require('node:assert/strict');
const test = require('node:test');

const {
  formatCompactCount,
  formatPostDate,
} = require('../.test-build/shared/lib/formatters.js');

test('formatCompactCount keeps small numbers readable', () => {
  assert.equal(formatCompactCount(999), '999');
});

test('formatCompactCount abbreviates large numbers', () => {
  assert.equal(formatCompactCount(1_200), '1.2K');
  assert.equal(formatCompactCount(15_200), '15K');
  assert.equal(formatCompactCount(2_500_000), '2.5M');
});

test('formatPostDate returns Russian day and month', () => {
  assert.equal(formatPostDate('2026-05-04T10:00:00.000Z'), '4 мая');
  assert.equal(formatPostDate('not-a-date'), '');
});
