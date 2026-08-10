import { Stack } from "expo-router";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

export default function UserLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="event/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}
