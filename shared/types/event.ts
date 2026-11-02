export type EventStatus = "pending" | "approved" | "rejected" | "cancelled";

export interface EventLocation {
  lat: number;
  lng: number;
  address: string;
  suburb?: string;
}

export interface Event {
  title: string;
  description: string;
  category: string;
  hostId: string;
  status: EventStatus;
  location: EventLocation;
  geohash: string;
  startAt: Date;
  endAt: Date;
  rsvpCount: number;
  imageUrl?: string;
  imagePath?: string;
  capacity?: number;
  ticketPrice?: number;
}

export interface EventWithId extends Event {
  id: string;
}

export type RsvpStatus = "going" | "cancelled";
export type PaymentStatus = "free" | "pending" | "paid" | "failed";

export interface Rsvp {
  eventId: string;
  userId: string;
  status: RsvpStatus;
  ticketPurchased: boolean;
  paymentStatus?: PaymentStatus;
  paymentIntentId?: string;
  createdAt: Date;
  updatedAt?: Date;
}
