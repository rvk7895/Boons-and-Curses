import { CARDS, type CardId } from "@bc/shared";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { sendAction } from "../net/actions";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { colors, radii, spacing, typography } from "../ui/theme";
import { Card } from "../components/Card";
import { StatBar } from "../components/StatBar";
import { StatusBadges } from "../components/StatusBadges";
import { TurnQueue } from "../components/TurnQueue";

export function FightingView() {
  const state = useGameStore((s) => s.state);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const myRole = useGameStore((s) => s.myRole);
  const [selectedCard, setSelectedCard] = useState<CardId | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const me = state?.players.find((p) => p.id === myPlayerId);
  const activeId = state?.turnOrder[state?.activePlayerIdx ?? 0];
  const isMyTurn = myPlayerId === activeId && myRole === "PLAYER" && !!me?.alive;
  const opponents = useMemo(
    () => state?.players.filter((p) => p.id !== myPlayerId && p.alive) ?? [],
    [state, myPlayerId],
  );
  const selectedDef = selectedCard ? CARDS[selectedCard] : null;
  const needsTarget = selectedDef?.needsOpponent ?? false;
  const canPlay = !!selectedCard && (!needsTarget || !!selectedTarget);

  if (!state) return null;

  async function play() {
    if (!myPlayerId || !selectedCard) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendAction({
        kind: "playAttack",
        playerId: myPlayerId,
        cardId: selectedCard,
        targetId: needsTarget ? selectedTarget : null,
      });
      if (!res.ok) setError(res.error ?? "failed");
      else {
        setSelectedCard(null);
        setSelectedTarget(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  async function pass() {
    if (!myPlayerId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await sendAction({ kind: "passFightingTurn", playerId: myPlayerId });
      if (!res.ok) setError(res.error ?? "failed");
    } finally {
      setBusy(false);
    }
  }

  const queueEntries = state.turnOrder.map((id) => {
    const p = state.players.find((pp) => pp.id === id);
    return {
      id,
      name: p?.name ?? id,
      active: id === activeId,
      eliminated: !p?.alive,
    };
  });

  return (
    <ScrollView contentContainerStyle={styles.root}>
      <View style={styles.topBar}>
        <Text style={typography.heading}>Combat</Text>
        <Text style={typography.dim}>Round {state.round}</Text>
      </View>

      <TurnQueue entries={queueEntries} />

      {state.players.map((p) => (
        <View
          key={p.id}
          style={[
            styles.playerCard,
            selectedTarget === p.id && { borderColor: colors.accent },
            !p.alive && { opacity: 0.4 },
          ]}
        >
          <View style={styles.playerHead}>
            <Text style={styles.playerName}>
              {p.name}
              {p.id === myPlayerId ? " (you)" : ""}
              {!p.alive ? " — defeated" : ""}
            </Text>
            <Text style={typography.dim}>{p.god ?? "?"}</Text>
          </View>
          <StatBar value={Math.max(0, p.stats.health)} max={p.maxHealth || 1} label="HP" />
          <View style={styles.miniStats}>
            <Text style={styles.mini}>STR {p.stats.strength}</Text>
            <Text style={styles.mini}>DEF {p.stats.defense}</Text>
            <Text style={styles.mini}>SPD {p.stats.speed}</Text>
            <Text style={styles.mini}>AFF {p.stats.affinity}</Text>
          </View>
          <StatusBadges statuses={p.statuses} />
          {isMyTurn && needsTarget && p.id !== myPlayerId && p.alive ? (
            <Pressable
              onPress={() => setSelectedTarget(p.id)}
              style={[
                styles.targetPill,
                selectedTarget === p.id && { backgroundColor: colors.accent },
              ]}
            >
              <Text
                style={{
                  color: selectedTarget === p.id ? colors.accentText : colors.text,
                  fontWeight: "600",
                }}
              >
                {selectedTarget === p.id ? "Target" : "Select target"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {myRole === "PLAYER" && me?.hand && me.alive ? (
        <>
          <Text style={[typography.heading, { marginTop: spacing.md }]}>Your hand</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
            {me.hand.map((id, i) => (
              <Card
                key={`${id}-${i}`}
                id={id}
                selected={selectedCard === id}
                onPress={() => setSelectedCard(id === selectedCard ? null : id)}
                style={{ marginRight: spacing.xs }}
              />
            ))}
            {me.hand.length === 0 ? (
              <Text style={typography.dim}>No attack cards — must pass.</Text>
            ) : null}
          </ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {isMyTurn ? (
            me.hand.length === 0 ? (
              <Button label="Pass turn" onPress={pass} loading={busy} />
            ) : (
              <Button label="Play" onPress={play} loading={busy} disabled={!canPlay} />
            )
          ) : (
            <Text style={typography.dim}>Waiting for your turn…</Text>
          )}
        </>
      ) : null}

      {opponents.length === 0 ? (
        <Text style={typography.dim}>No opponents remain.</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  playerCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
    borderWidth: 2,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  playerHead: { flexDirection: "row", justifyContent: "space-between" },
  playerName: { color: colors.text, fontSize: 15, fontWeight: "700" },
  miniStats: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  mini: { color: colors.textDim, fontSize: 12, fontVariant: ["tabular-nums"] },
  targetPill: {
    marginTop: spacing.xs,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.sm,
    backgroundColor: colors.border,
  },
  hand: { gap: spacing.xs },
  error: { color: colors.danger, fontSize: 13 },
});
