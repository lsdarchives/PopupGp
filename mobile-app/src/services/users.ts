import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { UserProfile, UserRole } from "../types";

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, "users", uid));
  if (!snap.exists()) return null;

  const data = snap.data();
  return {
    email: data.email,
    displayName: data.displayName,
    role: data.role as UserRole,
    createdAt: data.createdAt?.toDate?.() ?? new Date(),
  };
}

export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string,
  role: "user" | "host"
): Promise<void> {
  await setDoc(doc(db, "users", uid), {
    email,
    displayName,
    role,
    createdAt: serverTimestamp(),
  });
}

export async function updateProfileName(uid: string, displayName: string): Promise<void> {
  await updateDoc(doc(db, "users", uid), { displayName });
}
