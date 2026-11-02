import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { EventWithId } from "../types";
import { mapEventDocument } from "./events";

export async function getSavedEventIds(uid: string): Promise<string[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "savedEvents"));
  return snapshot.docs.map((savedEvent) => savedEvent.id);
}

export async function saveEvent(uid: string, eventId: string): Promise<void> {
  await setDoc(doc(db, "users", uid, "savedEvents", eventId), {
    eventId,
    createdAt: serverTimestamp(),
  });
}

export async function removeSavedEvent(uid: string, eventId: string): Promise<void> {
  await deleteDoc(doc(db, "users", uid, "savedEvents", eventId));
}

export async function getUpcomingSavedEvents(uid: string): Promise<EventWithId[]> {
  const snapshot = await getDocs(collection(db, "users", uid, "savedEvents"));
  const now = Date.now();
  const results = await Promise.all(
    snapshot.docs.map(async (savedEvent) => {
      const eventId = savedEvent.id;
      try {
        const eventSnapshot = await getDoc(doc(db, "events", eventId));
        if (!eventSnapshot.exists()) {
          await removeSavedEvent(uid, eventId);
          return null;
        }

        const event = mapEventDocument(eventSnapshot.id, eventSnapshot.data());
        if (event.status !== "approved" || event.startAt.getTime() <= now) {
          await removeSavedEvent(uid, eventId);
          return null;
        }
        return event;
      } catch (error) {
        const code = (error as { code?: string })?.code;
        if (code === "permission-denied" || code === "not-found") {
          await removeSavedEvent(uid, eventId);
          return null;
        }
        throw error;
      }
    })
  );

  return results
    .filter((event): event is EventWithId => event !== null)
    .sort((left, right) => left.startAt.getTime() - right.startAt.getTime());
}
