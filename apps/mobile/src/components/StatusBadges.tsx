import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../ui/theme";

type Status = Record<string, number>;

export function StatusBadges({ statuses }: { statuses: Status }) {
  const active = Object.entries(statuses).filter(([, v]) => v > 0);
  if (active.length === 0) return null;
  return (
    <View style={styles.row}>
      {active.map(([k, v]) => (
        <View key={k} style={[styles.badge, { borderColor: colorFor(k) }]}>
          <Text style={[styles.text, { color: colorFor(k) }]}>
            {k.toUpperCase()} {v > 99 ? "" : `${v}t`}
          </Text>
        </View>
      ))}
    </View>
  );
}

function colorFor(status: string): string {
  switch (status) {
    case "burn":
      return "#e26a3b";
    case "invulnerable":
      return "#8fc8e2";
    case "lastStand":
      return "#e05263";
    case "blacksmith":
      return "#d4a14a";
    default:
      return colors.textDim;
  }
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  text: { fontSize: 10, fontWeight: "700", letterSpacing: 1 },
});
