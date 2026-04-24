import { StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { colors, radii, spacing, typography } from "./theme";

type Props = TextInputProps & {
  label: string;
  error?: string | null;
};

export function Field({ label, error, style, ...rest }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={typography.dim}>{label}</Text>
      <TextInput
        {...rest}
        placeholderTextColor={colors.textDim}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.md, gap: spacing.xs },
  input: {
    backgroundColor: colors.bgElev,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    padding: spacing.md,
    fontSize: 16,
  },
  inputError: { borderColor: colors.danger },
  error: { color: colors.danger, fontSize: 13 },
});
