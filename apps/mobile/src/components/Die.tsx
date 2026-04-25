import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, Text, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { colors, elevation, gradients, radii } from "../ui/theme";

type Props = {
  value: number;
  style?: ViewStyle;
  animateOnChange?: boolean;
};

export function Die({ value, style, animateOnChange = true }: Props) {
  const rot = useSharedValue(0);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (!animateOnChange) return;
    rot.value = 0;
    scale.value = 1;
    rot.value = withSequence(
      withTiming(720, { duration: 600, easing: Easing.out(Easing.cubic) }),
    );
    scale.value = withSequence(
      withTiming(1.2, { duration: 200 }),
      withTiming(1, { duration: 240, easing: Easing.bounce }),
    );
  }, [value, rot, scale, animateOnChange]);

  const anim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rot.value}deg` }, { scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, elevation.glow, anim, style]}>
      <LinearGradient
        colors={gradients.accent as readonly [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Text style={styles.num}>{value}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 64,
    height: 64,
    borderRadius: radii.md,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.accentDark,
  },
  num: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.accentText,
    fontFamily: "Cinzel_700Bold",
  },
});
