import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { joinRoom } from "../src/net/api";
import { useAuthStore } from "../src/state/authStore";
import { useGameStore } from "../src/state/gameStore";
import { Button } from "../src/ui/Button";
import { Field } from "../src/ui/Field";
import { GoldDivider } from "../src/ui/GoldDivider";
import { Screen } from "../src/ui/Screen";
import { colors, radii, spacing, typography } from "../src/ui/theme";

export default function JoinRoomScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const setRoom = useGameStore((s) => s.setRoom);
  const [name, setName] = useState(user?.displayName ?? "");
  const [code, setCode] = useState("");
  const [spectator, setSpectator] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleJoin() {
    if (!token || !code.trim()) return;
    setError(null);
    setLoading(true);
    try {
      if (name.trim() && name.trim() !== user?.displayName) {
        await setDisplayName(name.trim());
      }
      const room = await joinRoom(token, code.trim().toUpperCase(), spectator ? "spectator" : "player");
      setRoom(room);
      router.replace(`/lobby/${room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to join");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <View style={{ alignItems: "center", marginTop: spacing.md }}>
        <Text style={typography.title}>ENTER THE ARENA</Text>
        <GoldDivider style={{ width: 200 }} />
        <Text style={[typography.dim, { textAlign: "center", maxWidth: 260, marginTop: spacing.sm }]}>
          The hosts will share a code. Six characters.
        </Text>
      </View>
      <View style={{ marginTop: spacing.lg }}>
        <Field
          label="DISPLAY NAME"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          maxLength={40}
        />
        <Field
          label="ROOM CODE"
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
          style={styles.codeInput}
          error={error}
        />
      </View>

      <View style={styles.toggle}>
        <Text style={typography.micro}>ROLE</Text>
        <View style={styles.toggleRow}>
          <Pill
            active={!spectator}
            label="Player"
            onPress={() => setSpectator(false)}
          />
          <Pill
            active={spectator}
            label="Spectator"
            onPress={() => setSpectator(true)}
          />
        </View>
      </View>

      <Button
        label={spectator ? "Witness" : "Enter"}
        onPress={handleJoin}
        loading={loading}
        disabled={!token || code.length < 4}
      />
    </Screen>
  );
}

function Pill({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Text
      onPress={onPress}
      style={[
        styles.pill,
        active ? styles.pillActive : null,
      ]}
    >
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  codeInput: {
    fontFamily: "Cinzel_700Bold",
    fontSize: 22,
    letterSpacing: 8,
    textAlign: "center",
  },
  toggle: { gap: spacing.xs, marginBottom: spacing.md },
  toggleRow: { flexDirection: "row", gap: spacing.sm },
  pill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontFamily: "Inter_500Medium",
    overflow: "hidden",
    textAlign: "center",
  },
  pillActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
    color: colors.accentText,
    fontFamily: "Inter_700Bold",
  },
});
