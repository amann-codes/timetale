"use client";

import type { Flair } from "@/lib/types";
import { getContrastTextColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface FlairPickerProps {
  flairs: Flair[];
  value: string;
  onChange: (flairId: string) => void;
  /** Optional: show selected flair description below. */
  showDescription?: boolean;
}

const NONE_VALUE = "__none__";

export function FlairPicker({
  flairs,
  value,
  onChange,
  showDescription = true,
}: FlairPickerProps) {
  const selectedId = value === NONE_VALUE || !value ? null : value;
  const selectedFlair = flairs.find((f) => f.id === selectedId);

  return (
    <div>
      <div className="flex flex-wrap gap-2 mt-1">
        {flairs.map((f) => {
          const isSelected = selectedId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onChange(isSelected ? NONE_VALUE : f.id)}
              className={cn(
                "rounded-md border px-3 py-1.5 text-base font-medium transition-colors",
                !isSelected && "border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
              style={
                isSelected
                  ? {
                      backgroundColor: f.color,
                      color: getContrastTextColor(f.color),
                      borderColor: f.color,
                    }
                  : undefined
              }
            >
              {f.name}
            </button>
          );
        })}
      </div>
      {showDescription && selectedFlair?.description && (
        <p className="mt-1.5 text-base text-muted-foreground">
          {selectedFlair.description}
        </p>
      )}
    </div>
  );
}
