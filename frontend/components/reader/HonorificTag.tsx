"use client";

import { honorificFor } from "@/lib/honorifics";
import { useReaderSettings } from "@/lib/hooks/useReaderSettings";

/** Renders a narrator's classical honorific when the reader has them enabled. */
export function HonorificTag({ generation, className = "" }: { generation: string; className?: string }) {
  const { showHonorifics } = useReaderSettings();
  if (!showHonorifics) return null;
  const honorific = honorificFor(generation);
  if (!honorific) return null;
  return (
    <span className={`text-amber-node/80 ${className}`} title={honorific.full}>
      {honorific.abbr}
    </span>
  );
}
