import React from 'react';
import { Mic } from 'lucide-react';

// The "you're recording" affordance for voice dictation — an audio-level-
// meter metaphor (bars, not a generic pulse) so it's unambiguous at a
// glance that the mic is live, not just highlighted. Bars are decorative
// (no real audio analysis), just staggered so they don't move in lockstep.
const RECORDING_BAR_DELAYS_MS = [0, 150, 300, 450];
const RECORDING_BAR_HEIGHTS = ['40%', '100%', '60%', '80%'];

export default function DictationButton({
  isListening,
  onClick,
}: {
  isListening: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
      // Idle state carries no border: it sits inside the composer, which is
      // now the screen's one bordered element, and a box within that box read
      // as a second competing control rather than a tool on the field. The
      // recording state still gets a frame, where being unmistakable matters.
      className={`p-2 transition-all ${
        isListening
          ? 'border border-primary/60 bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {isListening ? (
        <span className="flex h-[18px] w-[18px] items-end justify-center gap-[2px]" aria-hidden="true">
          {RECORDING_BAR_DELAYS_MS.map((delay, i) => (
            <span
              key={delay}
              className="recording-bar w-[3px] rounded-[1px] bg-primary"
              style={{ height: RECORDING_BAR_HEIGHTS[i], animationDelay: `${delay}ms` }}
            />
          ))}
        </span>
      ) : (
        <Mic size={18} />
      )}
    </button>
  );
}
