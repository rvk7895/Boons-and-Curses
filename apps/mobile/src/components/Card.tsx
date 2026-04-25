import { CARDS, type CardId } from "@bc/shared";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, elevation, godPalette, radii, spacing, typography } from "../ui/theme";

type Props = {
  id: CardId;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  compact?: boolean;
  style?: ViewStyle;
  faceDown?: boolean;
};

export function Card({ id, selected, onPress, disabled, compact, style, faceDown }: Props) {
  const def = CARDS[id];
  const pal = godPalette[def.god] ?? godPalette.zeus!;

  const glow = useSharedValue(selected ? 1 : 0);
  useEffect(() => {
    glow.value = withTiming(selected ? 1 : 0, { duration: 220 });
  }, [selected, glow]);
  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (!faceDown) {
      shimmer.value = withRepeat(withTiming(1, { duration: 2400 }), -1, true);
    }
  }, [faceDown, shimmer]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: glow.value,
    transform: [{ scale: 1 + glow.value * 0.04 }],
  }));

  const body = (
    <View style={[styles.shell, compact ? styles.compact : null, elevation.low, style]}>
      <Animated.View style={[styles.ring, { borderColor: pal.primary }, ringStyle]} />
      <LinearGradient
        colors={pal.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1.05 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.veil} />
      <View style={styles.body}>
        {faceDown ? (
          <FaceDownContent />
        ) : (
          <>
            <View style={styles.header}>
              <Text style={[typography.micro, { color: pal.primary, letterSpacing: 3 }]}>
                {def.prefix}
              </Text>
              <Text style={[typography.micro, { color: colors.textDim }]}>
                {def.kind === "attack" ? "ATTACK" : "BUFF"}
              </Text>
            </View>
            <Text style={styles.id}>{def.id}</Text>
            {!compact ? (
              <View style={styles.effects}>
                {def.effects.slice(0, 3).map((e, i) => (
                  <Text key={i} style={styles.effect} numberOfLines={1}>
                    {formatEffect(e)}
                  </Text>
                ))}
              </View>
            ) : null}
            <View style={styles.footer}>
              <Text style={styles.points}>{def.points} pts</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );

  if (!onPress) return body;
  return (
    <Pressable onPress={onPress} disabled={disabled} accessibilityRole="button">
      {body}
    </Pressable>
  );
}

function FaceDownContent() {
  return (
    <View style={styles.faceDown}>
      <Text style={styles.faceDownGlyph}>ψ</Text>
      <Text style={[typography.micro, { color: colors.accent }]}>BOONS · CURSES</Text>
    </View>
  );
}

function formatEffect(e: { kind: string } & Record<string, unknown>): string {
  switch (e.kind) {
    case "damage":
      return `· ${e.power} dmg @ ${e.probability}%`;
    case "aoeDamage":
      return `· AoE ${e.powerDividedByOpponents} dmg`;
    case "selfHeal":
      return `· Heal ${e.amount}`;
    case "lifesteal":
      return `· Lifesteal ${Math.round((e.fraction as number) * 100)}%`;
    case "selfStat":
      return `· Self ${e.stat} ${fmtDelta(e.delta as number)}`;
    case "oppStat":
      return `· Opp ${e.stat} ${fmtDelta(e.delta as number)}`;
    case "applyStatusSelf":
      return `· Self ${e.status} (${e.turns}t)`;
    case "applyStatusOpp":
      return `· Opp ${e.status} (${e.chance}%)`;
    case "clearOppStatuses":
      return "· Clear opp statuses";
    case "clearSelfGod":
      return "· Sever patron";
    case "conditionalStab":
      return "· STAB-conditional";
    default:
      return `· ${String(e.kind)}`;
  }
}

function fmtDelta(n: number): string {
  return n >= 0 ? `+${n}` : String(n);
}

const styles = StyleSheet.create({
  shell: {
    borderRadius: radii.md,
    minWidth: 168,
    minHeight: 196,
    overflow: "hidden",
    backgroundColor: colors.bgDeep,
  },
  compact: { minWidth: 120, minHeight: 156 },
  ring: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: radii.md,
    borderWidth: 2,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(8,4,18,0.55)",
  },
  body: {
    flex: 1,
    padding: spacing.md,
    justifyContent: "space-between",
  },
  header: { flexDirection: "row", justifyContent: "space-between" },
  id: {
    fontFamily: typography.title.fontFamily,
    fontSize: 22,
    color: colors.marble,
    letterSpacing: 3,
  },
  effects: { gap: 2, marginTop: spacing.xs },
  effect: { fontFamily: typography.body.fontFamily, fontSize: 12, color: colors.textDim },
  footer: { alignItems: "flex-end" },
  points: {
    fontFamily: typography.heading.fontFamily,
    fontSize: 12,
    color: colors.accent,
    letterSpacing: 1,
  },
  faceDown: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
  },
  faceDownGlyph: {
    fontSize: 56,
    color: colors.accent,
    opacity: 0.7,
    fontFamily: typography.title.fontFamily,
  },
});
