import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { colors, spacing } from "./theme";

export function GoldDivider({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      <LinearGradient
        colors={["transparent", colors.accent, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
      <View style={styles.diamond} />
      <LinearGradient
        colors={["transparent", colors.accent, "transparent"]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.line}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
  },
  line: { flex: 1, height: 1 },
  diamond: {
    width: 8,
    height: 8,
    backgroundColor: colors.accent,
    transform: [{ rotate: "45deg" }],
    marginHorizontal: spacing.sm,
  },
});
