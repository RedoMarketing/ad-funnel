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

/** Growth is capped below the hex spacing ratio so tiles never touch. */
const MAX_GROWTH = 0.45;
const SPACING_RATIO = 1.55;
const REACH = 170;
/** Outer rings shrink toward this fraction, the Apple Watch falloff. */
const EDGE_SCALE = 0.62;

/** Six axial steps around a hex ring. */
const HEX_DIRS: [number, number][] = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

/**
 * Axial coordinates spiralling out from the centre — one hex, then rings of
 * 6, 12, 18… Packing on a hex lattice is what keeps the cluster round and
 * evenly spaced without any collision test.
 */
function hexSpiral(count: number) {
  const cells: { q: number; r: number; ring: number }[] = [{ q: 0, r: 0, ring: 0 }];
  for (let ring = 1; cells.length < count; ring++) {
    let q = -ring;
    let r = ring;
    for (const [dq, dr] of HEX_DIRS) {
      for (let step = 0; step < ring && cells.length < count; step++) {
        cells.push({ q, r, ring });
        q += dq;
        r += dr;
      }
    }
  }
  return cells;
}

/** Rings needed for n items: a hex cluster holds 1 + 3k(k+1). */
function ringsFor(n: number) {
  let k = 0;
  while (1 + 3 * k * (k + 1) < n) k++;
  return k;
}

/** Deterministic per-tile drift — Math.random would break hydration. */
function noise(i: number, salt: number) {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

interface Placed extends GalleryItem {
  x: number;
  y: number;
  size: number;
  style: React.CSSProperties;
}

/**
 * A drifting wall of creatives that swells toward the cursor.
 *
 * Rows are offset and jittered so it reads as a scatter rather than a table,
 * while the spacing guarantees tiles never collide even at full growth.
 * Sized for hundreds: lazy images, and magnification runs off cached centres
 * on an animation frame rather than measuring during the pointer event.
 */
export function CreativeGallery({
  items,
  renderMark,
}: {
  items: GalleryItem[];
  renderMark: (platformName: string) => React.ReactNode;
}) {
  const [open, setOpen] = React.useState<GalleryItem | null>(null);
  const [width, setWidth] = React.useState(0);

  const wrapRef = React.useRef<HTMLDivElement>(null);
  const tilesRef = React.useRef<HTMLElement[]>([]);
  const centresRef = React.useRef<{ x: number; y: number }[]>([]);
  const pointerRef = React.useRef<{ x: number; y: number } | null>(null);
  const frameRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    setWidth(el.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, []);

  const { placed, height } = React.useMemo(() => {
    if (width <= 0 || items.length === 0) return { placed: [] as Placed[], height: 0 };

    const rings = ringsFor(items.length);
    // Cluster spans 2 x rings x spacing plus one tile. Solve so it always fits
    // the band, then clamp the tile to something still recognisable.
    const spacingFromWidth = width / (2 * rings + 1 / SPACING_RATIO);
    const tile = Math.max(26, Math.min(72, spacingFromWidth / SPACING_RATIO));
    const spacing = tile * SPACING_RATIO;

    const cells = hexSpiral(items.length);
    const clusterHeight = rings * spacing * Math.sqrt(3) + tile;

    const placed = items.map((item, i) => {
      const { q, r, ring } = cells[i];
      // Pointy-top axial to pixel.
      const cx = spacing * (q + r / 2);
      const cy = spacing * (Math.sqrt(3) / 2) * r;
      // Shrink toward the rim so the middle reads first.
      const size = tile * (rings === 0 ? 1 : 1 - (1 - EDGE_SCALE) * (ring / rings));

      return {
        ...item,
        size,
        x: width / 2 + cx - size / 2,
        y: clusterHeight / 2 + cy - size / 2,
        style: {
          "--float-duration": `${(4.5 + noise(i, 3) * 3.5).toFixed(2)}s`,
          "--float-delay": `${(noise(i, 4) * -6).toFixed(2)}s`,
          "--float-distance": `${(2 + noise(i, 5) * 3).toFixed(1)}px`,
        } as React.CSSProperties,
      };
    });

    return { placed, height: clusterHeight };
  }, [items, width]);

  const measure = React.useCallback(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    tilesRef.current = Array.from(wrap.querySelectorAll<HTMLElement>("[data-tile]"));
    centresRef.current = tilesRef.current.map((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    });
  }, []);

  React.useEffect(() => {
    // Pointer devices only: there is no cursor to approach on touch, and
    // reduced-motion users asked for things to hold still.
    const canHover = window.matchMedia("(hover: hover)").matches;
    const wantsStillness = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!canHover || wantsStillness) return;

    measure();
    const onLayout = () => measure();
    window.addEventListener("resize", onLayout);
    window.addEventListener("scroll", onLayout, { passive: true });

    const paint = () => {
      frameRef.current = null;
      const p = pointerRef.current;
      tilesRef.current.forEach((el, i) => {
        const centre = centresRef.current[i];
        if (!p || !centre) {
          el.style.transform = "";
          el.style.zIndex = "";
          return;
        }
        const distance = Math.hypot(centre.x - p.x, centre.y - p.y);
        if (distance > REACH) {
          el.style.transform = "";
          el.style.zIndex = "";
          return;
        }
        // Squared falloff concentrates the pull on the tile under the cursor.
        const nearness = 1 - distance / REACH;
        el.style.transform = `scale(${(1 + MAX_GROWTH * nearness * nearness).toFixed(3)})`;
        el.style.zIndex = String(10 + Math.round(nearness * 20));
      });
    };

    const schedule = () => {
      if (frameRef.current === null) frameRef.current = requestAnimationFrame(paint);
    };

    const wrap = wrapRef.current;
    const onMove = (e: PointerEvent) => {
      pointerRef.current = { x: e.clientX, y: e.clientY };
      schedule();
    };
    const onLeave = () => {
      pointerRef.current = null;
      schedule();
    };

    wrap?.addEventListener("pointermove", onMove);
    wrap?.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("resize", onLayout);
      window.removeEventListener("scroll", onLayout);
      wrap?.removeEventListener("pointermove", onMove);
      wrap?.removeEventListener("pointerleave", onLeave);
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        // Must clear it too: a stale id makes schedule() think a frame is
        // already pending, and nothing is ever drawn again.
        frameRef.current = null;
      }
    };
  }, [measure, placed]);

  return (
    <>
      <div ref={wrapRef} className="relative mt-3" style={{ height }}>
        {placed.map((item) => (
          <div
            key={item.key}
            className="float-tile absolute"
            style={{ ...item.style, left: item.x, top: item.y, width: item.size, height: item.size }}
          >
            <button
              type="button"
              data-tile
              onClick={() => setOpen(item)}
              aria-label={`${item.productName} — ${item.detail}`}
              className="group focus-visible:ring-ring/50 relative block size-full origin-center overflow-hidden rounded-md shadow-sm transition-[transform,box-shadow] duration-200 ease-out hover:shadow-lg focus-visible:ring-[3px] focus-visible:outline-none"
            >
              {/* Signed Supabase URLs, so next/image optimisation is not in play. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.url}
                alt={item.name}
                loading="lazy"
                decoding="async"
                className="bg-muted size-full object-cover"
              />

              {/* Held back until the tile has grown enough to read. */}
              <span className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/30 to-transparent p-1 text-left opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex items-center gap-1">
                  <span className="[&_*]:!text-white">{renderMark(item.platformName)}</span>
                  <span className="truncate text-[8px] leading-tight font-medium text-white">
                    {item.productName}
                  </span>
                </span>
                <span className="mt-0.5 line-clamp-2 text-[7px] leading-tight text-white/80">
                  {item.detail}
                </span>
              </span>
            </button>
          </div>
        ))}
      </div>

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
