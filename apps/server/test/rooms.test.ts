import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDb } from "./helpers/testApp.js";
import { isValidRoomCode } from "../src/rooms/codes.js";

describe("room routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  async function guest(deviceId: string, name: string): Promise<string> {
    const res = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId, displayName: name },
    });
    return res.json().token as string;
  }

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  it("creates a room and returns valid code + admin membership", async () => {
    const token = await guest("device-aaaa1111", "Alice");
    const res = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${token}` },
      payload: { maxPlayers: 4 },
    });
    expect(res.statusCode).toBe(201);
    const room = res.json();
    expect(isValidRoomCode(room.code)).toBe(true);
    expect(room.members).toHaveLength(1);
    expect(room.members[0].role).toBe("PLAYER");
    expect(room.members[0].displayName).toBe("Alice");
  });

  it("a second player can join by code", async () => {
    const aliceToken = await guest("device-aaaa1111", "Alice");
    const bobToken = await guest("device-bbbb2222", "Bob");
    const created = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: {},
    });
    const code = created.json().code as string;

    const joined = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${bobToken}` },
      payload: { role: "player" },
    });
    expect(joined.statusCode).toBe(200);
    expect(joined.json().members).toHaveLength(2);
  });

  it("rejects join when room is full", async () => {
    const adminToken = await guest("d-admin-123456", "Admin");
    const create = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { maxPlayers: 2 },
    });
    const code = create.json().code as string;

    const bobToken = await guest("d-bob-1234567", "Bob");
    const carolToken = await guest("d-carol-123456", "Carol");

    const ok = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${bobToken}` },
      payload: {},
    });
    expect(ok.statusCode).toBe(200);

    const full = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${carolToken}` },
      payload: {},
    });
    expect(full.statusCode).toBe(409);
  });

  it("spectators can still join a full room", async () => {
    const adminToken = await guest("d-admin-aaaaaa", "Admin");
    const create = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${adminToken}` },
      payload: { maxPlayers: 2 },
    });
    const code = create.json().code as string;

    const bobToken = await guest("d-bob-bbbbbb", "Bob");
    await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${bobToken}` },
      payload: {},
    });
    const specToken = await guest("d-spec-cccccc", "Spec");
    const spec = await app.inject({
      method: "POST",
      url: `/rooms/${code}/join`,
      headers: { authorization: `Bearer ${specToken}` },
      payload: { role: "spectator" },
    });
    expect(spec.statusCode).toBe(200);
    expect(spec.json().members.some((m: { role: string }) => m.role === "SPECTATOR")).toBe(true);
  });

  it("GET /rooms/:code returns room for member", async () => {
    const aliceToken = await guest("d-alice-111111", "Alice");
    const created = await app.inject({
      method: "POST",
      url: "/rooms",
      headers: { authorization: `Bearer ${aliceToken}` },
      payload: {},
    });
    const code = created.json().code as string;
    const res = await app.inject({
      method: "GET",
      url: `/rooms/${code}`,
      headers: { authorization: `Bearer ${aliceToken}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().code).toBe(code);
  });

  it("GET /rooms/:code returns 404 for nonexistent", async () => {
    const token = await guest("d-abcabc12", "X");
    const res = await app.inject({
      method: "GET",
      url: "/rooms/ABCDEF",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(404);
  });
});
