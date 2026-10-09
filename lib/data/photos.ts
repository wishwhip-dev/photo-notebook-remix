/**
 * This app's data access: everything the photo notebook does to its `photos` table. Components
 * call these functions, never Dexie directly — see docs/storage.md.
 */
import { database, newId, type Photo } from "@/lib/db";

const photos = async () => (await database.ready()).photos;

/** Every photo, newest first. */
export async function listPhotos(): Promise<Photo[]> {
  return (await photos()).orderBy("createdAt").reverse().toArray();
}

export type NewPhoto = {
  name: string;
  /** The image already resized and read as a data URL — this layer does not touch files. */
  dataUrl: string;
};

/** Adds a photo with no caption and no rating yet. Returns its id. */
export async function addPhoto(input: NewPhoto): Promise<string> {
  const photo: Photo = {
    id: newId(),
    name: input.name || "Photo",
    dataUrl: input.dataUrl,
    caption: "",
    rating: 0,
    createdAt: Date.now(),
  };
  try {
    await (await photos()).add(photo);
  } catch (error) {
    // Most commonly the browser's storage quota: say so rather than losing the photo silently.
    throw new Error(
      error instanceof Error && /quota|space/i.test(error.message)
        ? "The browser has no room left to keep this photo. Delete some photos and try again."
        : `The photo could not be saved: ${error instanceof Error ? error.message : "unknown error"}`,
    );
  }
  return photo.id;
}

/** Replaces a photo's caption. An empty string is a real state — the card shows "No caption". */
export async function saveCaption(id: string, caption: string): Promise<void> {
  try {
    await (await photos()).update(id, { caption });
  } catch (error) {
    throw new Error(`The caption could not be saved: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

/** Sets a photo's star rating. Clamped to a whole number from 0 (unrated) to 5. */
export async function setPhotoRating(id: string, rating: number): Promise<void> {
  const value = Math.max(0, Math.min(5, Math.round(rating)));
  try {
    await (await photos()).update(id, { rating: value });
  } catch (error) {
    throw new Error(`The rating could not be saved: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}

export async function deletePhoto(id: string): Promise<void> {
  try {
    await (await photos()).delete(id);
  } catch (error) {
    throw new Error(`The photo could not be deleted: ${error instanceof Error ? error.message : "unknown error"}`);
  }
}
