"use client";

import { useEffect } from "react";

export function ViewTracker({ slug }: { slug: string }) {
  useEffect(() => {
    fetch(`/api/enseignements/${slug}/vue`, { method: "POST" }).catch(() => {});
  }, [slug]);

  return null;
}
