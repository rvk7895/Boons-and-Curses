import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../ui/theme";

type Props = {
  value: number;
  max: number;
  label: string;
  accent?: string;
};

export function StatBar({ value, max, label, accent = colors.accent }: Props) {
  const pct = Math.max(0, Math.min(1, value / Math.max(1, max)));
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: accent }]} />
      </View>
      <Text style={styles.value}>
        {value}
        <Text style={styles.max}> / {max}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    width: 68,
    color: colors.textDim,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  track: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: radii.sm,
  },
  value: {
    width: 76,
    textAlign: "right",
    color: colors.text,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
  },
  max: {
    color: colors.textDim,
  },
});
