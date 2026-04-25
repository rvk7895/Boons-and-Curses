import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useAuthStore } from "../src/state/authStore";
import { Button } from "../src/ui/Button";
import { GoldDivider } from "../src/ui/GoldDivider";
import { Screen } from "../src/ui/Screen";
import { colors, spacing, typography } from "../src/ui/theme";

export default function Home() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);

  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) });
    subtitleOpacity.value = withSequence(
      withTiming(0, { duration: 350 }),
      withTiming(1, { duration: 700, easing: Easing.out(Easing.quad) }),
    );
    shimmer.value = withRepeat(withTiming(1, { duration: 2400 }), -1, true);
  }, [titleOpacity, subtitleOpacity, shimmer]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: (1 - titleOpacity.value) * 12 }],
  }));
  const subStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const glyphStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + shimmer.value * 0.4,
    transform: [{ scale: 1 + shimmer.value * 0.04 }],
  }));

  if (status !== "ready") {
    return (
      <Screen variant="hero">
        <View style={styles.center}>
          {status === "error" ? (
            <>
              <Text style={[typography.title, styles.mb]}>Oracle silent</Text>
              <Text style={typography.dim}>{error ?? "unable to reach the server"}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[typography.dim, { marginTop: spacing.md }]}>
                Summoning your champion…
              </Text>
            </>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen variant="hero">
      <View style={styles.heroSpace}>
        <Animated.Text style={[styles.glyph, glyphStyle]}>ψ</Animated.Text>
        <Animated.Text style={[typography.hero, styles.title, titleStyle]}>
          BOONS{"\n"}& CURSES
        </Animated.Text>
        <GoldDivider style={{ width: 220, alignSelf: "center" }} />
        <Animated.Text style={[typography.dim, styles.tagline, subStyle]}>
          A contest of champions on Mount Olympus.
        </Animated.Text>
      </View>

      <View style={styles.greeting}>
        <Text style={typography.micro}>WELCOME, CHAMPION</Text>
        <Text style={typography.heading}>{user?.displayName ?? "—"}</Text>
      </View>

      <View style={styles.actions}>
        <Button label="Create Room" onPress={() => router.push("/create")} />
        <Button label="Join Room" variant="secondary" onPress={() => router.push("/join")} />
        <Button label="How to Play" variant="ghost" onPress={() => router.push("/help")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heroSpace: { alignItems: "center", marginTop: spacing.xxl, gap: spacing.sm },
  glyph: {
    fontSize: 92,
    color: colors.accent,
    fontFamily: "Cinzel_700Bold",
    marginBottom: -8,
  },
  title: { textAlign: "center", lineHeight: 42 },
  tagline: { textAlign: "center", maxWidth: 280, marginTop: spacing.sm, fontStyle: "italic" },
  greeting: {
    marginTop: "auto",
    alignItems: "center",
    gap: spacing.xs,
  },
  actions: { gap: spacing.sm, marginBottom: spacing.md },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mb: { marginBottom: spacing.md },
});
