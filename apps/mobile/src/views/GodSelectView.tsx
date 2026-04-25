import { GOD_IDS, type GodId } from "@bc/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { GodPortrait } from "../components/GodPortrait";
import { sendAction } from "../net/actions";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { GoldDivider } from "../ui/GoldDivider";
import { colors, godPalette, radii, spacing, typography } from "../ui/theme";

const GOD_LORE: Record<GodId, { tag: string; blurb: string; stats: string }> = {
  zeus: {
    tag: "King of Olympus",
    blurb: "Storm-bringer. Balanced strength, speed, and health.",
    stats: "HP 325 · STR 138 · SPD 110",
  },
  hephaestus: {
    tag: "Forge Master",
    blurb: "The tank. Highest defense; burns attackers over time.",
    stats: "HP 320 · DEF 140 · SPD 100",
  },
  aphrodite: {
    tag: "Goddess of Love",
    blurb: "Charm and affinity manipulator.",
    stats: "HP 318 · CHM 50 · AFF 30",
  },
  athena: {
    tag: "Strategist",
    blurb: "Glass-cannon. High strength and speed; lower HP.",
    stats: "HP 308 · STR 142 · SPD 130",
  },
  hades: {
    tag: "Lord of the Dead",
    blurb: "Fastest. Variable-damage gambler cards.",
    stats: "HP 325 · SPD 140 · STR 138",
  },
  poseidon: {
    tag: "Storm of the Sea",
    blurb: "Defensive control with the AoE finisher PS2.",
    stats: "HP 300 · DEF 125 · AFF 40",
  },
};

export function GodSelectView() {
  const state = useGameStore((s) => s.state);
  const myPlayerId = useGameStore((s) => s.myPlayerId);
  const myRole = useGameStore((s) => s.myRole);
  const [choice, setChoice] = useState<GodId | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const myPlayer = state?.players.find((p) => p.id === myPlayerId);
  const alreadyChosen = !!myPlayer?.god;
  const otherPicks = state?.players.filter((p) => p.id !== myPlayerId && p.god).length ?? 0;
  const totalPlayers = state?.players.length ?? 0;

  async function confirm() {
    if (!choice || !myPlayerId) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await sendAction({ kind: "selectGod", playerId: myPlayerId, god: choice });
      if (!res.ok) setError(res.error ?? "failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (myRole !== "PLAYER") {
    const chosen = state?.players.filter((p) => p.god).length ?? 0;
    return (
      <View style={styles.root}>
        <Text style={typography.title}>SPECTATING</Text>
        <Text style={typography.dim}>
          Champions choose their patrons ({chosen}/{totalPlayers})…
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={typography.title}>CHOOSE YOUR PATRON</Text>
        <GoldDivider style={{ width: 200, alignSelf: "center" }} />
        <Text style={[typography.dim, { textAlign: "center" }]}>
          {otherPicks}/{totalPlayers} have chosen
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid}>
        {GOD_IDS.map((g, i) => {
          const taken = state?.players.some((p) => p.god === g);
          const isChoice = choice === g;
          const lore = GOD_LORE[g];
          const pal = godPalette[g] ?? godPalette.zeus!;
          return (
            <Animated.View key={g} entering={FadeInDown.delay(i * 70).duration(400)}>
              <Pressable
                disabled={alreadyChosen}
                onPress={() => setChoice(g)}
                style={[
                  styles.godCard,
                  {
                    borderColor: isChoice ? pal.primary : colors.border,
                    backgroundColor: isChoice ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
                  },
                  taken && { opacity: 0.45 },
                ]}
              >
                <GodPortrait god={g} size={88} ring={isChoice} />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.heading, { color: pal.primary, letterSpacing: 2 }]}>
                    {g.toUpperCase()}
                  </Text>
                  <Text style={[typography.dim, { fontStyle: "italic" }]}>{lore.tag}</Text>
                  <Text style={[typography.body, { marginTop: spacing.xs }]}>{lore.blurb}</Text>
                  <Text style={[typography.micro, { marginTop: spacing.xs }]}>{lore.stats}</Text>
                </View>
              </Pressable>
            </Animated.View>
          );
        })}
      </ScrollView>

      {error ? <Text style={styles.error}>{error}</Text> : null}
      {alreadyChosen ? (
        <Animated.Text
          entering={FadeIn}
          style={[typography.dim, { textAlign: "center", marginBottom: spacing.sm }]}
        >
          You serve {myPlayer?.god?.toUpperCase()}. Awaiting the others…
        </Animated.Text>
      ) : (
        <Button
          label={choice ? `Pledge to ${choice.toUpperCase()}` : "Choose a God"}
          disabled={!choice}
          loading={submitting}
          onPress={confirm}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  header: { gap: spacing.xs },
  grid: { gap: spacing.sm, paddingBottom: spacing.lg },
  godCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    gap: spacing.md,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: "center" },
});
