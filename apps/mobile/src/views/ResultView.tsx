import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";
import { GodPortrait } from "../components/GodPortrait";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { GoldDivider } from "../ui/GoldDivider";
import { colors, godPalette, radii, spacing, typography } from "../ui/theme";

export function ResultView() {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const reset = useGameStore((s) => s.reset);

  const halo = useSharedValue(0);
  useEffect(() => {
    halo.value = withRepeat(withTiming(1, { duration: 2200 }), -1, true);
  }, [halo]);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.45 + halo.value * 0.35,
    transform: [{ scale: 1 + halo.value * 0.1 }],
  }));

  if (!state) return null;
  const winner = state.players.find((p) => p.id === state.winner);
  const iWon = winner?.id === myPlayerId;
  const winnerPal = winner?.god ? godPalette[winner.god] ?? godPalette.zeus! : godPalette.zeus!;

  const standings = state.players
    .slice()
    .sort((a, b) => {
      if (a.alive && !b.alive) return -1;
      if (!a.alive && b.alive) return 1;
      return (b.eliminatedAt ?? 0) - (a.eliminatedAt ?? 0);
    });

  function backHome() {
    reset();
    router.replace("/");
  }

  return (
    <View style={styles.root}>
      <Animated.View entering={ZoomIn.duration(600)} style={styles.heroWrap}>
        {winner?.god ? (
          <View style={{ alignItems: "center" }}>
            <Animated.View
              style={[
                styles.halo,
                { backgroundColor: winnerPal.primary + "44", shadowColor: winnerPal.primary },
                haloStyle,
              ]}
            />
            <GodPortrait god={winner.god} size={140} ring />
          </View>
        ) : null}
        <Text style={[typography.hero, { color: iWon ? colors.accent : colors.marble, marginTop: spacing.md }]}>
          {iWon ? "VICTORY" : winner ? "DEFEAT" : "STALEMATE"}
        </Text>
        <Text style={[typography.dim, { textAlign: "center" }]}>
          {winner
            ? `${winner.name} stands alone, blessed by ${winner.god?.toUpperCase()}.`
            : "All champions have fallen."}
        </Text>
        <GoldDivider style={{ width: 240 }} />
      </Animated.View>

      <View style={styles.board}>
        <Text style={typography.micro}>FINAL STANDINGS</Text>
        {standings.map((p, i) => {
          const pal = p.god ? godPalette[p.god] ?? godPalette.zeus! : godPalette.zeus!;
          return (
            <Animated.View
              key={p.id}
              entering={FadeInDown.delay(i * 100).duration(400)}
              style={styles.row}
            >
              <Text style={[styles.rank, { color: pal.primary }]}>#{i + 1}</Text>
              {p.god ? <GodPortrait god={p.god} size={36} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>
                  {p.name}
                  {p.id === myPlayerId ? " · you" : ""}
                </Text>
                <Text style={typography.dim}>
                  {(p.god ?? "—").toUpperCase()} · {Math.max(0, p.stats.health)}/{p.maxHealth} HP
                </Text>
              </View>
            </Animated.View>
          );
        })}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Return to Olympus" onPress={backHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg, gap: spacing.md },
  heroWrap: { alignItems: "center", marginTop: spacing.lg, gap: spacing.xs },
  halo: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
    elevation: 20,
  },
  board: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rank: {
    fontSize: 22,
    fontFamily: "Cinzel_700Bold",
    width: 40,
  },
  name: { color: colors.text, fontSize: 16, fontFamily: typography.heading.fontFamily },
});
