import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useBootstrap } from "../src/hooks/useBootstrap";
import { colors } from "../src/ui/theme";

export default function RootLayout() {
  useBootstrap();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.text,
            contentStyle: { backgroundColor: colors.bg },
            headerTitleStyle: { fontWeight: "700" },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Boons & Curses" }} />
          <Stack.Screen name="create" options={{ title: "Create Room" }} />
          <Stack.Screen name="join" options={{ title: "Join Room" }} />
          <Stack.Screen name="lobby/[code]" options={{ title: "Lobby" }} />
          <Stack.Screen name="game/[code]" options={{ title: "Game", headerBackVisible: false }} />
          <Stack.Screen name="help" options={{ title: "How to play" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
