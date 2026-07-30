import { geohashForLocation } from "geofire-common";

export function getGeohash(lat: number, lng: number): string {
  return geohashForLocation([lat, lng]);
}