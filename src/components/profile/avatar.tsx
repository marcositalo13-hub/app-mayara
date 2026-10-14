"use client";

import { useState } from "react";
import { HEART_PATH, HEART_VIEWBOX } from "@/components/cute/heart-shape";
import { cn } from "@/lib/utils";

const SIZES = {
  sm: { box: "size-8", px: 32, letter: "text-base", heart: "size-6" },
  md: { box: "size-12", px: 48, letter: "text-xl", heart: "size-9" },
  lg: { box: "size-24", px: 96, letter: "text-4xl", heart: "size-[4.5rem]" },
} as const;

export type AvatarSize = keyof typeof SIZES;

/** First letter (grapheme-aware, so emoji or accents aren't split), upper-cased. */
export function initialOf(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const first =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? [...new Intl.Segmenter("pt-BR", { granularity: "grapheme" }).segment(trimmed)][0]?.segment
      : Array.from(trimmed)[0];
  return (first ?? "?").toLocaleUpperCase("pt-BR");
}

type AvatarProps = {
  displayName: string;
  /** Signed URL of the photo; null/undefined shows the fallback. */
  src?: string | null;
  size?: AvatarSize;
  className?: string;
};

export function Avatar({ displayName, src, size = "md", className }: AvatarProps) {
  const s = SIZES[size];
  // A photo that fails to load (expired signed URL, offline) falls back to the initial.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = !!src && src !== failedSrc;

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-alt ring-1 ring-border",
        s.box,
        className,
      )}
    >
      {showPhoto ? (
        // Signed, short-lived URL of a private bucket: next/image's optimizer can't use it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          width={s.px}
          height={s.px}
          className="size-full object-cover"
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <>
          <svg viewBox={HEART_VIEWBOX} aria-hidden className={cn("fill-primary-soft", s.heart)}>
            <path d={HEART_PATH} />
          </svg>
          <span aria-hidden className={cn("absolute font-extrabold leading-none text-primary", s.letter)}>
            {initialOf(displayName)}
          </span>
        </>
      )}
    </span>
  );
}
