"use client";

import * as React from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/lib/store";
import { haptic } from "@/lib/haptics";
import type { Creative } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/** Thumbnails for an ad set's creatives, with an upload control. */
export function CreativeStrip({ adSetId, adSetName }: { adSetId: string; adSetName: string }) {
  const { data, addCreative, removeCreative } = useStore();
  const [viewing, setViewing] = React.useState<Creative | null>(null);
  const [busy, setBusy] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const creatives = data.creatives.filter((c) => c.adSetId === adSetId);

  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setBusy(true);
    try {
      // Sequential so one rejection doesn't abandon the rest half-done.
      for (const file of files) await addCreative(adSetId, file);
      haptic();
      toast.success(files.length === 1 ? "Creative added" : `${files.length} creatives added`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="flex shrink-0 items-center gap-1">
        {creatives.map((creative) => (
          <button
            key={creative.id}
            type="button"
            onClick={() => setViewing(creative)}
            aria-label={`View ${creative.name}`}
            className="hover:border-ring/60 focus-visible:ring-ring/50 size-8 overflow-hidden rounded-md border transition-colors focus-visible:ring-[3px] focus-visible:outline-none"
          >
            {/* Signed Supabase URLs, so next/image optimisation is not in play. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={creative.url}
              alt={creative.name}
              className="size-full object-cover"
              loading="lazy"
            />
          </button>
        ))}

        <Button
          variant="ghost"
          size="icon-xs"
          disabled={busy}
          aria-label={`Add creative to ${adSetName}`}
          className="text-muted-foreground hover:text-foreground row-action shrink-0 opacity-0 transition-opacity group-hover/adset:opacity-100 focus-visible:opacity-100"
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus />
        </Button>

        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={onFiles}
        />
      </div>

      <Dialog open={!!viewing} onOpenChange={(o) => !o && setViewing(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="truncate">{viewing?.name}</DialogTitle>
            <DialogDescription>{adSetName}</DialogDescription>
          </DialogHeader>

          {viewing && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={viewing.url}
                alt={viewing.name}
                className="max-h-[60vh] w-full rounded-md border object-contain"
              />
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive w-full"
                onClick={async () => {
                  const target = viewing;
                  setViewing(null);
                  try {
                    await removeCreative(target.id, target.path);
                    toast.success("Creative deleted");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Could not delete");
                  }
                }}
              >
                <Trash2 />
                Delete creative
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
