import * as Location from "expo-location";
import { Platform } from "react-native";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type NominatimResult = {
  lat: string;
  lon: string;
};

const webGeocodeCache = new Map<string, Coordinates>();
let nextWebGeocodeAt = 0;

function isNominatimResult(value: unknown): value is NominatimResult {
  return (
    typeof value === "object" &&
    value !== null &&
    "lat" in value &&
    typeof value.lat === "string" &&
    "lon" in value &&
    typeof value.lon === "string"
  );
}

async function geocodeOnWeb(address: string): Promise<Coordinates> {
  const cacheKey = address.trim().toLocaleLowerCase();
  const cached = webGeocodeCache.get(cacheKey);
  if (cached) return cached;

  const delay = Math.max(0, nextWebGeocodeAt - Date.now());
  if (delay > 0) {
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  nextWebGeocodeAt = Date.now() + 1_000;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const params = new URLSearchParams({
      format: "jsonv2",
      limit: "1",
      q: address,
    });
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?${params.toString()}`,
      { headers: { Accept: "application/json" }, signal: controller.signal },
    );
    if (!response.ok) {
      throw new Error("Could not reach the address lookup service. Check your connection and try again.");
    }

    const results: unknown = await response.json();
    if (!Array.isArray(results) || results.length === 0) {
      throw new Error("No match found. Add the suburb and city, then try again.");
    }

    const result = results[0];
    if (!isNominatimResult(result)) {
      throw new Error("The address lookup returned an invalid location. Try a more complete address.");
    }
    const latitude = Number(result.lat);
    const longitude = Number(result.lon);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      throw new Error("The address lookup returned an invalid location. Try a more complete address.");
    }

    const coordinates = { latitude, longitude };
    webGeocodeCache.set(cacheKey, coordinates);
    return coordinates;
  } finally {
    clearTimeout(timeout);
  }
}

export async function geocodeAddress(address: string): Promise<Coordinates> {
  const normalizedAddress = address.trim();
  if (!normalizedAddress) {
    throw new Error("Enter a venue name or address first.");
  }

  if (Platform.OS === "web") {
    return geocodeOnWeb(normalizedAddress);
  }

  const results = await Location.geocodeAsync(normalizedAddress);
  const result = results[0];
  if (!result) {
    throw new Error("No match found. Add the suburb and city, then try again.");
  }

  return { latitude: result.latitude, longitude: result.longitude };
}
