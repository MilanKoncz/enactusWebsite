"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { cn } from "@/lib/cn";

export type YouTubeFacadeProps = {
  youtubeId: string;
  title: string;
  playLabel: string;
  className?: string;
};

// Click-to-load facade (CLAUDE.md: "Eight autoloading embeds would cost
// megabytes and set cookies before consent"). Nothing from YouTube loads
// until the button is pressed — the poster is YouTube's own static
// thumbnail (i.ytimg.com), a plain image request, not a script. Only once
// clicked does the real player mount, and even then on youtube-nocookie.com,
// which doesn't set tracking cookies until playback actually starts.
export function YouTubeFacade({ youtubeId, title, playLabel, className }: YouTubeFacadeProps) {
  const [loaded, setLoaded] = useState(false);

  if (loaded) {
    return (
      <div className={cn("relative aspect-video overflow-hidden rounded-md bg-ink", className)}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      aria-label={playLabel}
      className={cn(
        "group relative flex aspect-video items-center justify-center overflow-hidden rounded-md bg-ink transition-transform duration-[var(--duration-fast)] ease-signature hover:scale-[1.02] focus-visible:scale-[1.02]",
        className,
      )}
    >
      <Image
        src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`}
        alt=""
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover opacity-80 transition-opacity duration-[var(--duration-fast)] ease-signature group-hover:opacity-100 group-focus-visible:opacity-100"
      />
      <span
        aria-hidden="true"
        className="relative flex size-12 items-center justify-center rounded-full bg-gold text-ink transition-transform duration-[var(--duration-fast)] ease-signature group-hover:scale-[1.06] group-focus-visible:scale-[1.06]"
      >
        <Play aria-hidden="true" className="size-5 translate-x-0.5" fill="currentColor" />
      </span>
    </button>
  );
}
