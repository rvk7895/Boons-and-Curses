import { io, type Socket } from "socket.io-client";
import { SOCKET_URL } from "../config";

export type GameSocket = Socket;

let activeSocket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (activeSocket && activeSocket.connected) return activeSocket;
  if (activeSocket) activeSocket.close();
  activeSocket = io(SOCKET_URL, {
    transports: ["websocket"],
    auth: { token },
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
  });
  return activeSocket;
}

export function getSocket(): Socket | null {
  return activeSocket;
}

export function disconnectSocket(): void {
  if (activeSocket) {
    activeSocket.removeAllListeners();
    activeSocket.close();
    activeSocket = null;
  }
}

export function emitWithAck<T = unknown>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 8000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out: ${event}`)), timeoutMs);
    socket.emit(event, payload, (res: T) => {
      clearTimeout(timer);
      resolve(res);
    });
  });
}
