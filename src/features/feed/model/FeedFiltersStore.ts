import { makeAutoObservable } from 'mobx';

import type { FeedTier } from '../api/feed.types';

export type FeedTierFilter = 'all' | FeedTier;

export class FeedFiltersStore {
  tier: FeedTierFilter = 'all';

  constructor() {
    makeAutoObservable(this);
  }

  setTier(nextTier: FeedTierFilter) {
    this.tier = nextTier;
  }

  reset() {
    this.tier = 'all';
  }

  get apiTier(): FeedTier | undefined {
    return this.tier === 'all' ? undefined : this.tier;
  }
}
