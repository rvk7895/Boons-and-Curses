import { useState } from "react";
import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "./theme";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function Field({ label, error, style, onFocus, onBlur, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={[typography.micro, styles.label]}>{label}</Text>
      <TextInput
        {...rest}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          focused ? styles.inputFocus : null,
          error ? styles.inputError : null,
          style,
        ]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: spacing.xs },
  label: { color: colors.accent },
  input: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
    fontFamily: typography.body.fontFamily,
  },
  inputFocus: {
    borderColor: colors.accent,
    backgroundColor: "rgba(227,179,74,0.06)",
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13, fontFamily: typography.dim.fontFamily },
});
