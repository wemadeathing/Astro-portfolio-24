import React from 'react';

const MODE_LABELS: Record<string, string> = {
  hiring: 'Portfolio',
  sop: 'Project intake',
};

// Makes the mode-scoped architecture visible to the visitor — a small,
// quiet signal of which "hat" the assistant is currently wearing, shown
// once per mode switch rather than on every message.
export default function ModeBadge({ mode }: { mode: string }) {
  const label = MODE_LABELS[mode];
  if (!label) return null;
  return (
    <div className="w-full pr-2 text-left font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/90">
      {label}
    </div>
  );
}
