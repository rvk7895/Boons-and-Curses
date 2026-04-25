import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors, radii, spacing, typography } from "../ui/theme";

type Props = {
  value: number;
  max: number;
  label: string;
  accent?: string;
};

export function StatBar({ value, max, label, accent = colors.accent }: Props) {
  const safeMax = Math.max(1, max);
  const target = Math.max(0, Math.min(1, value / safeMax));
  const pct = useSharedValue(target);

  useEffect(() => {
    pct.value = withTiming(target, { duration: 420 });
  }, [target, pct]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${pct.value * 100}%`,
  }));

  return (
    <View style={styles.row}>
      <Text style={[typography.micro, styles.label]}>{label}</Text>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, fillStyle]}>
          <LinearGradient
            colors={[accent, "#ffffff20", accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
      <Text style={styles.value}>
        {value}
        <Text style={styles.max}> / {max}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  label: { width: 56, color: colors.textDim },
  track: {
    flex: 1,
    height: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: radii.sm,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
  },
  fill: {
    height: "100%",
    borderRadius: radii.sm,
    overflow: "hidden",
  },
  value: {
    width: 90,
    textAlign: "right",
    color: colors.text,
    fontSize: 13,
    fontVariant: ["tabular-nums"],
    fontFamily: typography.body.fontFamily,
  },
  max: { color: colors.textMuted },
});
