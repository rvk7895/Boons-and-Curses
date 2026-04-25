import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildTestApp } from "./helpers/testApp.js";

describe("hardening", () => {
  let app: Awaited<ReturnType<typeof buildTestApp>>;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it("returns helmet security headers", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
    expect(res.headers["x-frame-options"]).toBeDefined();
  });

  it("/health reports ok + room count", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(typeof body.rooms).toBe("number");
  });
});
