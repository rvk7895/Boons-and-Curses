import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const TOKEN_KEY = "bc.token";
const DEVICE_KEY = "bc.deviceId";
const DISPLAY_NAME_KEY = "bc.displayName";

const storage = {
  async get(key: string): Promise<string | null> {
    if (Platform.OS === "web") return AsyncStorage.getItem(key);
    return SecureStore.getItemAsync(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async remove(key: string): Promise<void> {
    if (Platform.OS === "web") {
      await AsyncStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export type AuthUser = {
  id: string;
  deviceId: string;
  displayName: string;
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  deviceId: string | null;
  status: "unknown" | "loading" | "ready" | "error";
  error: string | null;
  setAuth: (token: string, user: AuthUser) => Promise<void>;
  setDeviceId: (deviceId: string) => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  logout: () => Promise<void>;
  setStatus: (s: AuthState["status"], error?: string | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  deviceId: null,
  status: "unknown",
  error: null,
  setAuth: async (token, user) => {
    await storage.set(TOKEN_KEY, token);
    await storage.set(DISPLAY_NAME_KEY, user.displayName);
    set({ token, user, status: "ready", error: null });
  },
  setDeviceId: async (deviceId) => {
    await storage.set(DEVICE_KEY, deviceId);
    set({ deviceId });
  },
  setDisplayName: async (name) => {
    await storage.set(DISPLAY_NAME_KEY, name);
    set((s) => ({
      user: s.user ? { ...s.user, displayName: name } : s.user,
    }));
  },
  logout: async () => {
    await storage.remove(TOKEN_KEY);
    set({ token: null, user: null, status: "ready" });
  },
  setStatus: (status, error = null) => set({ status, error }),
}));

export async function readStoredAuth(): Promise<{
  token: string | null;
  deviceId: string | null;
  displayName: string | null;
}> {
  const [token, deviceId, displayName] = await Promise.all([
    storage.get(TOKEN_KEY),
    storage.get(DEVICE_KEY),
    storage.get(DISPLAY_NAME_KEY),
  ]);
  return { token, deviceId, displayName };
}

export async function ensureDeviceId(): Promise<string> {
  const existing = await storage.get(DEVICE_KEY);
  if (existing) return existing;
  const bytes = Crypto.getRandomBytes(16);
  const hex = Array.from(bytes)
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
  await storage.set(DEVICE_KEY, hex);
  return hex;
}
