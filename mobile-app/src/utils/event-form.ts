import type { EventLocation } from "../types";
import { getGeohash } from "./geohash";

export const EVENT_CATEGORIES = [
  "music",
  "food",
  "sports",
  "arts",
  "markets",
  "nightlife",
  "other",
] as const;

export interface EventFormValues {
  title: string;
  description: string;
  category: string;
  address: string;
  latitude: string;
  longitude: string;
  startAt: Date;
  capacity: string;
  ticketPrice: string;
}

export interface ValidEventForm {
  title: string;
  description: string;
  category: string;
  location: EventLocation;
  geohash: string;
  startAt: Date;
  endAt: Date;
  capacity?: number;
  ticketPrice: number;
}

export function validateEventForm(
  values: EventFormValues,
  now = new Date(),
): { value: ValidEventForm } | { error: string } {
  const title = values.title.trim();
  const description = values.description.trim();
  const address = values.address.trim();

  if (!title || !description || !address) {
    return { error: "Add an event title, description, and address." };
  }
  if (title.length > 100 || description.length > 2000 || address.length > 200) {
    return { error: "Keep the title under 100 characters, description under 2,000, and address under 200." };
  }
  if (!(EVENT_CATEGORIES as readonly string[]).includes(values.category)) {
    return { error: "Choose an event category." };
  }

  const latitude = values.latitude.trim();
  const longitude = values.longitude.trim();
  if (!latitude || !longitude) {
    return { error: "Add both latitude and longitude." };
  }
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) {
    return { error: "Enter a valid latitude between -90 and 90." };
  }
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) {
    return { error: "Enter a valid longitude between -180 and 180." };
  }
  if (!Number.isFinite(values.startAt.getTime()) || values.startAt <= now) {
    return { error: "Choose a start date and time in the future." };
  }

  const capacityText = values.capacity.trim();
  let capacity: number | undefined;
  if (capacityText) {
    if (!/^\d+$/.test(capacityText) || !Number.isSafeInteger(Number(capacityText)) || Number(capacityText) < 1) {
      return { error: "Capacity must be a positive whole number." };
    }
    capacity = Number(capacityText);
  }

  const priceText = values.ticketPrice.trim();
  if (priceText && !/^\d+(\.\d{1,2})?$/.test(priceText)) {
    return { error: "Ticket price must be a non-negative ZAR amount with up to two decimal places." };
  }
  const ticketPrice = priceText ? Number(priceText) : 0;
  if (!Number.isFinite(ticketPrice)) {
    return { error: "Enter a valid ticket price." };
  }

  const location = { lat, lng, address };
  return {
    value: {
      title,
      description,
      category: values.category,
      location,
      geohash: getGeohash(lat, lng),
      startAt: values.startAt,
      endAt: new Date(values.startAt.getTime() + 3 * 60 * 60 * 1000),
      capacity,
      ticketPrice,
    },
  };
}
