import { CARDS, type CardId } from "@bc/shared";
import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { Card } from "../components/Card";
import { GodPortrait } from "../components/GodPortrait";
import { StatBar } from "../components/StatBar";
import { StatusBadges } from "../components/StatusBadges";
import { TurnQueue } from "../components/TurnQueue";
import { sendAction } from "../net/actions";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { GoldDivider } from "../ui/GoldDivider";
import { colors, elevation, godPalette, radii, spacing, typography } from "../ui/theme";

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
        <View>
          <Text style={typography.micro}>COMBAT</Text>
          <Text style={typography.title}>Round {state.round}</Text>
        </View>
        {isMyTurn ? (
          <View style={styles.yourTurnPill}>
            <Text style={[typography.micro, { color: colors.accentText }]}>YOUR TURN</Text>
          </View>
        ) : null}
      </View>

      <TurnQueue entries={queueEntries} />

      {state.players.map((p, i) => {
        const pal = p.god ? godPalette[p.god] ?? godPalette.zeus! : godPalette.zeus!;
        const isTarget = selectedTarget === p.id;
        return (
          <Animated.View
            key={p.id}
            entering={FadeInUp.delay(i * 60).duration(300)}
            style={[
              styles.playerCard,
              elevation.low,
              { borderColor: isTarget ? colors.accent : pal.primary + "44" },
              !p.alive && { opacity: 0.4 },
              isTarget && elevation.glow,
            ]}
          >
            <View style={styles.playerHead}>
              {p.god ? <GodPortrait god={p.god} size={48} /> : null}
              <View style={{ flex: 1 }}>
                <Text style={styles.playerName}>
                  {p.name}
                  {p.id === myPlayerId ? " · you" : ""}
                  {!p.alive ? " · fallen" : ""}
                </Text>
                <Text style={typography.dim}>{(p.god ?? "—").toUpperCase()}</Text>
              </View>
            </View>
            <StatBar
              value={Math.max(0, p.stats.health)}
              max={p.maxHealth || 1}
              label="HP"
              accent={pal.primary}
            />
            <View style={styles.miniStats}>
              <Mini label="STR" v={p.stats.strength} />
              <Mini label="DEF" v={p.stats.defense} />
              <Mini label="SPD" v={p.stats.speed} />
              <Mini label="AFF" v={p.stats.affinity} />
            </View>
            <StatusBadges statuses={p.statuses} />
            {isMyTurn && needsTarget && p.id !== myPlayerId && p.alive ? (
              <Pressable
                onPress={() => setSelectedTarget(p.id)}
                style={[styles.targetPill, isTarget && styles.targetPillActive]}
              >
                <Text
                  style={{
                    color: isTarget ? colors.accentText : colors.text,
                    fontFamily: "Inter_700Bold",
                    letterSpacing: 1,
                  }}
                >
                  {isTarget ? "TARGETED" : "Mark target"}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>
        );
      })}

      {myRole === "PLAYER" && me?.hand && me.alive ? (
        <>
          <Text style={[typography.heading, { marginTop: spacing.md }]}>YOUR HAND</Text>
          <GoldDivider />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hand}>
            {me.hand.map((id, i) => (
              <Animated.View key={`${id}-${i}`} entering={FadeIn.delay(80 * i)}>
                <Card
                  id={id}
                  selected={selectedCard === id}
                  onPress={() => setSelectedCard(id === selectedCard ? null : id)}
                  style={{ marginRight: spacing.xs }}
                />
              </Animated.View>
            ))}
            {me.hand.length === 0 ? (
              <Text style={[typography.dim, { padding: spacing.md }]}>
                No attack cards in hand. You must pass.
              </Text>
            ) : null}
          </ScrollView>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {isMyTurn ? (
            me.hand.length === 0 ? (
              <Button label="Pass" onPress={pass} loading={busy} />
            ) : (
              <Button
                label={canPlay ? "Strike" : needsTarget ? "Mark a target" : "Select a card"}
                onPress={play}
                loading={busy}
                disabled={!canPlay}
              />
            )
          ) : (
            <Text style={[typography.dim, { textAlign: "center" }]}>
              Awaiting your turn…
            </Text>
          )}
        </>
      ) : null}
    </ScrollView>
  );
}

function Mini({ label, v }: { label: string; v: number }) {
  return (
    <View style={styles.miniBlock}>
      <Text style={[typography.micro, { color: colors.textMuted }]}>{label}</Text>
      <Text style={styles.miniVal}>{v}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  yourTurnPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    backgroundColor: colors.accent,
  },
  playerCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 2,
    gap: spacing.sm,
  },
  playerHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  playerName: { color: colors.text, fontSize: 15, fontFamily: typography.heading.fontFamily },
  miniStats: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  miniBlock: { gap: 2 },
  miniVal: {
    color: colors.text,
    fontSize: 14,
    fontVariant: ["tabular-nums"],
    fontFamily: typography.body.fontFamily,
  },
  targetPill: {
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  targetPillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accentHi,
  },
  hand: { gap: spacing.xs, paddingVertical: spacing.sm },
  error: { color: colors.danger, fontSize: 13 },
});
