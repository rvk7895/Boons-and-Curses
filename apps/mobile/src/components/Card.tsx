import { CARDS, type CardId } from "@bc/shared";
import { StyleSheet, Text, View, Pressable, type ViewStyle } from "react-native";
import { colors, radii, spacing, typography } from "../ui/theme";

type Props = {
  id: CardId;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
};

const GOD_COLORS: Record<string, string> = {
  zeus: "#f2c94c",
  hephaestus: "#e26a3b",
  aphrodite: "#e29bd4",
  athena: "#8fc8e2",
  hades: "#7c6fd2",
  poseidon: "#5bbba2",
};

export function Card({ id, selected, onPress, disabled, compact, style }: Props) {
  const def = CARDS[id];
  const accent = GOD_COLORS[def.god] ?? colors.accent;
  const body = (
    <View
      style={[
        styles.card,
        compact ? styles.compact : null,
        { borderColor: selected ? accent : colors.border },
        selected ? { backgroundColor: colors.bgElev } : null,
        style,
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.prefix, { color: accent }]}>{def.prefix}</Text>
        <Text style={styles.kind}>{def.kind.toUpperCase()}</Text>
      </View>
      <Text style={typography.heading} numberOfLines={1}>
        {def.id}
      </Text>
      {!compact ? (
        <View style={{ marginTop: spacing.xs, gap: 2 }}>
          {def.effects.slice(0, 3).map((e, i) => (
            <Text key={i} style={styles.effect} numberOfLines={1}>
              · {formatEffect(e)}
            </Text>
          ))}
        </View>
      ) : null}
      <Text style={styles.points}>{def.points} pts</Text>
    </View>
  );
  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

function formatEffect(e: { kind: string } & Record<string, unknown>): string {
  switch (e.kind) {
    case "damage":
      return `Deal ${e.power} (${e.probability}%)`;
    case "aoeDamage":
      return `AoE ${e.powerDividedByOpponents}`;
    case "selfHeal":
      return `Heal ${e.amount}`;
    case "lifesteal":
      return `Lifesteal ${Math.round((e.fraction as number) * 100)}%`;
    case "selfStat":
      return `Self ${e.stat} ${fmtDelta(e.delta as number)}`;
    case "oppStat":
      return `Opp ${e.stat} ${fmtDelta(e.delta as number)}`;
    case "applyStatusSelf":
      return `Self ${e.status} ${e.turns}t`;
    case "applyStatusOpp":
      return `Opp ${e.status} ${e.turns}t (${e.chance}%)`;
    case "clearOppStatuses":
      return "Clear opp statuses";
    case "clearSelfGod":
      return "Null patron";
    case "conditionalStab":
      return "STAB-conditional";
    default:
      return String(e.kind);
  }
}

function fmtDelta(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 2,
    backgroundColor: colors.bg,
    gap: spacing.xs,
    minWidth: 160,
  },
  compact: { padding: spacing.sm, minWidth: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  prefix: { fontWeight: "700", fontSize: 14, letterSpacing: 2 },
  kind: { color: colors.textDim, fontSize: 10, fontWeight: "600", letterSpacing: 1 },
  effect: { color: colors.textDim, fontSize: 12 },
  points: {
    marginTop: spacing.xs,
    color: colors.accent,
    fontSize: 12,
    fontWeight: "600",
    alignSelf: "flex-end",
  },
});
