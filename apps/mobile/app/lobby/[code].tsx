import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getRoom, leaveRoom } from "../../src/net/api";
import { connectSocket, emitWithAck, getSocket } from "../../src/net/socket";
import { useAuthStore } from "../../src/state/authStore";
import { useGameStore, type VisibleGameState } from "../../src/state/gameStore";
import { Button } from "../../src/ui/Button";
import { GoldDivider } from "../../src/ui/GoldDivider";
import { Screen } from "../../src/ui/Screen";
import { colors, elevation, radii, spacing, typography } from "../../src/ui/theme";

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
    const onRoomUpdate = (payload: { room: typeof room }) => {
      if (payload.room) setRoom(payload.room);
    };
    socket.on("stateUpdate", onState);
    socket.on("roomUpdate", onRoomUpdate);

    emitWithAck<{
      ok: boolean;
      youAre?: { playerId: string; role: "PLAYER" | "SPECTATOR" };
      state?: VisibleGameState | null;
      room?: typeof room;
      error?: string;
    }>(socket, "joinRoom", { code })
      .then((res) => {
        if (!res.ok) {
          setError(res.error ?? "failed to join room socket");
          return;
        }
        if (res.youAre) setYouAre(res.youAre.playerId, res.youAre.role);
        if (res.room) setRoom(res.room);
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
      socket.off("roomUpdate", onRoomUpdate);
    };
  }, [token, code, setGameState, setYouAre, setRoom, loadRoom, router]);

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
        <Text style={typography.dim}>Awaiting the oracle…</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </Screen>
    );
  }

  const players = room.members.filter((m) => m.role === "PLAYER");
  const spectators = room.members.filter((m) => m.role === "SPECTATOR");

  return (
    <Screen>
      <Animated.View entering={FadeIn.duration(400)} style={styles.codeCard}>
        <Text style={typography.micro}>INVITE CODE</Text>
        <Text style={typography.mono}>{room.code}</Text>
        <Text style={[typography.dim, { textAlign: "center" }]}>
          Share this with your fellow champions.
        </Text>
      </Animated.View>

      <View style={styles.header}>
        <Text style={typography.heading}>
          PLAYERS ({players.length}/{room.maxPlayers})
        </Text>
        <GoldDivider />
      </View>

      <FlatList
        data={players}
        keyExtractor={(m) => m.id}
        renderItem={({ item, index }) => (
          <Animated.View entering={FadeIn.delay(index * 80).duration(300)}>
            <MemberRow
              name={item.displayName}
              isAdmin={item.userId === room.adminId}
              isYou={item.userId === user?.id}
            />
          </Animated.View>
        )}
        ItemSeparatorComponent={() => <View style={{ height: spacing.xs }} />}
        style={{ flexGrow: 0 }}
      />

      {spectators.length > 0 ? (
        <>
          <Text style={[typography.heading, { marginTop: spacing.md }]}>SPECTATORS</Text>
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
          label="Begin the Contest"
          onPress={handleStart}
          loading={starting}
          disabled={players.length < 2 || room.status !== "LOBBY"}
        />
      ) : (
        <Text style={[typography.dim, { textAlign: "center" }]}>
          Awaiting the host to begin…
        </Text>
      )}
      <Button label="Forsake" variant="ghost" onPress={handleLeave} />
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
    <View style={[styles.row, dim && { opacity: 0.65 }, elevation.low]}>
      <Text style={[typography.body, { flex: 1 }]}>
        {name}
        {isYou ? "  · you" : ""}
      </Text>
      {isAdmin ? <Text style={styles.badge}>HOST</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  codeCard: {
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { gap: spacing.xs, marginTop: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  badge: {
    color: colors.accent,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  error: { color: colors.danger, fontSize: 13, textAlign: "center" },
});
