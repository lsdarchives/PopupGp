import type { Href } from "expo-router";
import type { UserRole } from "../types";

export function getHomeRoute(role: UserRole | undefined): Href | null {
  if (!role) return null;
  if (role === "host") return "/(host)/my-events";
  if (role === "user") return "/(user)/browse";
  return null;
}
