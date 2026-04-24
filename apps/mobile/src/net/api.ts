import { API_BASE_URL } from "../config";

export type ApiError = { error: string; issues?: unknown; status: number };

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "application/json",
  };
  if (init.headers) {
    Object.assign(headers, init.headers as Record<string, string>);
  }
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });
  const text = await res.text();
  const body = text ? (JSON.parse(text) as unknown) : null;
  if (!res.ok) {
    const err = body as Partial<ApiError> | null;
    throw Object.assign(new Error(err?.error ?? `HTTP ${res.status}`), {
      status: res.status,
      issues: err?.issues,
    });
  }
  return body as T;
}

export type GuestLoginResponse = {
  token: string;
  user: { id: string; deviceId: string; displayName: string };
};

export async function guestLogin(deviceId: string, displayName: string): Promise<GuestLoginResponse> {
  return request<GuestLoginResponse>("/auth/guest", {
    method: "POST",
    body: JSON.stringify({ deviceId, displayName }),
  });
}

export type RoomMember = {
  id: string;
  userId: string;
  playerId: string;
  role: "PLAYER" | "SPECTATOR";
  displayName: string;
  joinedAt: string;
};

export type Room = {
  id: string;
  code: string;
  status: "LOBBY" | "PLAYING" | "ENDED";
  adminId: string;
  maxPlayers: number;
  createdAt: string;
  members: RoomMember[];
};

export async function createRoom(token: string, maxPlayers = 4): Promise<Room> {
  return request<Room>("/rooms", {
    method: "POST",
    body: JSON.stringify({ maxPlayers }),
    token,
  });
}

export async function joinRoom(
  token: string,
  code: string,
  role: "player" | "spectator" = "player",
): Promise<Room> {
  return request<Room>(`/rooms/${code}/join`, {
    method: "POST",
    body: JSON.stringify({ role }),
    token,
  });
}

export async function getRoom(token: string, code: string): Promise<Room> {
  return request<Room>(`/rooms/${code}`, { token });
}

export async function leaveRoom(token: string, code: string): Promise<{ ok: true }> {
  return request<{ ok: true }>(`/rooms/${code}/leave`, { method: "POST", token });
}
