import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppProviders } from './src/core/providers/AppProviders';
import type { Post } from './src/features/feed/api/feed.types';
import { FeedScreen } from './src/features/feed/ui/FeedScreen';
import { PostDetailScreen } from './src/features/feed/ui/PostDetailScreen';
import type { PostTransitionOrigin } from './src/features/feed/ui/postTransition';
import { colors } from './src/shared/theme/tokens';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isPostPresented, setPostPresented] = useState(false);
  const [transitionOrigin, setTransitionOrigin] =
    useState<PostTransitionOrigin | null>(null);

  const handleOpenPost = useCallback((post: Post, origin?: PostTransitionOrigin) => {
    setTransitionOrigin(origin ?? null);
    setSelectedPost(post);
    setPostPresented(true);
  }, []);

  const handleRequestClosePost = useCallback(() => {
    setPostPresented(false);
  }, []);

  const handlePostDismissed = useCallback(() => {
    setSelectedPost(null);
    setPostPresented(false);
    setTransitionOrigin(null);
  }, []);

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <AppProviders>
      <View style={styles.root}>
        <StatusBar style="dark" />
        <FeedScreen
          hiddenPostId={selectedPost?.id}
          isPostOpen={Boolean(selectedPost && isPostPresented)}
          onOpenPost={handleOpenPost}
        />
        {selectedPost ? (
          <PostDetailScreen
            key={selectedPost.id}
            isPresented={isPostPresented}
            onBack={handleRequestClosePost}
            onDismissed={handlePostDismissed}
            post={selectedPost}
            transitionOrigin={transitionOrigin}
          />
        ) : null}
      </View>
    </AppProviders>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
