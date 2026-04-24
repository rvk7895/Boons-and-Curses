import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { joinRoom } from "../src/net/api";
import { useAuthStore } from "../src/state/authStore";
import { useGameStore } from "../src/state/gameStore";
import { Button } from "../src/ui/Button";
import { Field } from "../src/ui/Field";
import { Screen } from "../src/ui/Screen";
import { spacing, typography } from "../src/ui/theme";

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
      <Text style={typography.heading}>Join an existing room</Text>
      <Text style={typography.dim}>Enter the 6-character code from the host.</Text>
      <View style={styles.form}>
        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          maxLength={40}
        />
        <Field
          label="Room code"
          value={code}
          onChangeText={(v) => setCode(v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase())}
          autoCapitalize="characters"
          maxLength={8}
          error={error}
        />
      </View>
      <Button
        label={spectator ? "Joining as spectator" : "Joining as player"}
        variant="secondary"
        onPress={() => setSpectator((s) => !s)}
      />
      <Button label="Join" onPress={handleJoin} loading={loading} disabled={!token || code.length < 4} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: spacing.md },
});
