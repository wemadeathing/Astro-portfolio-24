import React from 'react';
import { ArrowUp, StopCircle } from 'lucide-react';
import DictationButton from './DictationButton';

/**
 * The contents of the message composer: the text field, the dictation
 * toggle, and the send/stop button.
 *
 * This existed twice in ChatInterface — once on the intro screen and once in
 * the docked input bar — as ~30 lines of near-identical JSX each. Two copies
 * of the same control is how they drift: they had already diverged on the
 * send button's border (see `variant` below), and any future change to the
 * placeholder, the disabled rules or the dictation affordance would have had
 * to be made twice or silently apply to only one of them.
 *
 * The FORM element stays at each call site rather than moving in here: the
 * intro one is a `motion.form` carrying an animation variant and its own
 * width constraint, the docked one is a plain `form`. Wrapping that
 * difference in a prop would hide more than it saved.
 */
export interface ComposerControlsProps {
  input: string;
  onInputChange: (value: string) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isLoading: boolean;
  isListening: boolean;
  voiceSupported: boolean;
  onToggleListening: () => void;
  onStop: () => void;
  /**
   * The two surfaces this appears on, and the styling that legitimately
   * differs between them:
   *   'intro' — entry screen: slightly tighter vertical padding on mobile,
   *             and a borderless send button.
   *   'bar'   — docked input bar: uniform padding, bordered send button.
   * The border divergence is preserved exactly as it was found; it reads
   * more like drift than intent, but unifying it is a visual change, not a
   * refactor.
   */
  variant: 'intro' | 'bar';
}

export default function ComposerControls({
  input,
  onInputChange,
  inputRef,
  isLoading,
  isListening,
  voiceSupported,
  onToggleListening,
  onStop,
  variant,
}: ComposerControlsProps) {
  const inputPadding =
    variant === 'intro' ? 'py-3.5 pl-4 pr-14 md:py-4 md:pl-5' : 'py-4 md:py-4 pl-4 md:pl-5 pr-14';
  const sendBorder = variant === 'bar' ? 'border border-border/80 ' : '';

  return (
    <>
      <input
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        ref={inputRef}
        placeholder={isListening ? 'Listening…' : 'Ask me about my projects, skills, or experience...'}
        className={`w-full bg-transparent ${inputPadding} text-base outline-none transition-all placeholder:text-muted-foreground/90 placeholder:font-normal`}
        disabled={isLoading}
      />
      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
        {voiceSupported && !isLoading && (
          <DictationButton isListening={isListening} onClick={onToggleListening} />
        )}
        {isLoading ? (
          <button
            type="button"
            onClick={onStop}
            className="border border-border/80 p-2 text-foreground transition-all hover:border-primary/25"
            aria-label="Stop"
          >
            <StopCircle size={20} />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className={`${sendBorder}bg-primary p-2 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50`}
            aria-label="Send"
          >
            <ArrowUp size={20} />
          </button>
        )}
      </div>
    </>
  );
}
