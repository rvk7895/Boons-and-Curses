import { StyleSheet, Text, View, type ViewStyle } from "react-native";
import { colors, radii, spacing } from "../ui/theme";

type Props = {
  value: number;
  style?: ViewStyle;
};

export function Die({ value, style }: Props) {
  return (
    <View style={[styles.die, style]}>
      <Text style={styles.num}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  die: {
    width: 56,
    height: 56,
    borderRadius: radii.md,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  num: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.accentText,
  },
});
