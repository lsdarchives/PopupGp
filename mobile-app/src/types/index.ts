export type UserRole = "user" | "host" | "admin";

export interface UserProfile {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export type EventStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface EventLocation {
  lat: number;
  lng: number;
  address: string;
  suburb?: string;
}
