import {
    collection,
    addDoc,
    getDocs,
    getDoc,
    doc,
    query,
    where,
    orderBy,
    serverTimestamp,
    updateDoc,
    deleteDoc,
    limit,
  } from "firebase/firestore";
  import { db } from "./firebase";
  import type { Event, EventWithId, EventLocation } from "../types";
  
  function mapDocToEvent(id: string, data: any): EventWithId {
    return {
      id,
      title: data.title,
      description: data.description,
      category: data.category,
      hostId: data.hostId,
      status: data.status,
      location: data.location,
      geohash: data.geohash,
      startAt: data.startAt?.toDate?.() ?? new Date(),
      endAt: data.endAt?.toDate?.() ?? new Date(),
      rsvpCount: data.rsvpCount ?? 0,
      imageUrl: data.imageUrl,
      capacity: data.capacity,
      ticketPrice: data.ticketPrice,
    };
  }
  
  export async function createEvent(
    hostId: string,
    title: string,
    description: string,
    category: string,
    location: EventLocation,
    geohash: string,
    startAt: Date,
    endAt: Date,
    capacity?: number,
    ticketPrice?: number
  ): Promise<string> {
    const docRef = await addDoc(collection(db, "events"), {
      title,
      description,
      category,
      hostId,
      status: "pending",
      location,
      geohash,
      startAt,
      endAt,
      rsvpCount: 0,
      capacity: capacity ?? null,
      ticketPrice: ticketPrice ?? 0,
      createdAt: serverTimestamp(),
    });
  
    return docRef.id;
  }
  
  export async function getHostEvents(hostId: string): Promise<EventWithId[]> {
    const q = query(
      collection(db, "events"),
      where("hostId", "==", hostId),
      orderBy("startAt", "desc")
    );
  
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToEvent(d.id, d.data()));
  }
  
  export async function getApprovedEvents(): Promise<EventWithId[]> {
    const q = query(
      collection(db, "events"),
      where("status", "==", "approved"),
      orderBy("startAt", "desc")
    );
  
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapDocToEvent(d.id, d.data()));
  }
  
  export interface UserRsvpState {
    id: string;
    ticketPurchased: boolean;
    status: "going" | "cancelled";
  }

  export async function getEvent(eventId: string): Promise<EventWithId | null> {
    const snap = await getDoc(doc(db, "events", eventId));
    if (!snap.exists()) return null;
    return mapDocToEvent(snap.id, snap.data());
  }

  export async function getUserRsvpForEvent(eventId: string, userId: string): Promise<UserRsvpState | null> {
    const q = query(
      collection(db, "rsvps"),
      where("eventId", "==", eventId),
      where("userId", "==", userId),
      limit(1)
    );

    const snap = await getDocs(q);
    if (snap.empty) return null;

    const docData = snap.docs[0].data();
    return {
      id: snap.docs[0].id,
      ticketPurchased: Boolean(docData.ticketPurchased),
      status: docData.status ?? "going",
    };
  }

  export async function toggleRsvp(eventId: string, userId: string): Promise<{ isGoing: boolean }> {
    const existing = await getUserRsvpForEvent(eventId, userId);
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventSnap.data();
    const currentCount = Number(eventData.rsvpCount ?? 0);

    if (existing) {
      await deleteDoc(doc(db, "rsvps", existing.id));
      await updateDoc(eventRef, {
        rsvpCount: Math.max(0, currentCount - 1),
      });
      return { isGoing: false };
    }

    if (typeof eventData.capacity === "number" && currentCount >= eventData.capacity) {
      throw new Error("This event is full.");
    }

    await addDoc(collection(db, "rsvps"), {
      eventId,
      userId,
      status: "going",
      ticketPurchased: false,
      createdAt: serverTimestamp(),
    });

    await updateDoc(eventRef, {
      rsvpCount: currentCount + 1,
    });

    return { isGoing: true };
  }

  export async function purchaseTicket(eventId: string, userId: string): Promise<{ hasTicket: boolean }> {
    const existing = await getUserRsvpForEvent(eventId, userId);
    const eventRef = doc(db, "events", eventId);
    const eventSnap = await getDoc(eventRef);

    if (!eventSnap.exists()) {
      throw new Error("Event not found");
    }

    const eventData = eventSnap.data();
    const currentCount = Number(eventData.rsvpCount ?? 0);

    if (!existing) {
      if (typeof eventData.capacity === "number" && currentCount >= eventData.capacity) {
        throw new Error("This event is full.");
      }

      await addDoc(collection(db, "rsvps"), {
        eventId,
        userId,
        status: "going",
        ticketPurchased: true,
        createdAt: serverTimestamp(),
      });

      await updateDoc(eventRef, {
        rsvpCount: currentCount + 1,
      });

      return { hasTicket: true };
    }

    const rsvpRef = doc(db, "rsvps", existing.id);
    await updateDoc(rsvpRef, {
      ticketPurchased: !existing.ticketPurchased,
    });

    return { hasTicket: !existing.ticketPurchased };
  }

  export interface EventUpdateInput {
    title: string;
    description: string;
    category: string;
    location: EventLocation;
    geohash: string;
    startAt: Date;
    endAt: Date;
    capacity?: number;
    ticketPrice?: number;
  }

  export async function updateEvent(eventId: string, data: EventUpdateInput): Promise<void> {
    await updateDoc(doc(db, "events", eventId), {
      title: data.title,
      description: data.description,
      category: data.category,
      location: data.location,
      geohash: data.geohash,
      startAt: data.startAt,
      endAt: data.endAt,
      capacity: data.capacity ?? null,
      ticketPrice: data.ticketPrice ?? 0,
      status: "pending",
    });
  }

  export async function cancelEvent(eventId: string): Promise<void> {
    await updateDoc(doc(db, "events", eventId), { status: "cancelled" });
  }

  export async function deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, "events", eventId));
  }