import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, gradients, spacing } from "./theme";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  variant?: "page" | "hero";
  bare?: boolean;
};

export function Screen({ children, scroll = false, variant = "page", bare = false }: Props) {
  const palette = variant === "hero" ? gradients.hero : gradients.page;
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={palette as readonly [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />
      <View pointerEvents="none" style={styles.vignette} />
      <SafeAreaView style={styles.fill} edges={["top", "bottom"]}>
        <KeyboardAvoidingView
          style={styles.fill}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {scroll ? (
            <ScrollView
              contentContainerStyle={bare ? styles.bare : styles.content}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          ) : (
            <View style={bare ? styles.bare : styles.content}>{children}</View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgDeep },
  fill: { flex: 1 },
  vignette: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    flexGrow: 1,
  },
  bare: { flexGrow: 1 },
});
