import type { Href } from "expo-router";
import type { UserRole } from "../types";

export function getHomeRoute(role: UserRole | undefined): Href | null {
  if (!role) return null;
  if (role === "host") return "/(host)/dashboard";
  if (role === "user") return "/(user)/(tabs)/map";
  return null;
}
