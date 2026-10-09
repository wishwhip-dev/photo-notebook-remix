"use client";

import { useMemo, useState } from "react";
import { Camera, FolderOpen, Upload } from "lucide-react";
import { toast } from "sonner";
import { CameraView } from "@/components/camera-view";
import { FileDrop } from "@/components/file-drop";
import { PhotoCard } from "@/components/photo-card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addPhoto, deletePhoto, listPhotos, saveCaption, setPhotoRating } from "@/lib/data/photos";
import { database } from "@/lib/db";
import { readAsDataUrl, resizeImage } from "@/lib/files";
import { useDatabaseTransfer, useStorageStatus, useStoredQuery } from "@/lib/storage/react";

/**
 * The photo notebook: every saved photo with its caption and star rating, a way to add more
 * (files or the camera), a filter for starred photos, and the export/import that carries the
 * whole notebook between browsers. All data lives in this browser's Dexie database.
 */

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

type Filter = "all" | "starred";

export function Notebook() {
  const { data: photos, isLoading } = useStoredQuery(database, listPhotos);
  const status = useStorageStatus(database);
  const { state: transfer, exportToFile, importFromFile } = useDatabaseTransfer(database);

  const [filter, setFilter] = useState<Filter>("all");
  const [cameraOpen, setCameraOpen] = useState(false);
  const [addingCount, setAddingCount] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const shown = useMemo(() => {
    const all = photos ?? [];
    return filter === "starred" ? all.filter((photo) => photo.rating > 0) : all;
  }, [photos, filter]);

  const starredCount = useMemo(() => (photos ?? []).filter((photo) => photo.rating > 0).length, [photos]);

  async function addFromBlob(name: string, blob: Blob) {
    const dataUrl = await readAsDataUrl(blob);
    await addPhoto({ name, dataUrl });
  }

  async function handleFiles(files: File[]) {
    if (!files.length) return;
    setFileError(null);
    setAddingCount(files.length);
    let added = 0;
    const problems: string[] = [];
    for (const file of files) {
      try {
        const blob = await resizeImage(file, { maxEdge: 1280 });
        await addFromBlob(file.name, blob);
        added += 1;
      } catch (cause) {
        problems.push(`${file.name} — ${cause instanceof Error ? cause.message : "could not be read"}.`);
      }
    }
    setAddingCount(0);
    if (added > 0) toast.success(added === 1 ? "Photo added to the notebook" : `${added} photos added to the notebook`);
    if (problems.length) {
      const message = `Not added: ${problems.join(" ")}`;
      setFileError(message);
      toast.error("Some files could not be added");
    }
  }

  async function handleCameraPhoto(blob: Blob) {
    try {
      await addFromBlob(`Camera photo ${new Date().toLocaleString()}.jpg`, blob);
      toast.success("Photo added to the notebook");
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "The photo could not be saved.";
      setFileError(message);
      toast.error(message);
    }
  }

  /** Runs a write, toasts on failure, and re-throws so the card shows it too. */
  async function guarded(action: () => Promise<void>, what: string) {
    try {
      await action();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : `${what} failed.`;
      toast.error(message);
      throw cause;
    }
  }

  async function handleImport(files: File[]) {
    const file = files[0];
    if (!file) return;
    // The outcome is shown by the error / imported paragraphs below — `transfer.state` in this
    // closure is already stale by the time the promise resolves.
    await importFromFile(file, "replace");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Photo notebook</h1>
        <p className="text-muted-foreground">
          Your photos, their captions and their star ratings — kept in this browser, on this device.
        </p>
      </header>

      {status === "memory" && (
        <Alert>
          <AlertTitle>This browser is not keeping your photos</AlertTitle>
          <AlertDescription>
            Everything works, but it will be gone when the tab closes. Use Export notebook below to keep a copy.
          </AlertDescription>
        </Alert>
      )}

      <section aria-labelledby="add-photo-heading" className="flex flex-col gap-4 rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
        <div className="flex flex-col gap-1">
          <h2 id="add-photo-heading" className="text-lg font-semibold">
            Add photo
          </h2>
          <p className="text-sm text-muted-foreground">Choose image files, drop or paste them, or take a photo with the camera.</p>
        </div>

        <FileDrop
          accept="image/*"
          multiple
          maxBytes={MAX_UPLOAD_BYTES}
          label="Add photo"
          paste
          onFiles={handleFiles}
          className="bg-background"
        />

        {addingCount > 0 && (
          <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
            Adding {addingCount} {addingCount === 1 ? "photo" : "photos"}…
          </p>
        )}
        {fileError && (
          <p role="alert" className="text-sm text-destructive">
            {fileError}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {cameraOpen ? (
            <Button type="button" variant="outline" onClick={() => setCameraOpen(false)}>
              <FolderOpen aria-hidden className="size-4" />
              Close camera
            </Button>
          ) : (
            <Button type="button" onClick={() => setCameraOpen(true)}>
              <Camera aria-hidden className="size-4" />
              Take photo
            </Button>
          )}
        </div>

        {cameraOpen && (
          <CameraView
            facing="environment"
            autoOpen
            photoOptions={{ maxEdge: 1280 }}
            onPhoto={(blob) => void handleCameraPhoto(blob)}
          />
        )}
      </section>

      <section aria-labelledby="photos-heading" className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="photos-heading" className="sr-only">
            Photos
          </h2>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
            <TabsList>
              <TabsTrigger value="all">All photos</TabsTrigger>
              <TabsTrigger value="starred">Starred only</TabsTrigger>
            </TabsList>
          </Tabs>
          {!isLoading && photos && photos.length > 0 && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              Showing {shown.length} of {photos.length} {photos.length === 1 ? "photo" : "photos"} · {starredCount} starred
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {["a", "b", "c"].map((key) => (
              <Skeleton key={key} className="aspect-[4/3] w-full rounded-lg" />
            ))}
          </div>
        ) : !photos || photos.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <Upload aria-hidden className="size-8 text-muted-foreground" />
            <p className="font-medium">Your notebook is empty</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Add your first photo with the Add photo control above, or take one with Take photo. Everything you
              add stays in this browser.
            </p>
          </div>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-10 text-center">
            <p className="font-medium">No starred photos yet</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Use the stars on a photo card to rate it, and it will show up here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                onSaveCaption={(id, caption) => guarded(() => saveCaption(id, caption), "The caption could not be saved")}
                onSetRating={(id, rating) => guarded(() => setPhotoRating(id, rating), "The rating could not be saved")}
                onDelete={(id) => guarded(() => deletePhoto(id), "The photo could not be deleted")}
              />
            ))}
          </div>
        )}
      </section>

      <footer className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground">
        <div>
          <h2 className="text-sm font-semibold">Keep your notebook</h2>
          <p className="text-sm text-muted-foreground">
            Everything lives in this browser only. Export a copy to move it, import a backup file to restore one —
            importing replaces what is here.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" onClick={() => void exportToFile()} disabled={transfer.kind === "working"}>
            Export notebook
          </Button>
        </div>
        <FileDrop
          accept=".json,application/json"
          maxBytes={MAX_UPLOAD_BYTES}
          label="Import notebook file"
          onFiles={(files) => void handleImport(files)}
          className="bg-background"
        >
          or drop a notebook export here — it replaces everything in this notebook
        </FileDrop>
        {transfer.state.kind === "error" && (
          <p role="alert" className="text-sm text-destructive">
            {transfer.state.message}
          </p>
        )}
        {transfer.state.kind === "imported" && (
          <p role="status" className="text-sm text-muted-foreground">
            Imported: {transfer.result.rows} {transfer.result.rows === 1 ? "row" : "rows"} added.
          </p>
        )}
      </footer>
    </main>
  );
}