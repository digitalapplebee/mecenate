import {
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/manrope';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AppProviders } from './src/core/providers/AppProviders';
import { FeedScreen } from './src/features/feed/ui/FeedScreen';
import { colors } from './src/shared/theme/tokens';

export default function App() {
  const [fontsLoaded] = useFonts({
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
  });

  if (!fontsLoaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <AppProviders>
      <StatusBar style="dark" />
      <FeedScreen />
    </AppProviders>
  );
}
