import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import '../global.css';

import { useColorScheme } from '@/components/useColorScheme';
import { useAppStore } from '@/lib/store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

const MindReelDark = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#0a0a0f',
    card: '#16161f',
    border: '#2a2a3d',
    primary: '#818cf8',
    text: '#f1f5f9',
  },
};

export default function RootLayout() {
  const initMockData = useAppStore((s) => s.initMockData);
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      initMockData();
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? MindReelDark : DefaultTheme}>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: true }} />
        <Stack.Screen name="feed/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="interests/index" options={{ headerShown: true }} />
        <Stack.Screen name="interests/edit" options={{ headerShown: true }} />
        <Stack.Screen name="interests/[id]" options={{ headerShown: true }} />
        <Stack.Screen name="feed-config/index" options={{ headerShown: true }} />
        <Stack.Screen name="feed-config/edit" options={{ headerShown: true }} />
      </Stack>
    </ThemeProvider>
  );
}
