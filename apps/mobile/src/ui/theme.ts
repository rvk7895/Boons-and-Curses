export const colors = {
  bg: "#0f0a1a",
  bgElev: "#1b1330",
  text: "#f5edff",
  textDim: "#b7a4d6",
  accent: "#d4a14a",
  accentText: "#14100a",
  danger: "#e05263",
  border: "#2c1f4b",
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radii = {
  sm: 6,
  md: 10,
  lg: 16,
};

export const typography = {
  title: { fontSize: 28, fontWeight: "700" as const, color: colors.text },
  heading: { fontSize: 20, fontWeight: "600" as const, color: colors.text },
  body: { fontSize: 16, color: colors.text },
  dim: { fontSize: 14, color: colors.textDim },
  mono: {
    fontSize: 18,
    color: colors.accent,
    letterSpacing: 4,
    fontVariant: ["tabular-nums" as const],
  },
};
