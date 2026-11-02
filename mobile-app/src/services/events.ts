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
    deleteField,
    deleteDoc,
    limit,
  } from "firebase/firestore";
  import { httpsCallable } from "firebase/functions";
  import { db, functions } from "./firebase";
  import type { EventWithId, EventLocation } from "../types";
  
  export function mapEventDocument(id: string, data: any): EventWithId {
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
      imagePath: data.imagePath,
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
    return snap.docs.map((d) => mapEventDocument(d.id, d.data()));
  }
  
  export async function getApprovedEvents(): Promise<EventWithId[]> {
    const q = query(
      collection(db, "events"),
      where("status", "==", "approved"),
      orderBy("startAt", "desc")
    );
  
    const snap = await getDocs(q);
    return snap.docs.map((d) => mapEventDocument(d.id, d.data()));
  }
  
  export interface UserRsvpState {
    id: string;
    ticketPurchased: boolean;
    paymentStatus?: "free" | "paid" | "pending" | "failed";
    paymentIntentId?: string;
    status: "going" | "cancelled";
  }

  export async function getEvent(eventId: string): Promise<EventWithId | null> {
    const snap = await getDoc(doc(db, "events", eventId));
    if (!snap.exists()) return null;
    return mapEventDocument(snap.id, snap.data());
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
      paymentStatus: docData.paymentStatus,
      paymentIntentId: docData.paymentIntentId,
      status: docData.status ?? "going",
    };
  }

  export async function toggleRsvp(eventId: string): Promise<{ isGoing: boolean }> {
    const toggleFreeRsvp = httpsCallable<{ eventId: string }, { isGoing: boolean }>(
      functions,
      "toggleFreeRsvp"
    );
    const result = await toggleFreeRsvp({ eventId });
    return { isGoing: result.data.isGoing };
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
  imageUrl?: string;
  imagePath?: string;
  clearImage?: boolean;
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
      ...(data.clearImage ? { imageUrl: deleteField(), imagePath: deleteField() } : {}),
      ...(data.imageUrl && data.imagePath
        ? { imageUrl: data.imageUrl, imagePath: data.imagePath }
        : {}),
    });
  }

  export async function updateEventImage(
    eventId: string,
    image?: { imageUrl: string; imagePath: string },
  ): Promise<void> {
    await updateDoc(doc(db, "events", eventId), image
      ? { imageUrl: image.imageUrl, imagePath: image.imagePath }
      : { imageUrl: deleteField(), imagePath: deleteField() });
  }

  export async function cancelEvent(eventId: string): Promise<void> {
    await updateDoc(doc(db, "events", eventId), { status: "cancelled" });
  }

  export async function deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(db, "events", eventId));
  }
