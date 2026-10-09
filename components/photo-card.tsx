"use client";

import { useState } from "react";
import { Pencil, Star, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StarRating } from "@/components/star-rating";
import type { Photo } from "@/lib/db";
import { formatBytes } from "@/lib/files";

/**
 * One photo in the notebook: the picture, its caption beneath it, its star rating, an editable
 * caption form and a delete button that asks first. Every write goes through the callbacks, which
 * reject on failure — the card shows what went wrong instead of losing the change.
 */
export function PhotoCard({
  photo,
  onSaveCaption,
  onSetRating,
  onDelete,
}: {
  photo: Photo;
  /** Resolves when the caption is stored; rejects with a message for the screen. */
  onSaveCaption: (id: string, caption: string) => Promise<void>;
  /** Resolves when the rating is stored; rejects with a message for the screen. */
  onSetRating: (id: string, rating: number) => Promise<void>;
  /** Resolves when the photo is gone; rejects with a message for the screen. */
  onDelete: (id: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Something went wrong.";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  const caption = photo.caption.trim();

  return (
    <article className="overflow-hidden rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="relative">
        {/* eslint-disable-next-line @next/next/no-img-element -- a data: URL, which next/image cannot load */}
        <img
          src={photo.dataUrl}
          alt={caption || photo.name}
          className="aspect-[4/3] w-full bg-muted object-cover"
          loading="lazy"
        />
        {photo.rating > 0 && (
          <Badge className="absolute left-2 top-2 gap-1" aria-label={`Rated ${photo.rating} of 5 stars`}>
            <Star aria-hidden className="size-3 fill-current" />
            {photo.rating}/5
          </Badge>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="min-h-5">
          {caption ? (
            <p className="text-sm leading-snug">{caption}</p>
          ) : (
            <p className="text-sm italic text-muted-foreground">No caption</p>
          )}
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {photo.name} · {formatBytesEstimate(photo)}
          </p>
        </div>

        {editing ? (
          <CaptionForm
            photo={photo}
            busy={busy}
            onCancel={() => setEditing(false)}
            onSave={(value) =>
              run(async () => {
                await onSaveCaption(photo.id, value);
                setEditing(false);
              })
            }
          />
        ) : (
          <Button type="button" variant="outline" size="sm" className="justify-start" disabled={busy} onClick={() => setEditing(true)}>
            <Pencil aria-hidden className="size-4" />
            Edit caption
          </Button>
        )}

        <div className="flex flex-wrap items-center justify-between gap-1 border-t pt-2">
          <StarRating
            rating={photo.rating}
            disabled={busy}
            onChange={(rating) => void run(() => onSetRating(photo.id, rating))}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={busy}
            aria-label={`Delete photo ${photo.name}`}
            onClick={() => setConfirming(true)}
            className="h-11 px-2 text-sm text-destructive hover:text-destructive"
          >
            <X aria-hidden className="size-4" />
            Delete photo
          </Button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
      </div>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete this photo?</DialogTitle>
            <DialogDescription>
              {photo.name} and its caption and rating will be removed from the notebook. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() =>
                run(async () => {
                  await onDelete(photo.id);
                  setConfirming(false);
                })
              }
              disabled={busy}
            >
              Delete photo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </article>
  );
}

/** The stored data URL minus its `data:...;base64,` prefix, as a rough size for the card. */
function formatBytesEstimate(photo: Photo): string {
  const base64 = photo.dataUrl.split(",")[1] ?? "";
  return formatBytes(Math.floor((base64.length * 3) / 4));
}

function CaptionForm({
  photo,
  busy,
  onSave,
  onCancel,
}: {
  photo: Photo;
  busy: boolean;
  onSave: (caption: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(photo.caption);
  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault();
        onSave(value.trim());
      }}
    >
      <Label htmlFor={`caption-${photo.id}`}>Caption</Label>
      <Input
        id={`caption-${photo.id}`}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Say something about this photo"
        maxLength={200}
        autoFocus
      />
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={busy}>
          Save caption
        </Button>
        <Button type="button" variant="ghost" size="sm" disabled={busy} onClick={onCancel} className="h-9">
          Cancel
        </Button>
      </div>
    </form>
  );
}