import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <>
      <AnimatedSplashOverlay />

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: {
            backgroundColor: '#F4F2ED',
          },
        }}
      >
        <Stack.Screen name="index" />
      <Stack.Screen
        name="login"
        options={{
          presentation: 'transparentModal',
          animation: 'fade',
          headerShown: false,
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
        <Stack.Screen name="country" />
        <Stack.Screen name="chat" />
        <Stack.Screen name="room-management" />
        <Stack.Screen name="room-ranks" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="support" />
      </Stack>
    </>
  );
}
