import type { Action } from "@bc/shared";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDb } from "./helpers/testApp.js";
import { connectClient, emitAck, waitFor } from "./helpers/socketClient.js";

describe("socket game flow", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
    await app.ready();
    await app.listen({ port: 0, host: "127.0.0.1" });
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  async function setupRoom(): Promise<{
    code: string;
    aliceToken: string;
    bobToken: string;
    alicePlayerId: string;
    bobPlayerId: string;
  }> {
    const aliceResp = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "dev-alice-xxxx1", displayName: "Alice" },
    });
    const aliceToken = aliceResp.json().token as string;

    const bobResp = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "dev-bob-xxxx2", displayName: "Bob" },
    });
    const bobToken = bobResp.json().token as string;

    const create = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: { maxPlayers: 2 },
    });
    const code = create.json().code as string;

    const bobJoin = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${bobToken}` },
      payload: {},
    });
    const members = bobJoin.json().members as Array<{
      userId: string;
      playerId: string;
    }>;

    const alicePlayerId = members.find((m) => m.userId === aliceResp.json().user.id)!.playerId;
    const bobPlayerId = members.find((m) => m.userId === bobResp.json().user.id)!.playerId;
    return { code, aliceToken, bobToken, alicePlayerId, bobPlayerId };
  }

  it("rejects connections without a token", async () => {
    await expect(connectClient(app.server.address(), "")).rejects.toThrow();
  });

  it("joinRoom returns the room and youAre payload", async () => {
    const { code, aliceToken, alicePlayerId } = await setupRoom();
    const client = await connectClient(app.server.address(), aliceToken);
    const res: {
      ok: boolean;
      youAre: { playerId: string; role: string };
    } = await emitAck(client, "joinRoom", { code });
    expect(res.ok).toBe(true);
    expect(res.youAre.playerId).toBe(alicePlayerId);
    expect(res.youAre.role).toBe("PLAYER");
    client.close();
  });

  it("startGame transitions room to PLAYING and broadcasts state", async () => {
    const { code, aliceToken, bobToken } = await setupRoom();
    const alice = await connectClient(app.server.address(), aliceToken);
    const bob = await connectClient(app.server.address(), bobToken);
    await emitAck(alice, "joinRoom", { code });
    await emitAck(bob, "joinRoom", { code });

    const stateOnBob = waitFor(bob, "stateUpdate");
    const started = await emitAck<{ ok: boolean; error?: string }>(alice, "startGame", {});
    expect(started.ok).toBe(true);
    const received = (await stateOnBob) as { state: { phase: string } };
    expect(received.state.phase).toBe("godSelect");
    alice.close();
    bob.close();
  });

  it("applies godSelect actions and reaches building phase", async () => {
    const { code, aliceToken, bobToken, alicePlayerId, bobPlayerId } = await setupRoom();
    const alice = await connectClient(app.server.address(), aliceToken);
    const bob = await connectClient(app.server.address(), bobToken);
    await emitAck(alice, "joinRoom", { code });
    await emitAck(bob, "joinRoom", { code });
    await emitAck(alice, "startGame", {});

    const aliceAction: Action = { kind: "selectGod", playerId: alicePlayerId, god: "zeus" };
    const bobAction: Action = { kind: "selectGod", playerId: bobPlayerId, god: "hades" };

    const r1 = await emitAck<{ ok: boolean }>(alice, "action", { action: aliceAction });
    expect(r1.ok).toBe(true);
    const aliceSawBuilding = waitFor(alice, "stateUpdate");
    const r2 = await emitAck<{ ok: boolean }>(bob, "action", { action: bobAction });
    expect(r2.ok).toBe(true);
    const update = (await aliceSawBuilding) as { state: { phase: string } };
    expect(["godSelect", "building"]).toContain(update.state.phase);
    alice.close();
    bob.close();
  });

  it("hides opponent hand in filtered state", async () => {
    const { code, aliceToken, bobToken, alicePlayerId, bobPlayerId } = await setupRoom();
    const alice = await connectClient(app.server.address(), aliceToken);
    const bob = await connectClient(app.server.address(), bobToken);
    await emitAck(alice, "joinRoom", { code });
    await emitAck(bob, "joinRoom", { code });
    await emitAck(alice, "startGame", {});
    await emitAck(alice, "action", {
      action: { kind: "selectGod", playerId: alicePlayerId, god: "zeus" },
    });
    const nextState = waitFor(alice, "stateUpdate");
    await emitAck(bob, "action", {
      action: { kind: "selectGod", playerId: bobPlayerId, god: "hades" },
    });
    const update = (await nextState) as {
      state: { players: Array<{ id: string; hand: string[] | null; pendingDraw: unknown }> };
    };
    const aliceView = update.state.players.find((p) => p.id === alicePlayerId)!;
    const bobView = update.state.players.find((p) => p.id === bobPlayerId)!;
    expect(aliceView.hand).not.toBeNull();
    expect(bobView.hand).toBeNull();
    alice.close();
    bob.close();
  });

  it("rejects action with mismatched playerId", async () => {
    const { code, aliceToken, bobPlayerId } = await setupRoom();
    const alice = await connectClient(app.server.address(), aliceToken);
    await emitAck(alice, "joinRoom", { code });
    await emitAck(alice, "startGame", {});
    const spoofed: Action = { kind: "selectGod", playerId: bobPlayerId, god: "zeus" };
    const res = await emitAck<{ ok: boolean; error?: string }>(alice, "action", {
      action: spoofed,
    });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/playerId mismatch/i);
    alice.close();
  });
});
