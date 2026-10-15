"use client";

import { useEffect, useState } from "react";
import { cn } from "cn";

export function toPublicMediaUrl(url: string | null | undefined) {
  const raw = url?.trim();
  if (!raw) return null;
  if (raw.includes("/storage/v1/object/sign/")) {
    return raw.split("?")[0].replace("/object/sign/", "/object/public/");
  }
  return raw;
}

function initials(title: string) {
  const parts = title.trim().split(/\s+/).filter(Boolean).slice(0, 2);
  const letters = parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
  return letters || "—";
}

export function PosterImage({
  src,
  title,
  alt = "",
  className,
  imgClassName,
}: {
  src?: string | null;
  title: string;
  alt?: string;
  className?: string;
  imgClassName?: string;
}) {
  const publicSrc = toPublicMediaUrl(src);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [publicSrc]);

  const showImage = Boolean(publicSrc) && !failed;

  return (
    <div className={cn("relative overflow-hidden bg-hero", className)}>
      {showImage ? (
        <img
          src={publicSrc ?? ""}
          alt={alt}
          className={cn("size-full object-cover object-bottom", imgClassName)}
          onError={() => {
            console.error("Poster failed to load", publicSrc);
            setFailed(true);
          }}
        />
      ) : (
        <div
          className="flex size-full items-center justify-center bg-muted text-[length:var(--ef-text-section)] font-medium uppercase tracking-wide text-muted-foreground"
          aria-hidden={Boolean(alt)}
        >
          {initials(title)}
        </div>
      )}
    </div>
  );
}
