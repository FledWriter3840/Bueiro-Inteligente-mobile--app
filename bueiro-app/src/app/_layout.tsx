import * as Notifications from 'expo-notifications';
import { Stack } from 'expo-router';

import { cores } from '../constants/theme';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: cores.fundo },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="bueiro/[id]" />
    </Stack>
  );
}
