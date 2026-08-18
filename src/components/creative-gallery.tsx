"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface GalleryItem {
  key: string;
  url: string;
  name: string;
  productName: string;
  platformName: string;
  /** "Campaign · Ad set" */
  detail: string;
  cloudSlug?: string;
}

/**
 * Dense grid of creatives. Built for a few hundred: fixed square tiles so
 * nothing reflows as images arrive, native lazy loading, and details held in
 * an overlay rather than a caption so the images stay the content.
 */
export function CreativeGallery({
  items,
  renderMark,
}: {
  items: GalleryItem[];
  renderMark: (platformName: string) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState<GalleryItem | null>(null);

  return (
    <>
      <ul
        className="mt-3 grid gap-2"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(7rem, 1fr))" }}
      >
        {items.map((item) => (
          <li key={item.key}>
            <button
              type="button"
              onClick={() => setOpen(item)}
              aria-label={`${item.productName} — ${item.detail}`}
              className="group focus-visible:ring-ring/50 relative block w-full overflow-hidden rounded-lg focus-visible:ring-[3px] focus-visible:outline-none"
            >
              {/* Signed Supabase URLs, so next/image optimisation is not in play. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="bg-muted aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              />

              {/* Details ride on hover so the grid stays all image at rest. */}
              <span className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/80 via-black/25 to-transparent p-2 text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex items-center gap-1.5">
                  <span className="[&_*]:!text-white">{renderMark(item.platformName)}</span>
                  <span className="truncate text-[11px] font-medium text-white">
                    {item.productName}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-white/80">
                  {item.detail}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="truncate">{open?.productName}</DialogTitle>
            <DialogDescription>{open?.detail}</DialogDescription>
          </DialogHeader>

          {open && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={open.url}
                alt={open.name}
                className="max-h-[65vh] w-full rounded-md border object-contain"
              />
              {open.cloudSlug && (
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/cloud/${open.cloudSlug}`}>Open in cloud</Link>
                </Button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
