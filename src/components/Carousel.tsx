"use client";

import { useRef } from "react";

type Img = { id: string | number; src: string; alt?: string };

export default function Carousel({ images }: { images: Img[] }) {
  const scroller = useRef<HTMLDivElement>(null);

  const scrollBy = (dx: number) => {
    scroller.current?.scrollBy({ left: dx, behavior: "smooth" });
  };

  if (!images?.length) return null;

  return (
    <div className="relative">
      <div
        ref={scroller}
        className="flex gap-3 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-1"
      >
        {images.map((img) => (
          <div key={img.id} className="min-w-[280px] sm:min-w-[360px] md:min-w-[420px] snap-start">
            <div className="aspect-[16/10] overflow-hidden rounded-lg border dark:border-slate-700">
              <img src={img.src} alt={img.alt ?? ""} className="w-full h-full object-cover" />
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => scrollBy(-400)}
        className="btn absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80"
        aria-label="Vorheriges Bild"
      >
        ‹
      </button>
      <button
        type="button"
        onClick={() => scrollBy(400)}
        className="btn absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 dark:bg-slate-800/80"
        aria-label="Nächstes Bild"
      >
        ›
      </button>
    </div>
  );
}
