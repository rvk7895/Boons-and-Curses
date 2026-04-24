import { useRouter } from "expo-router";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAuthStore } from "../src/state/authStore";
import { Button } from "../src/ui/Button";
import { Screen } from "../src/ui/Screen";
import { colors, spacing, typography } from "../src/ui/theme";

export default function Home() {
  const router = useRouter();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const error = useAuthStore((s) => s.error);

  if (status !== "ready") {
    return (
      <Screen>
        <View style={styles.center}>
          {status === "error" ? (
            <>
              <Text style={[typography.title, styles.mb]}>Connection error</Text>
              <Text style={typography.dim}>{error ?? "unable to reach server"}</Text>
            </>
          ) : (
            <>
              <ActivityIndicator color={colors.accent} size="large" />
              <Text style={[typography.dim, { marginTop: spacing.md }]}>Summoning champion…</Text>
            </>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={{ gap: spacing.xs }}>
        <Text style={typography.title}>Boons & Curses</Text>
        <Text style={typography.dim}>
          Welcome{user ? `, ${user.displayName}` : ""}. Pick your path.
        </Text>
      </View>
      <View style={{ flex: 1 }} />
      <Button label="Create room" onPress={() => router.push("/create")} />
      <Button
        label="Join room"
        variant="secondary"
        onPress={() => router.push("/join")}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  mb: { marginBottom: spacing.md },
});
