import type { ImagePickerAsset } from "expo-image-picker";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { storage } from "./firebase";

export const MAX_EVENT_IMAGE_BYTES = 5 * 1024 * 1024;

const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp"]);
const fileExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface UploadedEventImage {
  imageUrl: string;
  imagePath: string;
}

export async function uploadEventImage(
  hostId: string,
  eventId: string,
  asset: ImagePickerAsset,
): Promise<UploadedEventImage> {
  const mimeType = asset.mimeType?.toLowerCase();
  if (!mimeType || !allowedMimeTypes.has(mimeType)) {
    throw new Error("Choose a JPEG, PNG, or WebP image.");
  }

  const blob = await (await fetch(asset.uri)).blob();
  const size = asset.fileSize ?? blob.size;
  if (!Number.isFinite(size) || size <= 0 || size > MAX_EVENT_IMAGE_BYTES) {
    throw new Error("Choose an image that is 5 MB or smaller.");
  }

  const imagePath = `events/${eventId}/${hostId}/cover.${fileExtensions[mimeType]}`;
  const imageRef = ref(storage, imagePath);
  await uploadBytes(imageRef, blob, { contentType: mimeType });

  try {
    return { imageUrl: await getDownloadURL(imageRef), imagePath };
  } catch (error) {
    await deleteObject(imageRef).catch(() => undefined);
    throw error;
  }
}

export async function deleteEventImage(imagePath?: string): Promise<void> {
  if (!imagePath) return;
  await deleteObject(ref(storage, imagePath));
}
