"use client";

import Image from "next/image";
import { useCallback, useState } from "react";
import { motion, type PanInfo } from "framer-motion";
import { Icon } from "@/components/ui/Icon";
import { swipeDirection } from "@/lib/swipe";

export type CarouselImage = { id: string; url: string; alt: string };

/**
 * The trip-detail hero. Shows every photo on the trip, not just the cover.
 *
 * The drag gesture reuses the same commit thresholds as the /browse deck via
 * `swipeDirection`, so both surfaces feel identical. Deliberately clamped at
 * both ends rather than looping — wrapping around mid-gallery disorients people
 * more than a dead end does.
 */
export function ImageCarousel({ images }: { images: CarouselImage[] }) {
  const [index, setIndex] = useState(0);

  const count = images.length;
  const clamp = useCallback((next: number) => Math.min(Math.max(next, 0), count - 1), [count]);
  const go = useCallback((next: number) => setIndex((i) => clamp(next === i ? i : next)), [clamp]);

  function onDragEnd(_: unknown, info: PanInfo) {
    const direction = swipeDirection(info.offset.x, info.velocity.x);
    if (direction === 0) return; // under threshold — springs back
    // Dragging left (negative) advances; dragging right goes back.
    go(clamp(index - direction));
  }

  if (count === 0) {
    return (
      <div className="flex h-64 items-center justify-center rounded-lg bg-surface-container-high md:h-96">
        <Icon name="add_a_photo" size={32} className="text-outline" />
      </div>
    );
  }

  const atStart = index === 0;
  const atEnd = index === count - 1;

  return (
    <div className="space-y-stack-sm">
      <div
        role="group"
        aria-roledescription="carousel"
        aria-label="Trip photos"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "ArrowLeft") {
            e.preventDefault();
            go(clamp(index - 1));
          }
          if (e.key === "ArrowRight") {
            e.preventDefault();
            go(clamp(index + 1));
          }
        }}
        className="relative h-64 overflow-hidden rounded-lg bg-surface-container-high shadow-sm focus:ring-2 focus:ring-primary focus:outline-none md:h-96"
      >
        <motion.div
          className="flex h-full cursor-grab active:cursor-grabbing"
          drag={count > 1 ? "x" : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={onDragEnd}
          animate={{ x: `-${index * 100}%` }}
          transition={{ type: "spring", stiffness: 320, damping: 34 }}
        >
          {images.map((image, i) => (
            <div
              key={image.id}
              className="relative h-full w-full shrink-0"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority={i === 0}
                sizes="(max-width: 768px) 100vw, 1200px"
                className="object-cover"
                draggable={false}
              />
            </div>
          ))}
        </motion.div>

        {count > 1 && (
          <>
            {/* Non-gesture alternative — a swipe-only gallery is unusable with
                a mouse and inaccessible by keyboard. */}
            <button
              type="button"
              onClick={() => go(clamp(index - 1))}
              disabled={atStart}
              aria-label="Previous photo"
              className="absolute top-1/2 left-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary shadow-card backdrop-blur-sm transition-opacity hover:bg-surface-container-lowest disabled:pointer-events-none disabled:opacity-0"
            >
              <Icon name="chevron_left" size={22} />
            </button>
            <button
              type="button"
              onClick={() => go(clamp(index + 1))}
              disabled={atEnd}
              aria-label="Next photo"
              className="absolute top-1/2 right-3 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-surface-container-lowest/80 text-primary shadow-card backdrop-blur-sm transition-opacity hover:bg-surface-container-lowest disabled:pointer-events-none disabled:opacity-0"
            >
              <Icon name="chevron_right" size={22} />
            </button>

            {/* Precise counter for people who prefer numbers to dots. */}
            <span className="absolute top-3 right-3 rounded-full bg-inverse-surface/70 px-2.5 py-1 text-label-sm text-inverse-on-surface backdrop-blur-sm">
              {index + 1} / {count}
            </span>

            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((image, i) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-label={`Go to photo ${i + 1}`}
                  aria-current={i === index ? "true" : undefined}
                  className={`h-2 rounded-full transition-all ${
                    i === index
                      ? "w-5 bg-secondary-container"
                      : "w-2 bg-surface-container-lowest/70 hover:bg-surface-container-lowest"
                  }`}
                />
              ))}
            </div>
          </>
        )}

        <span aria-live="polite" className="sr-only">
          Photo {index + 1} of {count}
        </span>
      </div>

      {/* Desktop shortcut: jump straight to a photo instead of swiping to it. */}
      {count > 1 && (
        <div className="hidden gap-stack-sm md:flex">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Show photo ${i + 1}`}
              className={`relative h-16 w-24 overflow-hidden rounded-md transition-all ${
                i === index
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                  : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
