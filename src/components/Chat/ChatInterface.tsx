import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, Menu, Send, StopCircle, User, X } from 'lucide-react';
import ProjectCard from './ProjectCard';
import ResourceCard from './ResourceCard';
import BlogCard from './BlogCard';

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
  projects?: ProjectData[];
  resources?: ResourceData[];
  blogs?: BlogData[];
  chips?: { label: string; href: string; kind?: string }[];
  followUps?: string[];
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
}

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
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease } },
};

// ─────────────────────────────────────────────────────────────────────────────

export default function ChatInterface({ latestPost, projects = [], globalSiteNav = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [introMode] = useState<'chat' | 'portfolio'>(() => {
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

  const fillInput = (text: string) => {
    setInput(text);
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      try {
        el.setSelectionRange(end, end);
      } catch {
        // ignore
      }
    });
  };

  const stopRequest = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setIsLoading(false);
  };

  const sendPrompt = async (prompt: string) => {
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

    try {
      const history = nextMessages.slice(-12).map((m) => ({ role: m.role, content: m.content }));

      assistantId = (Date.now() + 1).toString();
      const placeholder: Message = { id: assistantId, role: 'assistant', content: '' };
      setMessages((curr) => [...curr, placeholder]);

      const response = await fetch('/api/chat?stream=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
          'x-chat-stream': '1',
        },
        body: JSON.stringify({ message: trimmed, history }),
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);

      const ct = response.headers.get('content-type') || '';
      const isSse = ct.includes('text/event-stream');

      const applyAssistantPatch = (patch: Partial<Message>) => {
        if (!assistantId) return;
        setMessages((curr) =>
          curr.map((m) => (m.id === assistantId ? { ...m, ...patch } : m))
        );
      };

      if (!isSse) {
        const data = await response.json().catch(() => ({} as any));
        applyAssistantPatch({
          content: data.reply || 'Sorry, I had trouble connecting. You can retry.',
          projects: Array.isArray(data.projects) ? data.projects : undefined,
          resources: Array.isArray(data.resources) ? data.resources : undefined,
          blogs: Array.isArray(data.blogs) ? data.blogs : undefined,
          chips: Array.isArray(data.chips) ? data.chips : undefined,
          followUps: Array.isArray(data.followUps) ? data.followUps : undefined,
        });
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Streaming not supported by this browser.');

      const decoder = new TextDecoder();
      let buffer = '';
      let currentEvent: string | null = null;

      const flushEvent = async (ev: string | null, dataLine: string) => {
        if (!dataLine.startsWith('data:')) return;
        const raw = dataLine.slice(5).trim();
        const parsed = raw ? JSON.parse(raw) : {};

        if (ev === 'delta') {
          const text = typeof parsed.text === 'string' ? parsed.text : '';
          if (!text) return;
          setMessages((curr) =>
            curr.map((m) => (m.id === assistantId ? { ...m, content: (m.content || '') + text } : m))
          );
          return;
        }

        if (ev === 'final') {
          applyAssistantPatch({
            content: typeof parsed.reply === 'string' ? parsed.reply : '',
            projects: Array.isArray(parsed.projects) ? parsed.projects : undefined,
            resources: Array.isArray(parsed.resources) ? parsed.resources : undefined,
            blogs: Array.isArray(parsed.blogs) ? parsed.blogs : undefined,
            chips: Array.isArray(parsed.chips) ? parsed.chips : undefined,
            followUps: Array.isArray(parsed.followUps) ? parsed.followUps : undefined,
          });
          return;
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx;
        while ((idx = buffer.indexOf('\n\n')) !== -1) {
          const chunk = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);

          const lines = chunk.split(/\n/).map((l) => l.trimEnd());
          currentEvent = null;
          for (const line of lines) {
            if (line.startsWith('event:')) currentEvent = line.slice(6).trim();
            if (line.startsWith('data:')) await flushEvent(currentEvent, line);
          }
        }
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      if (assistantId) {
        setMessages((curr) =>
          curr.map((m) =>
            m.id === assistantId
              ? { ...m, content: 'Sorry, I had trouble connecting. You can retry.' }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    void sendPrompt(input);
  };

  const clearConversation = () => {
    setMessages([]);
    setInput('');
    setHasStarted(false);
    setLastUserText(null);
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

  const practiceItems = [
    'AI product design and MVP delivery',
    'Design systems and interface architecture',
    'Frontend build work for teams that need execution, not just direction',
  ];

  return (
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
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2, ease } }}
            className={
              useDocumentScrollIntro
                ? 'px-4 pt-4 sm:pt-6 pb-16 relative z-20'
                : introMode === 'chat'
                ? 'flex-1 flex flex-col px-4 pb-4 relative z-20 overflow-hidden'
                : 'flex-1 overflow-y-auto px-4 pb-6 relative z-20 pt-24 sm:pt-28'
            }
          >
            <div className={introMode === 'chat' ? 'flex-1 flex flex-col w-full max-w-[1100px] mx-auto items-center text-center' : 'w-full max-w-[1100px] mx-auto flex flex-col items-center text-center'}>

              {/* ── Chat View ── */}
              {introMode === 'chat' && (
                <div className="flex-1 w-full flex flex-col items-center justify-center text-center py-8">
                  <motion.div
                    className="w-full max-w-[700px] px-2 py-2 md:px-4 md:py-3"
                    variants={heroContainer}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div variants={heroItem} className="section-kicker justify-center">
                      AI Chat
                    </motion.div>
                    <motion.h1 variants={heroItem} className="mt-5 text-3xl md:text-4xl font-medium leading-[1.02] tracking-[-0.03em] text-foreground/95">
                      Ask anything.<br />Get a real answer.
                    </motion.h1>
                    <motion.p variants={heroItem} className="mx-auto mt-4 max-w-[48ch] text-sm leading-[1.8] text-muted-foreground/88">
                      Ask about projects, process, tech stack, availability, or how I approach AI builds. The AI has full context on the work.
                    </motion.p>

                    <motion.form
                      variants={heroItem}
                      onSubmit={handleSubmit}
                      className="relative mt-8 flex w-full max-w-[680px] items-center gap-2 border border-border/80 bg-background px-2"
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
                        onFocus={() => setShowSuggestions(true)}
                        onBlur={() => setShowSuggestions(false)}
                        ref={inputRef}
                        placeholder="Ask me about my projects, skills, or experience..."
                        className="w-full bg-transparent py-3.5 pl-4 pr-14 text-base outline-none transition-all placeholder:text-muted-foreground/55 placeholder:font-normal md:py-4 md:pl-5"
                        disabled={isLoading}
                      />
                      <div className="absolute inset-y-0 right-2 flex items-center gap-1">
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
                            <Send size={20} />
                          </button>
                        )}
                      </div>
                    </motion.form>

                    <motion.div
                      variants={heroItem}
                      aria-hidden={!showSuggestions}
                      className={[
                        'mt-4 overflow-hidden transition-all duration-200 ease-out',
                        showSuggestions
                          ? 'max-h-28 opacity-100 translate-y-0'
                          : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none',
                      ].join(' ')}
                    >
                      <div className="flex flex-wrap justify-center gap-2">
                        {[
                          'What projects have you shipped?',
                          'How do you approach AI product builds?',
                          'Are you available right now?',
                        ].map((suggestion) => (
                          <button
                            key={suggestion}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              fillInput(suggestion);
                            }}
                            className="border border-border/80 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/35 hover:text-foreground"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    </motion.div>

                    <motion.div variants={heroItem} className="mt-6 flex flex-col items-center gap-3">
                      <div className="h-px w-14 bg-border/45" />
                      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground/82">
                        <span>Prefer browsing?</span>
                        <a href="/projects" className="hover:text-foreground transition-colors">Work</a>
                        <a href="/about" className="hover:text-foreground transition-colors">About</a>
                        <a href="/contact" className="hover:text-foreground transition-colors">Contact</a>
                      </div>
                    </motion.div>
                  </motion.div>
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
                      I design &amp; build products with AI, for humans.
                    </motion.h1>
                    <motion.p
                      variants={heroItem}
                      className="mx-auto mt-5 max-w-[60ch] text-sm leading-[1.8] text-muted-foreground/88"
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
                        className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground/70 transition-colors hover:text-foreground"
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


                  {/* Footer for standalone mode */}
                  {!globalSiteNav && (
                    <footer className="w-full border-t border-border/40 mt-12 pt-6 pb-4 text-xs text-muted-foreground/60">
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
            className="flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-36 scroll-smooth"
          >
            <div className={`max-w-[720px] mx-auto space-y-6 ${globalSiteNav ? 'pt-6' : 'pt-20'}`}>
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    variants={messageEnter}
                    initial="hidden"
                    animate="visible"
                    className={`flex flex-col gap-4 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex gap-3 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      {msg.role === 'assistant' && (
                        <div className="mt-1 shrink-0 flex items-start justify-center">
                          <img src="/images/ns26/logo26w-gradient.svg" alt="NS" className="w-5 h-5 object-contain opacity-90" />
                        </div>
                      )}

                      <div
                        className={`relative group ${
                          msg.role === 'user'
                            ? 'max-w-[78%] bg-muted/[0.08] px-5 py-3.5 text-foreground'
                            : 'max-w-[92%] px-0 py-0 text-foreground'
                        }`}
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
                            <p className={`whitespace-pre-wrap ${
                              msg.role === 'user'
                                ? 'leading-relaxed'
                                : 'text-[15px] leading-8 text-foreground/92'
                            }`}>
                              {msg.content}
                            </p>
                            {msg.role === 'assistant' && msg.content && (
                              <button
                                type="button"
                                onClick={() => copyToClipboard(msg.content, msg.id)}
                                className="absolute -top-1 right-0 border border-border/80 bg-background p-1.5 opacity-0 transition-all hover:border-primary/25 group-hover:opacity-100"
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

                      {msg.role === 'user' && (
                        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center border border-border/80">
                          <User size={16} className="text-foreground/75" />
                        </div>
                      )}
                    </div>

                    {msg.role === 'assistant' && msg.content.toLowerCase().includes('retry') && lastUserText && (
                      <div className="pl-12">
                        <button
                          type="button"
                          onClick={retryLast}
                          className="border border-border/80 px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground transition-colors hover:border-primary/25 hover:text-foreground"
                        >
                          Retry
                        </button>
                      </div>
                    )}

                    {msg.projects && msg.projects.length > 0 && (
                      <div className="w-full pl-12 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</span>
                          <a href="/projects" className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">View all →</a>
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
                      <div className="w-full pl-12 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</span>
                          <a href="/resources" className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">View all →</a>
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
                      <div className="w-full pl-12 pr-2 text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights</span>
                          <a href="/blog" className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors">View all →</a>
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
                      <div className="w-full pl-12 pr-2">
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

                    {msg.role === 'assistant' && msg.followUps && msg.followUps.length > 0 && (
                      <div className="w-full pl-12 pr-2 mt-3">
                        <div className="text-xs text-muted-foreground mb-2">You might also want to ask:</div>
                        <div className="flex flex-wrap gap-2">
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
              <form onSubmit={handleSubmit} className="relative flex items-center gap-2 border border-border/80 bg-background px-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  ref={inputRef}
                  placeholder="Ask me about my projects, skills, or experience..."
                  className="w-full bg-transparent py-4 md:py-4 pl-4 md:pl-5 pr-14 text-base outline-none transition-all placeholder:text-muted-foreground/55 placeholder:font-normal"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
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
                      <Send size={20} />
                    </button>
                  )}
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
