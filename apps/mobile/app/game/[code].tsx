import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { connectSocket, emitWithAck, getSocket } from "../../src/net/socket";
import { useAuthStore } from "../../src/state/authStore";
import { useGameStore, type VisibleGameState } from "../../src/state/gameStore";
import { BuildingView } from "../../src/views/BuildingView";
import { FightingView } from "../../src/views/FightingView";
import { GodSelectView } from "../../src/views/GodSelectView";
import { ResultView } from "../../src/views/ResultView";
import { Screen } from "../../src/ui/Screen";
import { colors, spacing, typography } from "../../src/ui/theme";

export default function GamePage() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? "").toString();
  const token = useAuthStore((s) => s.token);
  const state = useGameStore((s) => s.state);
  const setYouAre = useGameStore((s) => s.setYouAre);
  const setState = useGameStore((s) => s.setState);

  useEffect(() => {
    if (!token) return;
    const socket = connectSocket(token);
    const onUpdate = (payload: { state: VisibleGameState }) => {
      setState(payload.state);
    };
    socket.on("stateUpdate", onUpdate);

    void emitWithAck<{
      ok: boolean;
      youAre?: { playerId: string; role: "PLAYER" | "SPECTATOR" };
      state?: VisibleGameState | null;
    }>(socket, "joinRoom", { code }).then((res) => {
      if (res.ok) {
        if (res.youAre) setYouAre(res.youAre.playerId, res.youAre.role);
        if (res.state) setState(res.state);
      }
    });

    return () => {
      socket.off("stateUpdate", onUpdate);
    };
  }, [token, code, setState, setYouAre]);

  if (!state) {
    return (
      <Screen>
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={[typography.dim, { marginTop: spacing.md }]}>Connecting to game…</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      {state.phase === "godSelect" ? <GodSelectView /> : null}
      {state.phase === "building" ? <BuildingView /> : null}
      {state.phase === "fighting" ? <FightingView /> : null}
      {state.phase === "ended" ? <ResultView /> : null}
      {state.phase === "lobby" ? (
        <Text style={typography.dim}>Returning to lobby…</Text>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
