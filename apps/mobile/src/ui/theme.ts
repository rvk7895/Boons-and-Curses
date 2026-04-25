import type { TextStyle } from "react-native";

// Greek-mythology palette: deep wine night, lit by gold leaf and marble cream.
export const colors = {
  bg: "#0c0717",
  bgDeep: "#070414",
  bgElev: "#1a1230",
  bgElevHi: "#241742",
  surface: "#150b29",
  surfaceHi: "#211238",
  border: "#3d2a64",
  borderHi: "#5a3d8a",
  text: "#f6efe1",
  textDim: "#b9a8d4",
  textMuted: "#7e6b9f",
  accent: "#e3b34a",
  accentHi: "#f5cf68",
  accentDark: "#a87b1f",
  accentText: "#1a0d05",
  marble: "#f5edd6",
  wine: "#7a1238",
  danger: "#e0526b",
  success: "#7cd49b",
  shadow: "rgba(0,0,0,0.55)",
} as const;

export const gradients = {
  page: [colors.bgDeep, colors.bg, "#15092b"] as const,
  hero: [colors.wine, "#3a0a1d", colors.bgDeep] as const,
  accent: [colors.accentHi, colors.accent, colors.accentDark] as const,
  goldOnDark: ["rgba(227,179,74,0.18)", "rgba(227,179,74,0)"] as const,
  cardElev: [colors.surfaceHi, colors.surface] as const,
};

export const godPalette: Record<
  string,
  { primary: string; soft: string; gradient: readonly [string, string, string] }
> = {
  zeus: { primary: "#f3cb5a", soft: "#3d2a08", gradient: ["#f5d361", "#a07116", "#1a1004"] as const },
  hephaestus: { primary: "#e26a3b", soft: "#3a1408", gradient: ["#ee884a", "#7a2a10", "#180706"] as const },
  aphrodite: { primary: "#ec97c8", soft: "#411430", gradient: ["#f4aed3", "#7a2454", "#1a081d"] as const },
  athena: { primary: "#9bd0e8", soft: "#0e2a3b", gradient: ["#aedaee", "#2a597a", "#08182b"] as const },
  hades: { primary: "#9b86e2", soft: "#1f0e3d", gradient: ["#b4a0ee", "#46289c", "#0a0418"] as const },
  poseidon: { primary: "#5fb89c", soft: "#082a25", gradient: ["#7ed1b3", "#1d6e5c", "#021413"] as const },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const radii = {
  sm: 8,
  md: 14,
  lg: 22,
  pill: 999,
};

export const elevation = {
  none: { shadowColor: "transparent", shadowOpacity: 0, elevation: 0 },
  low: {
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  high: {
    shadowColor: "#000",
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  glow: {
    shadowColor: colors.accent,
    shadowOpacity: 0.5,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
    elevation: 10,
  },
};

export const fontFamily = {
  serif: "Cinzel_700Bold",
  serifLight: "Cinzel_400Regular",
  sans: "Inter_500Medium",
  sansBold: "Inter_700Bold",
  sansLight: "Inter_400Regular",
};

export const typography = {
  hero: {
    fontFamily: fontFamily.serif,
    fontSize: 36,
    color: colors.marble,
    letterSpacing: 4,
  } satisfies TextStyle,
  title: {
    fontFamily: fontFamily.serif,
    fontSize: 26,
    color: colors.text,
    letterSpacing: 2,
  } satisfies TextStyle,
  heading: {
    fontFamily: fontFamily.sansBold,
    fontSize: 18,
    color: colors.text,
    letterSpacing: 0.4,
  } satisfies TextStyle,
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    color: colors.text,
    lineHeight: 22,
  } satisfies TextStyle,
  dim: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    color: colors.textDim,
    lineHeight: 18,
  } satisfies TextStyle,
  micro: {
    fontFamily: fontFamily.sansBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.5,
    textTransform: "uppercase" as const,
  } satisfies TextStyle,
  mono: {
    fontFamily: fontFamily.serif,
    fontSize: 28,
    color: colors.accent,
    letterSpacing: 8,
  } satisfies TextStyle,
};
