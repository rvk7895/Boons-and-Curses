import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { sendAction } from "../net/actions";
import { useGameStore, type VisiblePlayer } from "../state/gameStore";
import { Button } from "../ui/Button";
import { colors, radii, spacing, typography } from "../ui/theme";
import { Card } from "../components/Card";
import { Die } from "../components/Die";
import { StatBar } from "../components/StatBar";
import { StatusBadges } from "../components/StatusBadges";

export function BuildingView() {
  const state = useGameStore((s) => s.state);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const myRole = useGameStore((s) => s.myRole);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!state) return null;
  const me = state.players.find((p) => p.id === myPlayerId);
  const activeId = state.turnOrder[state.activePlayerIdx];
  const active = state.players.find((p) => p.id === activeId);
  const isMyTurn = myPlayerId === activeId && myRole === "PLAYER";
  const myDraw = me?.pendingDraw ?? null;

  async function resolve(keep: boolean) {
    if (!myPlayerId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendAction({ kind: "resolveDraw", playerId: myPlayerId, keep });
      if (!res.ok) setError(res.error ?? "failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.topBar}>
        <Text style={typography.heading}>Building</Text>
        <Text style={typography.dim}>
          Deck: {state.deckSize} · Round {state.round}
        </Text>
      </View>

      <View style={styles.turnBanner}>
        <Text style={typography.dim}>
          {isMyTurn ? "Your turn" : `Waiting on ${active?.name ?? "…"}`}
        </Text>
      </View>

      {isMyTurn && myDraw ? (
        <View style={styles.drawSection}>
          <View style={styles.diceRow}>
            <Text style={typography.dim}>Dice</Text>
            <Die value={myDraw.diceRoll} />
          </View>
          <Card id={myDraw.cardId} />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.actions}>
            <Button
              label="Keep"
              onPress={() => resolve(true)}
              loading={busy}
              style={{ flex: 1 }}
            />
            <Button
              label="Discard"
              variant="secondary"
              onPress={() => resolve(false)}
              loading={busy}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      ) : null}

      <Text style={[typography.heading, { marginTop: spacing.md }]}>Players</Text>
      {state.players.map((p) => (
        <PlayerRow key={p.id} player={p} isYou={p.id === myPlayerId} />
      ))}

      {me && me.hand && me.hand.length > 0 ? (
        <>
          <Text style={[typography.heading, { marginTop: spacing.md }]}>Your hand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
            {me.hand.map((id, i) => (
              <Card key={`${id}-${i}`} id={id} compact style={{ marginRight: spacing.xs }} />
            ))}
          </ScrollView>
        </>
      ) : null}
    </ScrollView>
  );
}

function PlayerRow({ player, isYou }: { player: VisiblePlayer; isYou: boolean }) {
  const p = player;
  return (
    <View style={styles.playerCard}>
      <View style={styles.playerHead}>
        <Text style={styles.playerName}>
          {p.name} {isYou ? "(you)" : ""}
        </Text>
        <Text style={typography.dim}>
          {p.god ?? "?"} · {p.points} pts · hand {p.handSize}
        </Text>
      </View>
      <StatBar value={Math.max(0, p.stats.health)} max={p.maxHealth || 1} label="HP" />
      <StatusBadges statuses={p.statuses} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  turnBanner: {
    backgroundColor: colors.bgElev,
    padding: spacing.sm,
    borderRadius: radii.sm,
    alignItems: "center",
  },
  drawSection: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
    gap: spacing.sm,
  },
  diceRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  actions: { flexDirection: "row", gap: spacing.sm },
  playerCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  playerHead: { flexDirection: "row", justifyContent: "space-between" },
  playerName: { color: colors.text, fontSize: 15, fontWeight: "700" },
  hand: { gap: spacing.xs },
  error: { color: colors.danger, fontSize: 13 },
});
