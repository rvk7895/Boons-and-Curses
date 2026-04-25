import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing, typography } from "../ui/theme";

type Entry = { id: string; name: string; active: boolean; eliminated: boolean };

export function TurnQueue({ entries }: { entries: Entry[] }) {
  return (
    <View style={styles.row}>
      {entries.map((e, i) => (
        <View
          key={e.id}
          style={[
            styles.chip,
            e.eliminated && styles.eliminated,
            e.active && styles.active,
          ]}
        >
          <Text style={[styles.text, e.active && { color: colors.accentText }]}>
            {i + 1} · {e.name}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accentHi },
  eliminated: { opacity: 0.35 },
  text: { color: colors.text, fontSize: 12, fontFamily: typography.heading.fontFamily, letterSpacing: 0.5 },
});
