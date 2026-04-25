import { useEffect } from "react";
import { guestLogin } from "../net/api";
import { connectSocket } from "../net/socket";
import { ensureDeviceId, readStoredAuth, useAuthStore } from "../state/authStore";

export function useBootstrap(): void {
  const setStatus = useAuthStore((s) => s.setStatus);
  const setAuth = useAuthStore((s) => s.setAuth);
  const setDeviceId = useAuthStore((s) => s.setDeviceId);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setStatus("loading");
      try {
        const deviceId = await ensureDeviceId();
        if (!cancelled) await setDeviceId(deviceId);
        const stored = await readStoredAuth();
        const displayName = stored.displayName ?? pickDefaultName();
        const { token, user } = await guestLogin(deviceId, displayName);
        if (cancelled) return;
        await setAuth(token, user);
        connectSocket(token);
      } catch (err) {
        if (cancelled) return;
        setStatus("error", err instanceof Error ? err.message : String(err));
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [setAuth, setDeviceId, setStatus]);
}

function pickDefaultName(): string {
  const n = Math.floor(Math.random() * 9000) + 1000;
  return `Champion${n}`;
}
