export type UserRole = "user" | "host" | "admin";

export interface UserProfile {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: Date;
}

export interface UserProfileDocument {
  email: string;
  displayName: string;
  role: UserRole;
  createdAt: { seconds: number; nanoseconds: number };
}
