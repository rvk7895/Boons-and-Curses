import type { Action, Phase } from "@bc/shared";
import { getSocket, emitWithAck } from "../net/socket";

export async function sendAction(action: Action): Promise<{ ok: boolean; error?: string }> {
  const socket = getSocket();
  if (!socket) return { ok: false, error: "not connected" };
  return emitWithAck<{ ok: boolean; error?: string }>(socket, "action", { action });
}

export function phaseLabel(phase: Phase): string {
  switch (phase) {
    case "lobby":
      return "Lobby";
    case "godSelect":
      return "Choose your god";
    case "building":
      return "Building phase";
    case "fighting":
      return "Combat";
    case "ended":
      return "Game over";
  }
}
