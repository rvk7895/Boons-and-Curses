import { StyleSheet, Text, View } from "react-native";
import { colors, radii, spacing } from "../ui/theme";

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
            {i + 1}. {e.name}
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
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElev,
  },
  active: { backgroundColor: colors.accent, borderColor: colors.accent },
  eliminated: { opacity: 0.4 },
  text: { color: colors.text, fontSize: 12, fontWeight: "600" },
});
