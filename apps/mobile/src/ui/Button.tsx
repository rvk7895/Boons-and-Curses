import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors, elevation, gradients, radii, spacing, typography } from "./theme";

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  style?: ViewStyle;
};

export function Button({ label, onPress, disabled, loading, variant = "primary", style }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const press = () => {
    Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };
  const release = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 30, bounciness: 6 }).start();
  };

  const onTap = () => {
    if (isDisabled) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onPress();
  };

  if (variant === "primary") {
    return (
      <Animated.View
        style={[
          styles.shell,
          elevation.glow,
          { transform: [{ scale }], opacity: isDisabled ? 0.5 : 1 },
          style,
        ]}
      >
        <Pressable
          onPressIn={press}
          onPressOut={release}
          onPress={onTap}
          disabled={isDisabled}
          accessibilityRole="button"
          accessibilityLabel={label}
        >
          <LinearGradient
            colors={gradients.accent as readonly [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.base}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentText} />
            ) : (
              <Text style={[typography.heading, styles.primaryLabel]}>{label}</Text>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  }

  const bg =
    variant === "danger"
      ? colors.danger
      : variant === "ghost"
        ? "transparent"
        : colors.bgElev;
  const borderColor = variant === "danger" ? colors.danger : colors.border;

  return (
    <Animated.View
      style={[
        styles.shell,
        variant !== "ghost" ? elevation.low : null,
        { transform: [{ scale }], opacity: isDisabled ? 0.5 : 1 },
        style,
      ]}
    >
      <Pressable
        onPressIn={press}
        onPressOut={release}
        onPress={onTap}
        disabled={isDisabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.base, { backgroundColor: bg, borderWidth: 1, borderColor }]}
      >
        {loading ? (
          <ActivityIndicator color={colors.text} />
        ) : (
          <Text style={[typography.heading, styles.secondaryLabel]}>{label}</Text>
        )}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  shell: { borderRadius: radii.md },
  base: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  primaryLabel: { color: colors.accentText, fontSize: 16, letterSpacing: 1 },
  secondaryLabel: { color: colors.text, fontSize: 16, letterSpacing: 1 },
});
