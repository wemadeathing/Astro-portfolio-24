import React, { useEffect, useRef, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

export interface ToolTraceItem {
  id: string;
  label: string;
  done: boolean;
}

interface ToolTraceProps {
  tools: ToolTraceItem[];
  /** True while a model call is in flight and has produced no answer text yet. */
  thinking?: boolean;
}

/**
 * Elapsed-time counter for the thinking row. Deliberately starts at "1s" and
 * only ticks whole seconds: this exists to reassure someone that the thing is
 * alive, and a jittering millisecond readout does the opposite.
 */
function useElapsedSeconds(active: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    if (!active) {
      setSeconds(0);
      return;
    }
    startedAt.current = Date.now();
    setSeconds(0);
    const id = window.setInterval(() => {
      setSeconds(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, [active]);

  return seconds;
}

// Progress surfacing for the agent's tool calls — makes the unavoidable
// multi-step latency legible instead of a blank spinner. See plan §Agent
// loop: "tool progress is the point, not a decoration."
//
// The thinking row covers the other half of that latency. Every model this
// service now runs reasons before it answers (measured time-to-first-token:
// ~2.8s on the primary, ~5.9s on the fallback), and that silence used to
// land either before any tool fired or between the last tool result and the
// first word of the reply — both stretches where the UI showed nothing at
// all. It reports only THAT the model is thinking, never what it is
// thinking: raw chain-of-thought habitually restates the system prompt,
// tool names and retrieval details, all of which this assistant is
// explicitly instructed never to reveal.
export default function ToolTrace({ tools, thinking = false }: ToolTraceProps) {
  const elapsed = useElapsedSeconds(thinking);
  const showThinking = thinking;

  if (tools.length === 0 && !showThinking) return null;

  const allDone = tools.every((t) => t.done);
  // Collapse finished tool rows into a count only once nothing is pending —
  // while thinking is still live the steps stay legible, since they are the
  // only evidence of what the pause is actually for.
  const collapseTools = tools.length > 0 && allDone && !showThinking;

  return (
    <div className="w-full pl-0 pr-2 text-left">
      <div className="flex flex-col gap-1">
        {collapseTools ? (
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

        {showThinking && (
          <div
            className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground/90"
            role="status"
            aria-live="polite"
          >
            <Loader2 size={12} className="animate-spin shrink-0 motion-reduce:animate-none" />
            <span>Thinking…</span>
            {elapsed > 0 && (
              // tabular-nums so the row doesn't reflow as the count grows.
              <span className="tabular-nums text-muted-foreground/60">{elapsed}s</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
