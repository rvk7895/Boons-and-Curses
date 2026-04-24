import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { createRoom } from "../src/net/api";
import { useAuthStore } from "../src/state/authStore";
import { useGameStore } from "../src/state/gameStore";
import { Button } from "../src/ui/Button";
import { Field } from "../src/ui/Field";
import { Screen } from "../src/ui/Screen";
import { spacing, typography } from "../src/ui/theme";

export default function CreateRoomScreen() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setDisplayName = useAuthStore((s) => s.setDisplayName);
  const setRoom = useGameStore((s) => s.setRoom);
  const [name, setName] = useState(user?.displayName ?? "");
  const [maxPlayers, setMaxPlayers] = useState("4");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsedMax = Math.min(4, Math.max(2, parseInt(maxPlayers, 10) || 4));

  async function handleCreate() {
    if (!token) return;
    setError(null);
    setLoading(true);
    try {
      if (name.trim() && name.trim() !== user?.displayName) {
        await setDisplayName(name.trim());
      }
      const room = await createRoom(token, parsedMax);
      setRoom(room);
      router.replace(`/lobby/${room.code}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to create");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll>
      <Text style={typography.heading}>Create a new room</Text>
      <Text style={typography.dim}>Invite up to 3 opponents with the room code.</Text>
      <View style={styles.form}>
        <Field
          label="Display name"
          value={name}
          onChangeText={setName}
          autoCapitalize="none"
          maxLength={40}
        />
        <Field
          label="Max players (2–4)"
          value={maxPlayers}
          onChangeText={(v) => setMaxPlayers(v.replace(/[^0-9]/g, ""))}
          keyboardType="number-pad"
          maxLength={1}
          error={error}
        />
      </View>
      <Button label="Create room" onPress={handleCreate} loading={loading} disabled={!token} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: { marginTop: spacing.md },
});
