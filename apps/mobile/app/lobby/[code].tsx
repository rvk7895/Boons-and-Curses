import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { getRoom, leaveRoom, type Room } from "../../src/net/api";
import { connectSocket, emitWithAck, getSocket } from "../../src/net/socket";
import { useAuthStore } from "../../src/state/authStore";
import { useGameStore, type VisibleGameState } from "../../src/state/gameStore";
import { Button } from "../../src/ui/Button";
import { Screen } from "../../src/ui/Screen";
import { colors, radii, spacing, typography } from "../../src/ui/theme";

export default function Lobby() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code: string }>();
  const code = (params.code ?? "").toString();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const room = useGameStore((s) => s.room);
  const setRoom = useGameStore((s) => s.setRoom);
  const setYouAre = useGameStore((s) => s.setYouAre);
  const setGameState = useGameStore((s) => s.setState);

  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const isAdmin = useMemo(() => !!room && !!user && room.adminId === user.id, [room, user]);

  const loadRoom = useCallback(async () => {
    if (!token || !code) return;
    try {
      const r = await getRoom(token, code);
      setRoom(r);
    } catch (err) {
      setError(err instanceof Error ? err.message : "failed to load room");
    }
  }, [token, code, setRoom]);

  useEffect(() => {
    if (!token) return;
    void loadRoom();
    const socket = connectSocket(token);
    const onState = (payload: { state: VisibleGameState }) => {
      setGameState(payload.state);
      if (
        payload.state &&
        payload.state.phase !== "lobby" &&
        payload.state.phase !== "ended"
      ) {
        router.replace(`/game/${code}`);
      }
    };
    socket.on("stateUpdate", onState);

    emitWithAck<{
      ok: boolean;
      youAre?: { playerId: string; role: "PLAYER" | "SPECTATOR" };
      state?: VisibleGameState | null;
      error?: string;
    }>(socket, "joinRoom", { code })
      .then((res) => {
        if (!res.ok) {
          setError(res.error ?? "failed to join room socket");
          return;
        }
        if (res.youAre) setYouAre(res.youAre.playerId, res.youAre.role);
        if (res.state) {
          setGameState(res.state);
          if (res.state.phase !== "lobby" && res.state.phase !== "ended") {
            router.replace(`/game/${code}`);
          }
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));

    return () => {
      socket.off("stateUpdate", onState);
    };
  }, [token, code, setGameState, setYouAre, loadRoom, router]);

  async function handleStart() {
    const socket = getSocket();
    if (!socket) return;
    setStarting(true);
    setError(null);
    try {
      const res = await emitWithAck<{ ok: boolean; error?: string }>(socket, "startGame", {});
      if (!res.ok) setError(res.error ?? "failed to start");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setStarting(false);
    }
  }

  async function handleLeave() {
    if (token && code) {
      try {
        await leaveRoom(token, code);
      } catch {
        // ignore
      }
    }
    setRoom(null);
    setYouAre(null, null);
    setGameState(null);
    router.replace("/");
  }

  if (!room) {
    return (
      <Screen>
        <Text style={typography.dim}>Loading room…</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Screen>
    );
  }

  const players = room.members.filter((m) => m.role === "PLAYER");
  const spectators = room.members.filter((m) => m.role === "SPECTATOR");

  return (
    <Screen>
      <View style={styles.codeRow}>
        <Text style={typography.dim}>Invite code</Text>
        <Text style={typography.mono}>{room.code}</Text>
      </View>

      <Text style={typography.heading}>
        Players ({players.length}/{room.maxPlayers})
      </Text>
      <FlatList
        data={players}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <MemberRow
            name={item.displayName}
            isAdmin={item.userId === room.adminId}
            isYou={item.userId === user?.id}
          />
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        style={{ flexGrow: 0 }}
      />

      {spectators.length > 0 ? (
        <>
          <Text style={typography.heading}>Spectators</Text>
          <FlatList
            data={spectators}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => (
              <MemberRow
                name={item.displayName}
                isAdmin={false}
                isYou={item.userId === user?.id}
                dim
              />
            )}
            ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
            style={{ flexGrow: 0 }}
          />
        </>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={{ flex: 1 }} />

      {isAdmin ? (
        <Button
          label="Start game"
          onPress={handleStart}
          loading={starting}
          disabled={players.length < 2 || room.status !== "LOBBY"}
        />
      ) : (
        <Text style={typography.dim}>Waiting for the admin to start…</Text>
      )}
      <Button label="Leave room" variant="secondary" onPress={handleLeave} />
    </Screen>
  );
}

function MemberRow({
  name,
  isAdmin,
  isYou,
  dim,
}: {
  name: string;
  isAdmin: boolean;
  isYou: boolean;
  dim?: boolean;
}) {
  return (
    <View style={[styles.row, dim && { opacity: 0.7 }]}>
      <Text style={[typography.body, { flex: 1 }]}>
        {name}
        {isYou ? "  (you)" : ""}
      </Text>
      {isAdmin ? <Text style={styles.badge}>ADMIN</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bgElev,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  codeRow: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.bgElev,
  },
  badge: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 2,
  },
  error: { color: colors.danger, fontSize: 13 },
});
