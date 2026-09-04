import React from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface ToolTraceItem {
  id: string;
  label: string;
  done: boolean;
}

interface ToolTraceProps {
  tools: ToolTraceItem[];
}

// Progress surfacing for the agent's tool calls — makes the unavoidable
// multi-step latency legible instead of a blank spinner. See plan §Agent
// loop: "tool progress is the point, not a decoration."
export default function ToolTrace({ tools }: ToolTraceProps) {
  if (tools.length === 0) return null;
  const allDone = tools.every((t) => t.done);

  return (
    <div className="w-full pl-0 pr-2 text-left">
      <div className="flex flex-col gap-1">
        {allDone ? (
          <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground/90">
            {tools.length} step{tools.length > 1 ? 's' : ''}
          </div>
        ) : (
          tools.map((t) => (
            <div key={t.id} className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/90">
              {t.done ? <Check size={12} className="text-primary/70 shrink-0" /> : <Loader2 size={12} className="animate-spin shrink-0" />}
              <span>{t.label}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
