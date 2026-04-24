import Constants from "expo-constants";
import { Platform } from "react-native";

function resolveApiBaseUrl(): string {
  const extra = (Constants.expoConfig?.extra ?? {}) as { apiBaseUrl?: string };
  if (extra.apiBaseUrl) return extra.apiBaseUrl;
  if (Platform.OS === "android") return "http://10.0.2.2:5000";
  return "http://127.0.0.1:5000";
}

export const API_BASE_URL = resolveApiBaseUrl();
export const SOCKET_URL = API_BASE_URL;
