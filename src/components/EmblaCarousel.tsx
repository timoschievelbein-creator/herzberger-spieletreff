// src/components/EmblaCarousel.tsx
"use client";

import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";

export type EmblaSlide = {
  id: string | number;
  src: string;
  alt?: string;
};

export default function EmblaCarousel({
  slides,
  className = "",
  heightClass = "h-64 md:h-80", // optional: Bildhöhe steuerbar
}: {
  slides: EmblaSlide[];
  className?: string;
  heightClass?: string;
}) {
  const [emblaRef, embla] = useEmblaCarousel({ loop: false, align: "start" });
  const [selected, setSelected] = useState(0);

  const scrollPrev = useCallback(() => embla?.scrollPrev(), [embla]);
  const scrollNext = useCallback(() => embla?.scrollNext(), [embla]);

  useEffect(() => {
    if (!embla) return;
    const onSelect = () => setSelected(embla.selectedScrollSnap());
    embla.on("select", onSelect);
    onSelect();
    return () => {
      embla.off("select", onSelect);
    };
  }, [embla]);

  if (!slides?.length) return null;

  return (
    <div className={`embla ${className}`}>
      <div className="embla__viewport" ref={emblaRef}>
        <div className="embla__container">
          {slides.map((s) => (
            <div className="embla__slide" key={s.id}>
              <img
                src={s.src}
                alt={s.alt ?? ""}
                className={`w-full ${heightClass} object-cover rounded-lg border dark:border-slate-700`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex gap-2">
          <button type="button" onClick={scrollPrev} className="btn px-3">
            ‹
          </button>
          <button type="button" onClick={scrollNext} className="btn px-3">
            ›
          </button>
        </div>

        <div className="flex gap-1">
          {slides.map((_, i) => (
            <span
              key={i}
              aria-hidden
              className={`h-2 w-2 rounded-full ${
                i === selected
                  ? "bg-slate-900 dark:bg-slate-100"
                  : "bg-slate-300 dark:bg-slate-600"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Minimales CSS für Embla */}
      <style jsx>{`
        .embla__container {
          display: flex;
          gap: 0.75rem;
        }
        .embla__slide {
          flex: 0 0 100%;
        }
      `}</style>
    </div>
  );
}
