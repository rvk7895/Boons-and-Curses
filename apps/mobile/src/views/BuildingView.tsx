import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, ZoomIn } from "react-native-reanimated";
import { Card } from "../components/Card";
import { Die } from "../components/Die";
import { GodPortrait } from "../components/GodPortrait";
import { StatBar } from "../components/StatBar";
import { StatusBadges } from "../components/StatusBadges";
import { sendAction } from "../net/actions";
import { useGameStore, type VisiblePlayer } from "../state/gameStore";
import { Button } from "../ui/Button";
import { GoldDivider } from "../ui/GoldDivider";
import { colors, elevation, godPalette, radii, spacing, typography } from "../ui/theme";

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
        <View>
          <Text style={typography.micro}>BUILDING PHASE</Text>
          <Text style={typography.title}>Round {state.round}</Text>
        </View>
        <View style={styles.deckPill}>
          <Text style={typography.micro}>DECK</Text>
          <Text style={typography.heading}>{state.deckSize}</Text>
        </View>
      </View>

      <Animated.View entering={FadeIn.duration(300)} style={styles.turnBanner}>
        <Text style={typography.dim}>
          {isMyTurn ? "Your turn." : `Awaiting ${active?.name ?? "…"}.`}
        </Text>
      </Animated.View>

      {isMyTurn && myDraw ? (
        <Animated.View entering={FadeInDown.duration(400)} style={[styles.drawSection, elevation.high]}>
          <View style={styles.drawHeader}>
            <Text style={typography.micro}>YOUR DRAW</Text>
            <Die value={myDraw.diceRoll} />
          </View>
          <Animated.View entering={ZoomIn.duration(450)}>
            <Card id={myDraw.cardId} />
          </Animated.View>
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
        </Animated.View>
      ) : null}

      <Text style={[typography.heading, { marginTop: spacing.md }]}>CHAMPIONS</Text>
      <GoldDivider />
      {state.players.map((p, i) => (
        <Animated.View key={p.id} entering={FadeInDown.delay(i * 60).duration(300)}>
          <PlayerRow player={p} isYou={p.id === myPlayerId} />
        </Animated.View>
      ))}

      {me && me.hand && me.hand.length > 0 ? (
        <>
          <Text style={[typography.heading, { marginTop: spacing.md }]}>YOUR ARSENAL</Text>
          <GoldDivider />
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
  const pal = p.god ? godPalette[p.god] ?? godPalette.zeus! : godPalette.zeus!;
  return (
    <View style={[styles.playerCard, elevation.low, { borderColor: pal.primary + "55" }]}>
      <View style={styles.playerHead}>
        {p.god ? <GodPortrait god={p.god} size={44} /> : <View style={styles.portraitPlaceholder} />}
        <View style={{ flex: 1 }}>
          <Text style={styles.playerName}>
            {p.name}
            {isYou ? " · you" : ""}
          </Text>
          <Text style={typography.dim}>
            {(p.god ?? "—").toUpperCase()} · hand {p.handSize} · {p.points} pts
          </Text>
        </View>
      </View>
      <StatBar
        value={Math.max(0, p.stats.health)}
        max={p.maxHealth || 1}
        label="HP"
        accent={pal.primary}
      />
      <StatusBadges statuses={p.statuses} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xl },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  deckPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  turnBanner: {
    backgroundColor: "rgba(227,179,74,0.08)",
    borderRadius: radii.md,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.accentDark + "55",
  },
  drawSection: {
    padding: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    alignItems: "center",
  },
  drawHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    width: "100%",
    justifyContent: "space-between",
  },
  actions: { flexDirection: "row", gap: spacing.sm, width: "100%" },
  playerCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    gap: spacing.sm,
  },
  playerHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  portraitPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.bgElev,
  },
  playerName: { color: colors.text, fontSize: 15, fontFamily: typography.heading.fontFamily },
  hand: { gap: spacing.xs, paddingVertical: spacing.xs },
  error: { color: colors.danger, fontSize: 13 },
});
