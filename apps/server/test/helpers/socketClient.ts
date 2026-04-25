import { type AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";

export type ConnectedClient = ClientSocket;

export function connectClient(address: AddressInfo | string | null, token: string): Promise<ConnectedClient> {
  if (!address || typeof address === "string") throw new Error("server not listening");
  const url = `http://${address.address === "::" || address.address === "::1" ? "127.0.0.1" : address.address}:${address.port}`;
  return new Promise((resolve, reject) => {
    const socket = ioc(url, {
      transports: ["websocket"],
      auth: { token },
      forceNew: true,
      reconnection: false,
    });
    socket.once("connect", () => resolve(socket));
    socket.once("connect_error", (err) => reject(err));
  });
}

export function emitAck<T = unknown>(
  socket: ConnectedClient,
  event: string,
  payload: unknown,
): Promise<T> {
  return new Promise((resolve) => {
    socket.emit(event, payload, (res: T) => resolve(res));
  });
}

export function waitFor<T = unknown>(
  socket: ConnectedClient,
  event: string,
  timeoutMs = 5000,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}
