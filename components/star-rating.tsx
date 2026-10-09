"use client";

import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * A photo's star rating: five stars, each one a button. Clicking the nth star sets the rating to
 * n; clicking the star that is already set (or the "Clear" button beside them) resets it to zero.
 * The filled stars always show the current rating.
 */
export function StarRating({
  rating,
  onChange,
  disabled = false,
  className,
}: {
  rating: number;
  /** Called with the new rating — 0 when the visitor clears it. */
  onChange: (rating: number) => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-0.5", className)}>
      <div role="group" aria-label="Star rating">
        {[1, 2, 3, 4, 5].map((n) => {
          const filled = n <= rating;
          const clears = n === rating;
          return (
            <Button
              key={n}
              type="button"
              variant="ghost"
              size="icon"
              disabled={disabled}
              aria-pressed={filled}
              aria-label={clears ? `Clear the ${n}-star rating` : `Rate ${n} star${n > 1 ? "s" : ""}`}
              title={clears ? "Clear rating" : `Rate ${n} of 5`}
              onClick={() => onChange(clears ? 0 : n)}
              className="size-11 rounded-full hover:bg-accent"
            >
              <Star
                aria-hidden
                className={cn("size-6 transition-colors", filled ? "fill-chart-4 text-chart-4" : "text-muted-foreground")}
              />
            </Button>
          );
        })}
      </div>
      {rating > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(0)}
          className="h-11 shrink-0 px-2 text-sm text-muted-foreground"
        >
          Clear
        </Button>
      )}
    </div>
  );
}