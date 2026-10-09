/**
 * This application's database.
 *
 * The reusable half of the setup is in `lib/storage/` and is not edited. This file is the half
 * that describes the product: which tables exist, what is indexed, and what a first visit starts
 * with. A photo notebook has one table: one row per photo.
 */
import { defineDatabase } from "@/lib/storage/database";

export type Photo = {
  id: string;
  /** The file name it arrived with — the chooser's, or a made-up one for a camera shot. */
  name: string;
  /**
   * The image as a `data:` URL, resized on arrival. A data URL rather than a Blob so the JSON
   * export can carry the photos too (a Blob would export as `{}`) — see docs/files.md.
   */
  dataUrl: string;
  /** What the visitor wrote about the photo. Empty means no caption yet. */
  caption: string;
  /** 0–5 stars. 0 means unrated. */
  rating: number;
  /** Epoch millis. Indexed, because the grid is ordered by it, newest first. */
  createdAt: number;
};

/** Ids are generated here so the data layer never depends on an auto-increment round trip. */
export function newId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export const database = defineDatabase<{ photos: Photo }>({
  // Part of the origin's storage identity. Renaming it does not migrate anything — it points the
  // application at a different, empty database and abandons the old one in place.
  name: "photo-notebook",
  versions: [
    // Only the primary key and the properties queried on. The grid is ordered by `createdAt`;
    // the starred filter reads `rating` from each row rather than the index, so it is not indexed.
    { version: 1, stores: { photos: "id, createdAt" } },
  ],
  // No seed: a photo notebook starts empty, because there is no honest example photo to invent —
  // the page explains itself and points at "Add photo" and "Take photo" instead.
});
