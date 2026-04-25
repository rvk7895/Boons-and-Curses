import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../ui/theme";

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  burn: { color: "#ee884a", label: "BURN" },
  invulnerable: { color: "#9bd0e8", label: "INVULN" },
  lastStand: { color: "#e3b34a", label: "LAST STAND" },
  blacksmith: { color: "#ec97c8", label: "BLACKSMITH" },
};

export function StatusBadges({ statuses }: { statuses: Record<string, number> }) {
  const active = Object.entries(statuses).filter(([, v]) => v > 0);
  if (active.length === 0) return null;
  return (
    <View style={styles.row}>
      {active.map(([k, v]) => {
        const style = STATUS_STYLE[k] ?? { color: colors.accent, label: k.toUpperCase() };
        return (
          <View
            key={k}
            style={[
              styles.badge,
              { borderColor: style.color, backgroundColor: `${style.color}22` },
            ]}
          >
            <Text style={[typography.micro, { color: style.color }]}>
              {style.label}
              {v < 99 ? `  ${v}t` : ""}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.pill,
    borderWidth: 1,
  },
});
