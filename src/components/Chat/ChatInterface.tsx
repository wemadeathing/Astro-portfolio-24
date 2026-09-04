import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, MotionConfig } from 'framer-motion';
import { ArrowUp, Check, Copy, Menu, Mic, StopCircle, X } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ResourceCard from './ResourceCard';
import BlogCard from './BlogCard';
import IntakeCard, { type IntakeState } from './IntakeCard';
import type { ToolTraceItem } from './ToolTrace';
import ModeBadge from './ModeBadge';
import { streamChat, fetchConversation, submitIntake, editIntakeField, resetConversation } from '../../lib/chatClient';
import { QUOTE_FIELD_ORDER, QUOTE_FIELD_LABELS, CONTENT_FIELD_ORDER, CONTENT_FIELD_LABELS, isReadyToSubmit } from '../../lib/intake';

function computeMissingFields(flow: 'quote' | 'content', fields: Record<string, string>): string[] {
  const order = flow === 'content' ? CONTENT_FIELD_ORDER : QUOTE_FIELD_ORDER;
  const labels = flow === 'content' ? CONTENT_FIELD_LABELS : QUOTE_FIELD_LABELS;
  return order.filter((k) => !fields[k]).map((k) => labels[k as keyof typeof labels]);
}

// Splits into "word + trailing whitespace" chunks so each one can mount as
// its own animated span. Index-as-key is safe here specifically because
// content only ever grows during streaming: earlier chunks never change
// once a word is followed by whitespace, so only the last (still-growing)
// chunk updates in place per render — the reveal animation fires once per
// completed word, not once per character.
function splitIntoWordChunks(content: string): string[] {
  return content.match(/\S+\s*/g) ?? [];
}

// The "you're recording" affordance for voice dictation — an audio-level-
// meter metaphor (bars, not a generic pulse) so it's unambiguous at a
// glance that the mic is live, not just highlighted. Bars are decorative
// (no real audio analysis), just staggered so they don't move in lockstep.
const RECORDING_BAR_DELAYS_MS = [0, 150, 300, 450];
const RECORDING_BAR_HEIGHTS = ['40%', '100%', '60%', '80%'];

function DictationButton({ isListening, onClick }: { isListening: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isListening ? 'Stop dictation' : 'Start dictation'}
      className={`border p-2 transition-all ${
        isListening
          ? 'border-primary/60 bg-primary/10 text-primary'
          : 'border-border/80 text-muted-foreground hover:border-primary/25 hover:text-foreground'
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

interface ProjectData {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
}

interface ResourceData {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
  image?: string;
  siteName?: string;
}

interface BlogData {
  title: string;
  description: string;
  slug: string;
  pubDate: string;
  tags: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** True only while this message is actively receiving 'delta' events —
   * drives the per-word reveal animation. Cleared on 'final' (or error), so
   * completed/rehydrated messages render as plain static text with no
   * per-word span overhead. */
  streaming?: boolean;
  mode?: 'hiring' | 'sop';
  tools?: ToolTraceItem[];
  projects?: ProjectData[];
  resources?: ResourceData[];
  blogs?: BlogData[];
  chips?: { label: string; href: string; kind?: string }[];
  followUps?: string[];
  intake?: IntakeState;
}

interface LatestPostData {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
  };
}

interface ChatInterfaceProps {
  latestPost?: LatestPostData;
  projects?: ProjectData[];
  /** When true, Layout provides Navbar + backdrop; skip duplicate chrome here. */
  globalSiteNav?: boolean;
  /** Overrides the `?view=` URL param — use for a page dedicated to one mode. */
  forceView?: 'chat' | 'portfolio';
  /** Calendly (or similar) booking link, offered as an escape hatch from the intake flow. */
  calendlyUrl?: string;
}

const STARTER_CHIPS: { label: string; chipId: string; prompt: string }[] = [
  { label: 'Website', chipId: 'website', prompt: "I'm looking to get a website built." },
  { label: 'Brand Identity', chipId: 'brand_identity', prompt: 'I need help with my brand identity.' },
  { label: 'Product / UX Design', chipId: 'product_ux_design', prompt: 'I have a product or UX design project.' },
  { label: 'App Development', chipId: 'app_development', prompt: 'I want to build an app.' },
  { label: 'Not sure yet', chipId: 'not_sure', prompt: "I'm not sure what I need yet — can you help me figure it out?" },
];

// Web Speech API isn't in the standard lib.dom types yet, so this is typed loosely.
type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

// ─── Animation config ────────────────────────────────────────────────────────

const ease = [0.25, 0, 0, 1] as const;

const heroContainer = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

const heroItem = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease } },
};

const sectionReveal = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
};

const cardGrid = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease } },
};

const messageEnter = {
  hidden: { opacity: 0, y: 10, scale: 0.985 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32, ease } },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInterface({ latestPost, projects = [], globalSiteNav = false, forceView, calendlyUrl }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  // Every turn where the model calls propose_submission again (e.g. the
  // user keeps adding content after the card first appears) carries its
  // own ui.intake, attached to that turn's own message. Rendered
  // unconditionally, that stacks one full editable summary card per turn —
  // stale ones stick around next to the current one, each with its own
  // working Submit button. Restricting rendering to the single most recent
  // message that has one keeps exactly one live card, matching how
  // rehydration already behaves on reload.
  const lastIntakeMessageId = useMemo(() => {
    let id: string | undefined;
    for (const m of messages) if (m.intake) id = m.id;
    return id;
  }, [messages]);
  const messagesRef = useRef<Message[]>([]);
  const conversationIdRef = useRef<string | undefined>(undefined);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const voiceBaseTextRef = useRef('');

  const [hasStarted, setHasStarted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [introMode] = useState<'chat' | 'portfolio'>(() => {
    if (forceView) return forceView;
    if (typeof window !== 'undefined') {
      const urlMode = new URLSearchParams(window.location.search).get('view');
      if (urlMode === 'chat') return 'chat';
      return 'portfolio';
    }
    return 'portfolio';
  });

  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<Element | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Rehydrate the active (unsubmitted) conversation for this session from
  // the server on mount — replaces the old localStorage-only persistence.
  // Strictly better: restores cards and tool traces too, not just intake
  // fields, and survives a different device/browser for the same session
  // id... though the session id itself is only ever in localStorage, so in
  // practice this is still per-browser. See plan §Session.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let cancelled = false;
    fetchConversation()
      .then((snapshot) => {
        if (cancelled || !snapshot.conversation || snapshot.messages.length === 0) return;
        conversationIdRef.current = snapshot.conversation.id;
        const restored: Message[] = snapshot.messages.map((m) => {
          const ui = m.uiPayload ?? {};
          const flow = snapshot.conversation!.flow;
          const fields = flow === 'content' ? snapshot.conversation!.contentFields : snapshot.conversation!.quoteFields;
          return {
            id: m.id,
            role: m.role === 'tool' ? 'assistant' : m.role,
            content: m.content,
            mode: m.mode,
            projects: ui.projects,
            resources: ui.resources,
            blogs: ui.blogs,
            chips: ui.chips,
            followUps: ui.followUps,
            // Matches the server's own gating (routes/chat.ts): only
            // rehydrate the summary card once the conversation was actually
            // marked ready — a mid-conversation refresh shouldn't surface a
            // card that was never shown live in the first place.
            intake:
              flow &&
              snapshot.conversation!.readyToSubmit &&
              m.role === 'assistant' &&
              m === snapshot.messages[snapshot.messages.length - 1]
                ? {
                    intent: flow === 'content' ? 'content_intake' : 'quote_intake',
                    flow,
                    fields,
                    missingFields: computeMissingFields(flow, fields),
                    readyToSubmit: snapshot.conversation!.readyToSubmit,
                  }
                : undefined,
          };
        });
        setMessages(restored);
        messagesRef.current = restored;
        setHasStarted(true);
      })
      .catch(() => {
        // No active conversation, or the backend is unreachable — start fresh.
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    messagesRef.current = messages;
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(Boolean(Ctor));
    return () => {
      recognitionRef.current?.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const setBodyScrollLock = (lock: boolean) => {
      const w = window as any;
      const b = document.body;
      if (typeof w.__scrollLockCount !== 'number') w.__scrollLockCount = 0;

      if (lock) {
        if (w.__scrollLockCount === 0) {
          w.__scrollLockPrevOverflow = b.style.overflow;
          w.__scrollLockPrevPaddingRight = b.style.paddingRight;
          const sbw = window.innerWidth - document.documentElement.clientWidth;
          if (sbw > 0) b.style.paddingRight = `${sbw}px`;
          b.style.overflow = 'hidden';
        }
        w.__scrollLockCount += 1;
      } else {
        w.__scrollLockCount = Math.max(0, w.__scrollLockCount - 1);
        if (w.__scrollLockCount === 0) {
          b.style.overflow = w.__scrollLockPrevOverflow ?? '';
          b.style.paddingRight = w.__scrollLockPrevPaddingRight ?? '';
        }
      }
    };

    if (isMenuOpen) setBodyScrollLock(true);
    return () => {
      if (isMenuOpen) setBodyScrollLock(false);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    if (typeof document === 'undefined') return;

    const getFocusable = (root: HTMLElement | null) => {
      if (!root) return [] as HTMLElement[];
      const all = Array.from(
        root.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
        )
      );
      return all.filter((el) => {
        const style = window.getComputedStyle(el);
        return style.visibility !== 'hidden' && style.display !== 'none';
      });
    };

    if (!isMenuOpen) {
      requestAnimationFrame(() => {
        const prev = lastFocusedRef.current as HTMLElement | null;
        if (prev?.focus) prev.focus();
        lastFocusedRef.current = null;
      });
      return;
    }

    lastFocusedRef.current = document.activeElement;
    requestAnimationFrame(() => {
      menuCloseButtonRef.current?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (!isMenuOpen) return;
      if (e.key === 'Escape') setIsMenuOpen(false);

      if (e.key === 'Tab') {
        const focusables = getFocusable(menuPanelRef.current);
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (active === first || !menuPanelRef.current?.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (active === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isMenuOpen]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 20);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasStarted]);

  useEffect(() => {
    const hasSeenTooltip = sessionStorage.getItem('chat-tooltip-seen');
    if (hasSeenTooltip || hasStarted) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasStarted]);

  useEffect(() => {
    if (!showTooltip) return;

    const timer = setTimeout(() => {
      dismissTooltip();
    }, 2600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTooltip]);

  useEffect(() => {
    if (!hasStarted) return;
    if (!showTooltip) return;
    dismissTooltip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    const shouldUseChatShell = globalSiteNav && introMode === 'chat';
    document.body.classList.toggle('chat-landing-mode', shouldUseChatShell);
    return () => {
      document.body.classList.remove('chat-landing-mode');
    };
  }, [globalSiteNav, introMode]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    sessionStorage.setItem('chat-tooltip-seen', 'true');
  };

  const scrollToBottom = () => {
    const scroll = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    scroll();
    setTimeout(scroll, 100);
    setTimeout(scroll, 300);
  };

  const stopRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const toggleListening = () => {
    if (typeof window === 'undefined') return;

    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const Ctor = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!Ctor) return;

    const recognition: SpeechRecognitionLike = new Ctor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    voiceBaseTextRef.current = input.trim();

    recognition.onresult = (event: any) => {
      let finalText = '';
      let interimText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalText += transcript;
        } else {
          interimText += transcript;
        }
      }
      if (finalText) {
        voiceBaseTextRef.current = [voiceBaseTextRef.current, finalText.trim()].filter(Boolean).join(' ');
      }
      const combined = [voiceBaseTextRef.current, interimText.trim()].filter(Boolean).join(' ');
      setInput(combined);
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    setIsListening(true);
    recognition.start();
  };

  const startNewChat = () => {
    if (isLoading) {
      abortRef.current?.abort();
      setIsLoading(false);
    }
    const staleId = conversationIdRef.current;
    if (staleId) resetConversation(staleId);
    conversationIdRef.current = undefined;
    messagesRef.current = [];
    setMessages([]);
    setLastUserText(null);
    setHasStarted(false);
    setInput('');
  };

  const sendPrompt = async (prompt: string, chipId?: string) => {
    const trimmed = prompt.trim();
    if (!trimmed) return;
    if (isLoading) return;

    if (!hasStarted) setHasStarted(true);

    const prev = messagesRef.current;
    const nextUser: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: trimmed,
    };
    const nextMessages = [...prev, nextUser];

    messagesRef.current = nextMessages;
    setMessages(nextMessages);
    setLastUserText(trimmed);
    setInput('');

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoading(true);

    let assistantId: string | null = null;
    // Declared outside try/catch: the catch block below needs to clear this
    // timer too (e.g. on abort), and a try-scoped `let` isn't visible there.
    let revealTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      assistantId = (Date.now() + 1).toString();
      const placeholder: Message = { id: assistantId, role: 'assistant', content: '', streaming: true };
      setMessages((curr) => [...curr, placeholder]);

      const applyAssistantPatch = (patch: Partial<Message>) => {
        if (!assistantId) return;
        setMessages((curr) =>
          curr.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
        );
      };

      // Reveal pacing: network deltas can arrive in fast, uneven bursts.
      // This decouples how fast text visually appears from how fast the
      // network delivers it — incoming text is buffered and drip-fed to
      // the message a full line/sentence at a time on a steady clock,
      // rather than the raw (jumpy) delta boundaries. Same idea as Vercel
      // AI SDK's smoothStream / how ChatGPT's own UI behaves — the model
      // can finish generating well before the user has finished "watching"
      // it. Word-level spans (see splitIntoWordChunks, used at render time)
      // still exist so long lines wrap normally, but because every word in
      // a just-revealed chunk lands in the same React update, they all
      // mount — and so animate — together as one line, not word-by-word.
      const REVEAL_MS_PER_CHUNK = 260;
      const REVEAL_RETRY_MS = 50; // fast re-check while waiting on more text
      const MAX_UNTERMINATED_CHARS = 160; // fallback so a long unpunctuated
      // run (rare) doesn't stall waiting forever for a sentence terminator
      let revealedContent = '';
      let pendingReveal = '';
      let finalPatchPending: Partial<Message> | null = null;
      let streamEnded = false;

      const takeNextChunk = (): string | null => {
        const sentenceOrLine = pendingReveal.match(/^[^\n]*?[.!?:](?:\s+|$)/) ?? pendingReveal.match(/^[^\n]*\n+/);
        if (sentenceOrLine) return sentenceOrLine[0];
        if (streamEnded) return pendingReveal.length > 0 ? pendingReveal : null;
        if (pendingReveal.length > MAX_UNTERMINATED_CHARS) {
          const wordFallback = pendingReveal.match(/^\S*\s+/);
          if (wordFallback) return wordFallback[0];
        }
        return null;
      };

      const pumpReveal = () => {
        revealTimer = null;
        const piece = takeNextChunk();
        if (piece) {
          pendingReveal = pendingReveal.slice(piece.length);
          revealedContent += piece;
          applyAssistantPatch({ content: revealedContent });
          revealTimer = setTimeout(pumpReveal, REVEAL_MS_PER_CHUNK);
        } else if (pendingReveal.length > 0) {
          // Nothing complete yet (mid-sentence) — check back soon rather
          // than waiting out the full per-chunk interval unnecessarily.
          revealTimer = setTimeout(pumpReveal, REVEAL_RETRY_MS);
        } else if (finalPatchPending) {
          applyAssistantPatch(finalPatchPending);
          finalPatchPending = null;
        }
      };

      const enqueueReveal = (text: string) => {
        pendingReveal += text;
        if (!revealTimer) pumpReveal();
      };

      for await (const ev of streamChat(
        { message: trimmed, chipId, conversationId: conversationIdRef.current },
        controller.signal
      )) {
        if (ev.type === 'start') {
          conversationIdRef.current = ev.conversationId;
          continue;
        }

        if (ev.type === 'mode') {
          applyAssistantPatch({ mode: ev.mode });
          continue;
        }

        if (ev.type === 'tool_start') {
          setMessages((curr) =>
            curr.map((m) =>
              m.id === assistantId
                ? { ...m, tools: [...(m.tools ?? []), { id: ev.id, label: ev.label, done: false }] }
                : m
            )
          );
          continue;
        }

        if (ev.type === 'tool_end') {
          setMessages((curr) =>
            curr.map((m) =>
              m.id === assistantId
                ? { ...m, tools: (m.tools ?? []).map((t) => (t.id === ev.id ? { ...t, done: true } : t)) }
                : m
            )
          );
          continue;
        }

        if (ev.type === 'delta') {
          if (!ev.text) continue;
          enqueueReveal(ev.text);
          continue;
        }

        if (ev.type === 'final') {
          const parsed = ev.payload;
          const intake: IntakeState | undefined = parsed.intake
            ? {
                intent: parsed.intake.flow === 'content' ? 'content_intake' : 'quote_intake',
                flow: parsed.intake.flow,
                fields: parsed.intake.fields,
                missingFields: computeMissingFields(parsed.intake.flow, parsed.intake.fields),
                readyToSubmit: parsed.intake.readyToSubmit,
              }
            : undefined;

          // Deferred until the reveal queue (above) has drained whatever
          // was already buffered from earlier deltas — otherwise this
          // would instantly overwrite the in-progress line-by-line reveal
          // with the full final text, skipping the animation for anything
          // that hadn't visually caught up yet. streamEnded lets the queue
          // flush a trailing chunk even without a sentence terminator
          // (e.g. the reply's last line, or anything trimmed by scrubbing).
          streamEnded = true;
          const finalPatch: Partial<Message> = {
            content: typeof parsed.reply === 'string' ? parsed.reply : '',
            streaming: false,
            mode: parsed.mode,
            projects: Array.isArray(parsed.projects) ? parsed.projects : undefined,
            resources: Array.isArray(parsed.resources) ? parsed.resources : undefined,
            blogs: Array.isArray(parsed.blogs) ? parsed.blogs : undefined,
            chips: Array.isArray(parsed.chips) ? parsed.chips : undefined,
            followUps: Array.isArray(parsed.followUps) ? parsed.followUps : undefined,
            intake,
          };
          if (pendingReveal.length > 0 || revealTimer) {
            finalPatchPending = finalPatch;
            if (!revealTimer) pumpReveal();
          } else {
            applyAssistantPatch(finalPatch);
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        if (revealTimer) clearTimeout(revealTimer);
        if (assistantId) {
          setMessages((curr) => curr.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)));
        }
        return;
      }
      if (revealTimer) clearTimeout(revealTimer);
      if (assistantId) {
        setMessages((curr) =>
          curr.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, I had trouble connecting. You can retry.', streaming: false }
              : m
          )
        );
      } else {
        setMessages((curr) => [
          ...curr,
          {
            id: (Date.now() + 2).toString(),
            role: 'assistant',
            content: 'Sorry, I had trouble connecting. You can retry.',
          },
        ]);
      }
    } finally {
      setIsLoading(false);
      if (abortRef.current === controller) abortRef.current = null;
    }
  };

  const startChatWithPrompt = (prompt: string) => {
    void sendPrompt(prompt);
  };

  const startChatWithChip = (chipId: string, prompt: string) => {
    void sendPrompt(prompt, chipId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setHasStarted(false);
    setLastUserText(null);
    conversationIdRef.current = undefined;
  };

  const handleIntakeFieldEdit = (messageId: string, key: string, value: string) => {
    setMessages((curr) =>
      curr.map((m) => {
        if (m.id !== messageId || !m.intake) return m;
        const fields = { ...m.intake.fields, [key]: value };
        return {
          ...m,
          intake: {
            ...m.intake,
            fields,
            missingFields: computeMissingFields(m.intake.flow, fields),
            // Mirrors the server's propose_submission / PATCH-fields bar —
            // an optimistic update so Submit unlocks immediately, without
            // waiting on the round-trip below.
            readyToSubmit: isReadyToSubmit(m.intake.flow, fields),
          },
        };
      })
    );

    // Direct, non-LLM correction persisted server-side — /intake/submit
    // reads from the DB row, so a local-only edit would otherwise be
    // silently discarded at submit time.
    if (conversationIdRef.current) {
      void editIntakeField(conversationIdRef.current, key, value);
    }
  };

  const handleIntakeSubmit = async (messageId: string) => {
    const conversationId = conversationIdRef.current;
    if (!conversationId) return;

    setSubmittingId(messageId);
    try {
      const result = await submitIntake(conversationId);

      if (result.success) {
        setMessages((curr) =>
          curr.map((m) =>
            m.id === messageId && m.intake
              ? { ...m, intake: { ...m.intake, submitted: true, submitError: undefined } }
              : m
          )
        );
        conversationIdRef.current = undefined;
      } else {
        const errorMsg = result.error || 'Something went wrong. Please try again.';
        setMessages((curr) =>
          curr.map((m) => (m.id === messageId && m.intake ? { ...m, intake: { ...m.intake, submitError: errorMsg } } : m))
        );
      }
    } catch {
      setMessages((curr) =>
        curr.map((m) =>
          m.id === messageId && m.intake
            ? { ...m, intake: { ...m.intake, submitError: 'Something went wrong. Please try again.' } }
            : m
        )
      );
    } finally {
      setSubmittingId(null);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const isIntro = !hasStarted && messages.length === 0;
  const useDocumentScrollIntro = Boolean(globalSiteNav && isIntro && introMode === 'portfolio');
  const retryLast = () => {
    if (!lastUserText) return;
    startChatWithPrompt(lastUserText);
  };

  const menuLinks: { title: string; description: string; href: string; external?: boolean }[] = [
    { title: 'Work', description: 'Browse featured case studies', href: '/projects' },
    { title: 'About', description: 'Background and approach', href: '/about' },
    { title: 'AI Chat', description: 'Ask about projects, process, and capabilities', href: '/?view=chat' },
    { title: 'Contact', description: 'Send a message or start a project', href: '/contact' },
  ];

  const typingMessageId =
    isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant'
      ? messages[messages.length - 1].id
      : null;

  // Show the mode badge only on a transition, not on every message — a
  // quiet signal of which "hat" the assistant is wearing, not noise.
  // Only flag a real transition (hiring <-> sop), not the first assistant
  // message settling into a mode from undefined — that's not a switch worth
  // announcing, just the conversation starting.
  const modeTransitionMessageIds = new Set<string>();
  {
    let prevMode: string | undefined;
    for (const m of messages) {
      if (m.role !== 'assistant' || !m.mode) continue;
      if (prevMode !== undefined && m.mode !== prevMode) modeTransitionMessageIds.add(m.id);
      prevMode = m.mode;
    }
  }

  const practiceItems = [
    'AI product design and MVP delivery',
    'Design systems and interface architecture',
    'Frontend build work for teams that need execution, not just direction',
  ];

  return (
    // reducedMotion="user" makes every nested <motion.*> respect the OS-level
    // prefers-reduced-motion setting automatically — cheaper and more
    // reliable than gating each animation definition individually.
    <MotionConfig reducedMotion="user">
    <div
      className={
        globalSiteNav
          ? 'flex flex-col h-full min-h-0 bg-background text-foreground relative'
          : useDocumentScrollIntro
          ? 'flex flex-col min-h-screen bg-background text-foreground relative'
          : 'flex flex-col min-h-screen h-[100dvh] overflow-hidden bg-background text-foreground relative'
      }
    >
      {/* Background noise */}
      {!globalSiteNav && (
        <div className="absolute inset-0 pointer-events-none -z-20">
          <div className="site-backdrop" />
        </div>
      )}
      <div className="absolute inset-0 bg-noise opacity-[0.03] -z-10 pointer-events-none" />

      {/* Standalone nav (not used when globalSiteNav=true) */}
      {!globalSiteNav && (
        <>
          <div className="sticky top-0 z-40 pt-3">
            <div className="shell-wrap relative">
              <nav
                className={`flex min-h-[63px] items-center justify-between border px-4 py-3 transition-all duration-300 ${
                  isScrolled ? 'border-border/80 bg-background' : 'border-border/80 bg-background'
                }`}
              >
                <a href="/" className="flex items-center transition-opacity hover:opacity-80">
                  <img src="/images/ns26/logo26w-gradient.svg" alt="Nasif Salaam" className="h-7 sm:h-8 w-auto" />
                </a>
                <button
                  type="button"
                  aria-label="Open menu"
                  aria-expanded={isMenuOpen}
                  aria-controls="site-menu"
                  onClick={() => setIsMenuOpen(true)}
                  className="flex h-10 w-10 items-center justify-center text-foreground transition-opacity duration-200 hover:opacity-70"
                >
                  <Menu size={18} />
                </button>
              </nav>
            </div>
          </div>

          {/* Menu flyout */}
          <div
            id="site-menu"
            role="dialog"
            aria-modal="true"
            className={[
              'fixed inset-0 z-50 transition-opacity duration-200',
              isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
            ].join(' ')}
            onClick={() => setIsMenuOpen(false)}
          >
            <div className="absolute inset-0 bg-black/55" />
            <div className="absolute left-0 right-0 top-3" onClick={(e) => e.stopPropagation()}>
              <div className="shell-wrap flex justify-end">
                <div
                  ref={menuPanelRef}
                  className={[
                    'origin-top-right border border-border/80 bg-background',
                    'w-full max-w-[560px] overflow-hidden',
                    'transition-all duration-300 ease-out',
                    isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98]',
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between border-b border-border/80 px-4 py-3">
                    <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Navigation</div>
                    <button
                      ref={menuCloseButtonRef}
                      type="button"
                      aria-label="Close menu"
                      onClick={() => setIsMenuOpen(false)}
                      className="flex h-9 w-9 items-center justify-center border border-border/80 text-foreground transition-colors hover:border-primary/25"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="max-h-[calc(100vh-7rem)] overflow-auto p-4">
                    <div className="grid grid-cols-1 gap-0">
                      {menuLinks.map((item) => (
                        <a
                          key={item.title}
                          href={item.href}
                          target={item.external ? '_blank' : undefined}
                          rel={item.external ? 'noopener noreferrer' : undefined}
                          className="group flex items-start justify-between gap-4 border-t border-border/80 py-4 transition-colors hover:border-primary/40"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-primary">+</div>
                            <div className="text-left">
                              <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-foreground">{item.title}</div>
                              <div className="mt-1 text-sm leading-snug text-muted-foreground">{item.description}</div>
                            </div>
                          </div>
                          <div className="shrink-0 font-mono text-[11px] uppercase tracking-[0.14em] text-muted-foreground transition-colors group-hover:text-foreground">↗</div>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Intro Screen ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {isIntro && (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            // Instant exit (not animated out over 200ms) — this panel and
            // the chat-area panel below are two SEPARATE AnimatePresence
            // trees with no shared coordination, so a lingering exit here
            // means both are simultaneously laid out as flex siblings for
            // that whole window. This one uses min-h-[calc(100dvh-5rem)]
            // (near-full viewport in chat mode), which starves the
            // chat-area's flex-1 sizing down to a sliver for the duration —
            // observed live as the message list collapsing to ~200px tall
            // near the bottom of the screen right after sending the first
            // message. An instant exit closes that window to ~1 frame.
            exit={{ opacity: 0, transition: { duration: 0 } }}
            className={
              useDocumentScrollIntro
                ? 'px-4 pt-4 sm:pt-6 pb-16 relative z-20'
                : introMode === 'chat'
                ? 'min-h-[calc(100dvh-5rem)] flex flex-col px-4 pb-4 relative z-20'
                : 'flex-1 overflow-y-auto px-4 pb-6 relative z-20 pt-24 sm:pt-28'
            }
          >
            <div className={introMode === 'chat' ? 'flex-1 flex flex-col w-full max-w-[1100px] mx-auto items-center text-center min-h-0' : 'w-full max-w-[1100px] mx-auto flex flex-col items-center text-center'}>

              {/* ── Chat View ── */}
              {introMode === 'chat' && (
                <div className="flex-1 w-full flex flex-col items-center text-center min-h-0">
                  <div className="flex-1 flex flex-col items-center justify-center py-8 w-full min-h-0">
                  <motion.div
                    className="w-full max-w-[700px] px-2 py-2 md:px-4 md:py-3"
                    variants={heroContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.h1 variants={heroItem} className="text-3xl md:text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground/95">
                      Ask anything.<br />Get a real answer.
                    </motion.h1>
                    <motion.p variants={heroItem} className="mx-auto mt-4 max-w-[48ch] text-sm leading-[1.8] text-muted-foreground/90">
                      Ask about projects, process, tech stack, availability, or how I approach AI builds. The AI has full context on the work.
                    </motion.p>

                    <motion.div variants={heroItem} className="mt-6 flex flex-col items-center gap-2">
                      <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground/90">Or start a project</div>
                      <div className="flex flex-nowrap justify-start sm:justify-center gap-1.5 overflow-x-auto max-w-full px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {STARTER_CHIPS.map((chip) => (
                          <button
                            key={chip.label}
                            type="button"
                            onClick={() => startChatWithChip(chip.chipId, chip.prompt)}
                            className="shrink-0 whitespace-nowrap border border-border/80 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                          >
                            {chip.label}
                          </button>
                        ))}
                        {calendlyUrl && (
                          <a
                            href={calendlyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 whitespace-nowrap border border-border/80 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                          >
                            Book a call
                          </a>
                        )}
                      </div>
                    </motion.div>

                    <motion.form
                      variants={heroItem}
                      onSubmit={handleSubmit}
                      className="relative mt-6 flex w-full max-w-[680px] items-center gap-2 border border-border/80 bg-background px-2 transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/15"
                    >
                      {showTooltip && (
                        <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-10">
                          <div className="relative bg-primary/92 px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg whitespace-nowrap">
                            <div className="absolute left-1/2 -translate-x-1/2 bottom-full w-0 h-0 border-l-8 border-r-8 border-b-8 border-l-transparent border-r-transparent border-b-primary/95" />
                            Try asking me anything about my work!
                            <button
                              type="button"
                              onClick={dismissTooltip}
                              className="ml-2 opacity-70 hover:opacity-100 transition-opacity"
                              aria-label="Dismiss tooltip"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      )}
                      <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        ref={inputRef}
                        placeholder={isListening ? 'Listening…' : 'Ask me about my projects, skills, or experience...'}
                        className="w-full bg-transparent py-3.5 pl-4 pr-14 text-base outline-none transition-all placeholder:text-muted-foreground/90 placeholder:font-normal md:py-4 md:pl-5"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                        {voiceSupported && !isLoading && (
                          <DictationButton isListening={isListening} onClick={toggleListening} />
                        )}
                        {isLoading ? (
                          <button
                            type="button"
                            onClick={stopRequest}
                            className="border border-border/80 p-2 text-foreground transition-all hover:border-primary/25"
                            aria-label="Stop"
                          >
                            <StopCircle size={20} />
                          </button>
                        ) : (
                          <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="border border-border/80 bg-primary p-2 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Send"
                          >
                            <ArrowUp size={20} />
                          </button>
                        )}
                      </div>
                    </motion.form>

                  </motion.div>
                  </div>
                  <footer className="w-full border-t border-border/30 py-4 px-4">
                    <div className="max-w-[680px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground/90">
                      <span>© 2026 Nasif Salaam · Cape Town</span>
                      <div className="flex items-center gap-5">
                        <a href="https://www.linkedin.com/in/nasifsalaam/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
                        <a href="https://github.com/wemadeathing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                        <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
                      </div>
                    </div>
                  </footer>
                </div>
              )}

              {/* ── Portfolio View (Home Page) ── */}
              {introMode === 'portfolio' && (
                <div className="w-full flex flex-col items-center">

                  {/* Hero */}
                  <motion.div
                    className="w-full max-w-[700px] text-center"
                    variants={heroContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={heroItem} className="section-kicker justify-center">
                      Product Designer + AI Builder
                    </motion.div>
                    <motion.h1
                      variants={heroItem}
                      className="mt-5 text-3xl md:text-5xl font-medium leading-[1.02] tracking-[-0.04em] text-foreground/95"
                    >
                      I design &amp; build products with AI, for humans. And AI.
                    </motion.h1>
                    <motion.p
                      variants={heroItem}
                      className="mx-auto mt-5 max-w-[60ch] text-sm leading-[1.8] text-muted-foreground/90"
                    >
                      Product designer and AI builder with 15+ years across brand, digital products, and systems. When a product is powered by AI, building it well means designing how the agents receive context, use their tools, and respond.
                    </motion.p>

                  </motion.div>

                  {/* Selected work */}
                  <motion.div
                    className="mt-12 w-full text-left"
                    variants={sectionReveal}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                  >
                    <div className="mb-6 flex items-center gap-4">
                      <div className="section-kicker">Selected Work</div>
                      <a
                        href="/projects"
                        className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/90 transition-colors hover:text-foreground"
                      >
                        All projects ↗
                      </a>
                    </div>

                    <motion.div
                      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                      variants={cardGrid}
                      initial="hidden"
                      whileInView="visible"
                      viewport={{ once: true, margin: '-40px' }}
                    >
                      {projects.slice(0, 6).map((project) => (
                        <motion.div key={project.slug} variants={cardItem}>
                          <ProjectCard {...project} />
                        </motion.div>
                      ))}
                    </motion.div>
                  </motion.div>

                  {/* Practice */}
                  <motion.div
                    className="mt-16 w-full"
                    variants={sectionReveal}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                  >
                    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
                      <div className="text-left">
                        <div className="section-kicker mb-4">Practice</div>
                        <p className="text-sm leading-7 text-muted-foreground max-w-[34ch]">
                          I work across AI product design, product systems, and high-trust digital experiences. The through-line is structure: better context, clearer interfaces, and faster paths from idea to working product.
                        </p>
                      </div>

                      <motion.div
                        className="grid gap-0"
                        variants={cardGrid}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: '-40px' }}
                      >
                        {practiceItems.map((item, i) => (
                          <motion.div
                            key={item}
                            variants={cardItem}
                            className="border-t border-border/60 py-5 flex items-start gap-4"
                          >
                            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-primary pt-0.5 shrink-0">
                              0{i + 1}
                            </div>
                            <p className="text-sm leading-6 text-foreground/88">{item}</p>
                          </motion.div>
                        ))}
                      </motion.div>
                    </div>
                  </motion.div>

                  {/* Availability */}
                  <motion.div
                    className="mt-16 w-full border-t border-border/60 pt-10"
                    variants={sectionReveal}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: '-60px' }}
                  >
                    <div className="text-left max-w-[60ch]">
                      <div className="section-kicker mb-4">Availability</div>
                      <p className="text-sm leading-[1.8] text-foreground/88">
                        Currently available for project work. If you are building an AI-powered product, or need a website or brand that earns trust, I would love to hear about it.
                      </p>
                      <div className="mt-6 flex flex-wrap items-center gap-3">
                        <a href="/contact" className="btn-stripe min-h-[48px] px-8">
                          Get in touch
                        </a>
                        <a
                          href="/work-with-me"
                          className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
                        >
                          How I can help
                        </a>
                      </div>
                    </div>
                  </motion.div>


                  {/* Footer for standalone mode */}
                  {!globalSiteNav && (
                    <footer className="w-full border-t border-border/40 mt-12 pt-6 pb-4 text-xs text-muted-foreground/90">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div>© {new Date().getFullYear()} Nasif Salaam</div>
                        <div className="flex gap-4">
                          <a href="https://github.com/wemadeathing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
                          <a href="https://www.linkedin.com/in/nasifsalaam/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">LinkedIn</a>
                        </div>
                      </div>
                    </footer>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Area ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isIntro && (
          <motion.div
            key="chat-area"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.3, ease } }}
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-36 scroll-smooth flex flex-col"
          >
            {/* mt-auto bottom-anchors a short conversation against the input
                bar instead of stranding it at the top of this tall scroll
                region with a dead gap below — same structural pattern as
                Perplexity/ChatGPT/Claude. Once content overflows, mt-auto is
                a no-op and normal top-down scrolling takes over. */}
            {/* w-full is load-bearing, not decorative: mt-auto puts an auto
                margin on this flex item's cross axis (this is a column flex
                container), which per spec removes its default stretch
                sizing — without an explicit width, it falls back to
                shrink-to-fit based on children, whose own widths are
                percentages OF THIS ELEMENT (max-w-[78%] / max-w-[92%] on
                message bubbles) — a circular dependency that collapsed this
                to ~150px instead of up to 720px, breaking text wrapping for
                every message. w-full gives it a definite base width before
                max-w-[720px] caps it, resolving the cycle. */}
            <div className={`mt-auto w-full max-w-[720px] mx-auto space-y-8 ${globalSiteNav ? 'pt-6' : 'pt-20'}`}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    variants={messageEnter}
                    initial="hidden"
                    animate="visible"
                    className={`flex flex-col gap-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {/* Fixed px, not %: this row's own width is
                          shrink-to-fit (items-end/items-start on the parent
                          removes flex stretch), so a percentage max-width
                          here would resolve against a width that itself
                          depends on this element's size — the same circular
                          dependency fixed above on the message column, one
                          level down. Fixed values (78%/92% of the 720px
                          column, rounded) sidestep it entirely. */}
                      <div
                        className={`relative group ${msg.role === 'user' ? 'max-w-[560px]' : 'max-w-[660px]'} text-foreground`}
                      >
                        {msg.role === 'assistant' && msg.id === typingMessageId && !msg.content ? (
                          <div className="flex items-center gap-2 px-1 py-2" role="status" aria-live="polite">
                            <span className="sr-only">Assistant is typing a response...</span>
                            <div className="h-2 w-2 bg-foreground/50 animate-bounce" aria-hidden="true" />
                            <div className="h-2 w-2 bg-foreground/50 animate-bounce delay-75" aria-hidden="true" />
                            <div className="h-2 w-2 bg-foreground/50 animate-bounce delay-150" aria-hidden="true" />
                          </div>
                        ) : (
                          <>
                            <p className={`whitespace-pre-wrap text-[15px] leading-8 text-foreground/92 ${
                              msg.role === 'user' ? 'text-right' : ''
                            }`}>
                              {msg.role === 'assistant' && msg.streaming
                                ? splitIntoWordChunks(msg.content).map((chunk, i) => (
                                    <span key={i} className="animate-stream-word">
                                      {chunk}
                                    </span>
                                  ))
                                : msg.content}
                            </p>
                            {msg.role === 'assistant' && msg.content && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="absolute -top-1 right-0 border border-border/80 bg-background p-2 opacity-40 transition-all hover:border-primary/25 hover:opacity-100 focus-visible:opacity-100 group-hover:opacity-100"
                                aria-label="Copy response"
                                title="Copy to clipboard"
                              >
                                {copiedId === msg.id ? (
                                  <Check size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} className="text-muted-foreground" />
                                )}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {msg.role === 'assistant' && msg.content.toLowerCase().includes('retry') && lastUserText && (
                      <div className="pl-0">
                        <button
                          type="button"
                          onClick={retryLast}
                          className="border border-border/80 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.mode && modeTransitionMessageIds.has(msg.id) && (
                      <ModeBadge mode={msg.mode} />
                    )}

                    {msg.projects && msg.projects.length > 0 && (
                      <div className="w-full pl-0 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</span>
                          <a href="/projects" className="text-xs text-muted-foreground/90 hover:text-foreground transition-colors">View all →</a>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                          {msg.projects.map((project) => (
                            <div key={project.slug} className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start">
                              <ProjectCard {...project} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.resources && msg.resources.length > 0 && (
                      <div className="w-full pl-0 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</span>
                          <a href="/resources" className="text-xs text-muted-foreground/90 hover:text-foreground transition-colors">View all →</a>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                          {msg.resources.map((resource) => (
                            <div key={resource.url} className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start">
                              <ResourceCard {...resource} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.blogs && msg.blogs.length > 0 && (
                      <div className="w-full pl-0 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights</span>
                          <a href="/blog" className="text-xs text-muted-foreground/90 hover:text-foreground transition-colors">View all →</a>
                        </div>
                        <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                          {msg.blogs.map((blog) => (
                            <div key={blog.slug} className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start">
                              <BlogCard {...blog} />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.chips && msg.chips.length > 0 && (
                      <div className="w-full pl-0 pr-2">
                        <div className="flex flex-wrap gap-2">
                          {msg.chips.map((chip) => (
                            <a
                              key={`${chip.label}-${chip.href}`}
                              href={chip.href}
                              className="border border-border/80 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground md:text-sm"
                            >
                              {chip.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.intake && msg.id === lastIntakeMessageId && (
                      <div className="w-full pl-0 pr-2 text-left">
                        <IntakeCard
                          intake={msg.intake}
                          submitting={submittingId === msg.id}
                          onFieldEdit={(key, value) => handleIntakeFieldEdit(msg.id, key, value)}
                          onSubmit={() => handleIntakeSubmit(msg.id)}
                          calendlyUrl={calendlyUrl}
                        />
                      </div>
                    )}

                    {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                      <div className="w-full pl-0 pr-2 mt-3">
                        <div className="text-xs text-muted-foreground mb-2">You might also want to ask:</div>
                        <div className="flex flex-col gap-1.5">
                          {msg.followUps.map((followUp, idx) => (
                            <button
                              key={`followup-${idx}`}
                              type="button"
                              onClick={() => {
                                setInput(followUp);
                                inputRef.current?.focus();
                                setTimeout(() => {
                                  inputRef.current?.parentElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
                                }, 100);
                              }}
                              className="inline-flex items-center border border-border/80 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                            >
                              {followUp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat Input Bar ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {!isIntro && (
          <motion.div
            key="chat-input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { duration: 0.3, delay: 0.1, ease } }}
            className="sticky bottom-0 z-30 mt-4 border-t border-border/60 bg-background/96 px-4 pb-4 pt-4 md:px-6 md:pb-6 md:pt-5"
          >
            <div className="max-w-[720px] mx-auto">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="-m-2 p-2 font-mono text-[11px] uppercase tracking-[0.12em] text-muted-foreground/90 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary/60"
                >
                  New chat
                </button>
              </div>
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2 border border-border/80 bg-background px-2 transition-colors focus-within:border-primary/50 focus-within:ring-4 focus-within:ring-primary/15">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  ref={inputRef}
                  placeholder={isListening ? 'Listening…' : 'Ask me about my projects, skills, or experience...'}
                  className="w-full bg-transparent py-4 md:py-4 pl-4 md:pl-5 pr-14 text-base outline-none transition-all placeholder:text-muted-foreground/90 placeholder:font-normal"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {voiceSupported && !isLoading && (
                    <DictationButton isListening={isListening} onClick={toggleListening} />
                  )}
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={stopRequest}
                      className="border border-border/80 p-2 text-foreground transition-all hover:border-primary/25"
                      aria-label="Stop"
                    >
                      <StopCircle size={20} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="border border-border/80 bg-primary p-2 text-primary-foreground transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send"
                    >
                      <ArrowUp size={20} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
    </MotionConfig>
  );
}
