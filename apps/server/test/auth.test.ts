import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { buildTestApp, resetDb } from "./helpers/testApp.js";

describe("auth routes", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await resetDb(app);
  });

  it("POST /auth/guest creates a user and returns a token", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "device-abcdef", displayName: "Alice" },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.displayName).toBe("Alice");
  });

  it("POST /auth/guest with same deviceId returns same user with updated name", async () => {
    const first = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "device-abcdef", displayName: "Alice" },
    });
    const second = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "device-abcdef", displayName: "Alicia" },
    });
    expect(first.json().user.id).toBe(second.json().user.id);
    expect(second.json().user.displayName).toBe("Alicia");
  });

  it("rejects invalid body", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/auth/guest",
      payload: { deviceId: "short", displayName: "X" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("GET /auth/me without token returns 401", async () => {
    const res = await app.inject({ method: "GET", url: "/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("GET /auth/me with token returns the user", async () => {
    const { token, user } = (
      await app.inject({
        method: "POST",
        url: "/auth/guest",
        payload: { deviceId: "device-xyzxyz", displayName: "Bob" },
      })
    ).json();
    const res = await app.inject({
      method: "GET",
      url: "/auth/me",
      headers: { authorization: `Bearer ${token}` },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.id).toBe(user.id);
  });
});
