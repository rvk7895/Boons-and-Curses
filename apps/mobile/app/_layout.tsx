import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAppFonts } from "../src/hooks/useFonts";
import { useBootstrap } from "../src/hooks/useBootstrap";
import { colors } from "../src/ui/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const fontsLoaded = useAppFonts();
  useBootstrap();

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bgDeep }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bgDeep },
            headerTintColor: colors.marble,
            headerTitleStyle: { fontFamily: "Cinzel_700Bold" },
            contentStyle: { backgroundColor: colors.bgDeep },
            headerShadowVisible: false,
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="create" options={{ title: "Create Room" }} />
          <Stack.Screen name="join" options={{ title: "Join Room" }} />
          <Stack.Screen name="lobby/[code]" options={{ title: "Lobby" }} />
          <Stack.Screen
            name="game/[code]"
            options={{ title: "Arena", headerBackVisible: false }}
          />
          <Stack.Screen name="help" options={{ title: "How to Play" }} />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
