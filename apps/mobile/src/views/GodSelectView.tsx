import { GOD_IDS, type GodId } from "@bc/shared";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { sendAction } from "../net/actions";
import { useAuthStore } from "../state/authStore";
import { useGameStore } from "../state/gameStore";
import { Button } from "../ui/Button";
import { colors, radii, spacing, typography } from "../ui/theme";

const GOD_LORE: Record<GodId, { tag: string; blurb: string; stats: string }> = {
  zeus: {
    tag: "King of Olympus",
    blurb: "Versatile storm-bringer with strong balance across strength, speed, and health.",
    stats: "HP 340 / STR 150 / DEF 100 / SPD 110",
  },
  hephaestus: {
    tag: "Forge master",
    blurb: "The tank. Highest HP and defense; burns attackers over time.",
    stats: "HP 360 / DEF 170 / SPD 100",
  },
  aphrodite: {
    tag: "Goddess of love",
    blurb: "Charm and affinity specialist; manipulates damage modifiers via affinity.",
    stats: "HP 320 / CHM 50 / AFF 30",
  },
  athena: {
    tag: "Strategist",
    blurb: "Glass-cannon-lite; high strength and speed with low HP.",
    stats: "HP 260 / STR 150 / SPD 120",
  },
  hades: {
    tag: "Lord of the dead",
    blurb: "Fastest; variable-damage gambler cards and speed buffs.",
    stats: "HP 300 / SPD 140 / STR 120",
  },
  poseidon: {
    tag: "Storm of the sea",
    blurb: "Defensive with highest affinity; AoE finisher PS2.",
    stats: "HP 300 / DEF 140 / AFF 50",
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
    return <SpectatorWait state={state} />;
  }

  return (
    <View style={styles.root}>
      <Text style={typography.heading}>Choose your patron god</Text>
      <Text style={typography.dim}>
        {otherPicks}/{totalPlayers} players have chosen
      </Text>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.grid}>
        {GOD_IDS.map((g) => {
          const taken = state?.players.some((p) => p.god === g);
          const isChoice = choice === g;
          return (
            <Pressable
              key={g}
              disabled={alreadyChosen}
              onPress={() => setChoice(g)}
              style={[
                styles.godCard,
                isChoice && { borderColor: colors.accent },
                taken && { opacity: 0.45 },
              ]}
            >
              <Text style={styles.godName}>{g.toUpperCase()}</Text>
              <Text style={styles.godTag}>{GOD_LORE[g].tag}</Text>
              <Text style={styles.godBlurb}>{GOD_LORE[g].blurb}</Text>
              <Text style={styles.godStats}>{GOD_LORE[g].stats}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {alreadyChosen ? (
        <Text style={typography.dim}>
          You picked {myPlayer?.god?.toUpperCase()}. Waiting for the rest…
        </Text>
      ) : (
        <Button
          label={choice ? `Confirm ${choice.toUpperCase()}` : "Select a god"}
          disabled={!choice}
          loading={submitting}
          onPress={confirm}
        />
      )}
    </View>
  );
}

function SpectatorWait({ state }: { state: ReturnType<typeof useGameStore.getState>["state"] }) {
  const chosen = state?.players.filter((p) => p.god).length ?? 0;
  const total = state?.players.length ?? 0;
  return (
    <View style={styles.root}>
      <Text style={typography.heading}>Spectating</Text>
      <Text style={typography.dim}>Players choosing gods ({chosen}/{total})…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, gap: spacing.md },
  grid: { gap: spacing.sm, paddingBottom: spacing.lg },
  godCard: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.bgElev,
    gap: 4,
  },
  godName: { color: colors.accent, fontWeight: "800", fontSize: 18, letterSpacing: 2 },
  godTag: { color: colors.textDim, fontSize: 12, fontStyle: "italic" },
  godBlurb: { color: colors.text, fontSize: 14 },
  godStats: {
    color: colors.textDim,
    fontSize: 11,
    fontVariant: ["tabular-nums"],
    marginTop: 4,
  },
  error: { color: colors.danger, fontSize: 13 },
});
