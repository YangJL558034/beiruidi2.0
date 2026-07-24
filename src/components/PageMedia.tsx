"use client";

import Image from "next/image";
import type { PageMedia as PageMediaData } from "@/lib/content-types";
import { isManagedMediaUrl } from "@/lib/media";

export function PageMedia({ media, className = "" }: { media?: PageMediaData; className?: string }) {
  if (!media?.src) return null;
  if (media.type === "video") {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        <video
          src={media.src}
          poster={media.poster}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          controlsList="nodownload noplaybackrate nofullscreen"
          aria-label={media.alt || "Page video"}
          className="h-full w-full object-cover"
          style={{ objectPosition: media.position || "50% 50%" }}
          onContextMenu={(event) => event.preventDefault()}
        />
      </div>
    );
  }
  if (isManagedMediaUrl(media.src)) {
    return (
      <div className={`relative overflow-hidden ${className}`}>
        <Image unoptimized src={media.src} alt={media.alt || "Page image"} fill sizes="100vw" className="object-cover" style={{ objectPosition: media.position || "50% 50%" }} />
      </div>
    );
  }
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image src={media.src} alt={media.alt || "Page image"} fill sizes="100vw" className="object-cover" style={{ objectPosition: media.position || "50% 50%" }} />
    </div>
  );
}
