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
  capacity?: number;
}
