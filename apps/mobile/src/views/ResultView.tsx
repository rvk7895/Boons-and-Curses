import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { colors, radii, spacing, typography } from "../ui/theme";

export function ResultView() {
  const router = useRouter();
  const state = useGameStore((s) => s.state);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const reset = useGameStore((s) => s.reset);

  if (!state) return null;
  const winner = state.players.find((p) => p.id === state.winner);
  const iWon = winner?.id === myPlayerId;

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
      <Text style={[typography.title, { color: iWon ? colors.accent : colors.text }]}>
        {iWon ? "Victory" : winner ? `${winner.name} wins` : "Game over"}
      </Text>
      <Text style={typography.dim}>Ran for {state.round} combat rounds.</Text>

      <View style={styles.board}>
        {standings.map((p, i) => (
          <View key={p.id} style={styles.row}>
            <Text style={styles.rank}>#{i + 1}</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>
                {p.name} {p.id === myPlayerId ? "(you)" : ""}
              </Text>
              <Text style={typography.dim}>
                {p.god ?? "?"} · HP {Math.max(0, p.stats.health)}/{p.maxHealth}
              </Text>
            </View>
          </View>
        ))}
      </View>

      <View style={{ flex: 1 }} />
      <Button label="Back to home" onPress={backHome} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, padding: spacing.lg, gap: spacing.md },
  board: {
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
  },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  rank: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: "800",
    width: 40,
  },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
});
