import type { PropsWithChildren } from 'react';
import { createContext, useContext, useState } from 'react';

import { FeedFiltersStore } from '../../features/feed/model/FeedFiltersStore';

type RootStore = {
  feedFiltersStore: FeedFiltersStore;
};

const RootStoreContext = createContext<RootStore | null>(null);

export function RootStoreProvider({ children }: PropsWithChildren) {
  const [rootStore] = useState<RootStore>(() => ({
    feedFiltersStore: new FeedFiltersStore(),
  }));

  return (
    <RootStoreContext.Provider value={rootStore}>
      {children}
    </RootStoreContext.Provider>
  );
}

export function useRootStore() {
  const store = useContext(RootStoreContext);

  if (!store) {
    throw new Error('useRootStore must be used inside RootStoreProvider');
  }

  return store;
}
