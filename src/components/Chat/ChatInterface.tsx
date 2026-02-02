import React, { useEffect, useRef, useState } from 'react';
import { Bot, Check, Copy, Menu, RotateCcw, Send, StopCircle, User, X } from 'lucide-react';
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
}

export default function ChatInterface({ latestPost }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [introMounted, setIntroMounted] = useState(false);
  const [bentoMounted, setBentoMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [lastUserText, setLastUserText] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const menuPanelRef = useRef<HTMLDivElement>(null);
  const menuCloseButtonRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<Element | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Typewriter Effect State (Removed)
  // const [text, setText] = useState('');
  // const [isDeleting, setIsDeleting] = useState(false);
  // const [loopNum, setLoopNum] = useState(0);
  // const [typingSpeed, setTypingSpeed] = useState(150);

  // const roles = ["Product Designer", "Visual Designer", "Rapid Prototyper", "AI Design Specialist"];

  // useEffect(() => {
    // const handleType = () => {
      // const i = loopNum % roles.length;
      // const fullText = roles[i];

      // setText(isDeleting 
        // ? fullText.substring(0, text.length - 1) 
        // ? fullText.substring(0, text.length + 1)
      // );

      // setTypingSpeed(isDeleting ? 30 : 150);

      // if (!isDeleting && text === fullText) {
        // setTimeout(() => setIsDeleting(true), 2000);
      // } else if (isDeleting && text === '') {
        // setIsDeleting(false);
        // setLoopNum(loopNum + 1);
      // }
    // };

    // const timer = setTimeout(handleType, typingSpeed);
    // return () => clearTimeout(timer);
  // }, [text, isDeleting, loopNum, roles, typingSpeed]);

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
      // restore focus to whatever opened the menu
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

  // Scroll detection for nav background
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setIsScrolled(container.scrollTop > 20);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasStarted]); // Re-bind when chat starts (and container renders)

  // Show onboarding tooltip after a delay (only on first visit)
  useEffect(() => {
    const hasSeenTooltip = sessionStorage.getItem('chat-tooltip-seen');
    if (hasSeenTooltip || hasStarted) return;

    const timer = setTimeout(() => {
      setShowTooltip(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, [hasStarted]);

  // Auto-dismiss tooltip so it doesn't linger and block content.
  useEffect(() => {
    if (!showTooltip) return;

    const timer = setTimeout(() => {
      dismissTooltip();
    }, 2600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showTooltip]);

  // Ensure tooltip disappears once chat starts.
  useEffect(() => {
    if (!hasStarted) return;
    if (!showTooltip) return;
    dismissTooltip();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted]);

  const dismissTooltip = () => {
    setShowTooltip(false);
    sessionStorage.setItem('chat-tooltip-seen', 'true');
  };


  const scrollToBottom = () => {
    const scroll = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };
    scroll();
    // Double-tap scroll to handle any layout shifts (cards/images loading)
    setTimeout(scroll, 100);
    setTimeout(scroll, 300);
  };

  const fillInput = (text: string) => {
    setInput(text);
    // Focus + move cursor to end on next paint
    requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      const end = el.value.length;
      try {
        el.setSelectionRange(end, end);
      } catch {
        // ignore (some input types don't support selection)
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

    // Snapshot history including this new user message.
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

      // Create a placeholder assistant message so we can stream into it.
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

        // Process complete SSE events separated by blank line.
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
      if (e?.name === 'AbortError') {
        // Keep whatever has streamed so far.
        return;
      }
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
    setIsIntro(true);
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
  const retryLast = () => {
    if (!lastUserText) return;
    startChatWithPrompt(lastUserText);
  };

  // Subtle staged intro animation: top block first, then bento.
  useEffect(() => {
    if (!isIntro) {
      setIntroMounted(false);
      setBentoMounted(false);
      return;
    }

    let t: number | undefined;
    let raf = 0;

    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduce) {
      setIntroMounted(true);
      setBentoMounted(true);
      return;
    }

    // Next paint: reveal top section.
    raf = window.requestAnimationFrame(() => setIntroMounted(true));
    // Shortly after: reveal bento section.
    t = window.setTimeout(() => setBentoMounted(true), 180);

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (t) window.clearTimeout(t);
    };
  }, [isIntro]);

  const menuLinks = [
    { title: 'Work', description: 'Browse featured case studies', href: '/projects' },
    { title: 'About', description: 'Background and approach', href: '/about' },
    { title: 'Insights', description: 'Writing on AI and product craft', href: '/blog' },
    { title: 'Resources', description: 'Curated tools, videos, and links', href: '/resources' },
    { title: 'Contact', description: 'Send a message or start a project', href: '/contact' },
  ] as const;

  const typingMessageId =
    isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant'
      ? messages[messages.length - 1].id
      : null;

  const tileBase =
    'group relative overflow-hidden rounded-2xl border border-border/60 bg-card/60 text-foreground transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(0,0,0,0.25)] hover:bg-card/75 hover:border-border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 focus-visible:ring-offset-0';

  const tileTone = (tone: 'lavender' | 'lime' | 'white' | 'dark') => {
    switch (tone) {
      case 'lavender':
        return 'bg-card/60 text-foreground';
      case 'lime':
        return 'bg-primary/15 border-primary/30 text-foreground';
      case 'white':
        return 'bg-muted/30 text-foreground';
      case 'dark':
      default:
        return "bg-card/60 text-foreground before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] before:bg-[length:3px_3px] before:opacity-20 group-hover:before:opacity-30 before:pointer-events-none";
    }
  };

  return (
    <div className="flex flex-col min-h-screen h-[100dvh] overflow-hidden bg-background text-foreground relative">
      
      {/* Background Gradient & Noise */}
      <div className="absolute inset-0 pointer-events-none -z-20">
        <div className="site-backdrop" />
      </div>
      <div className="absolute inset-0 bg-noise opacity-[0.03] -z-10 pointer-events-none" />

      {/* Top Nav */}
      <div className="fixed top-4 left-0 right-0 z-40 px-4">
        <div className="max-w-[1100px] mx-auto relative">
          <nav className={`flex items-center justify-between h-14 rounded-full px-4 backdrop-blur-xl transition-all duration-300 ${
            isScrolled 
              ? 'bg-card/80 border border-border/60' 
              : 'bg-transparent border-transparent'
          }`}>
            <a 
              href="/" 
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img 
                src="/images/ns26/logo26w-gradient.svg" 
                alt="Nasif Salaam" 
                className="h-7 sm:h-8 w-auto"
              />
            </a>

            {/* New Chat button (only show in chat mode) */}
            {!isIntro && (
              <button
                type="button"
                aria-label="New conversation"
                onClick={clearConversation}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 border border-border/60 text-foreground/80 hover:bg-muted/45 transition-colors duration-200"
                title="Start new conversation"
              >
                <RotateCcw size={16} />
              </button>
            )}

            {/* Burger */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
              aria-controls="site-menu"
              onClick={() => setIsMenuOpen(true)}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-muted/30 border border-border/60 text-foreground/80 hover:bg-muted/45 transition-colors duration-200"
            >
              <Menu size={18} />
            </button>
          </nav>
        </div>
      </div>

      {/* Menu Flyout */}
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
        <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px]" />

        <div className="absolute top-4 left-0 right-0 px-4" onClick={(e) => e.stopPropagation()}>
          <div className="max-w-[1100px] mx-auto flex justify-end">
            <div
              ref={menuPanelRef}
              className={[
                'origin-top-right rounded-2xl border border-border/60 bg-popover/92 backdrop-blur-xl shadow-2xl',
                'w-full max-w-[560px] overflow-hidden',
                'transition-all duration-300 ease-out',
                isMenuOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-[0.98]',
              ].join(' ')}
            >
              <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between">
                <div className="text-xs tracking-wide uppercase text-foreground/60">Menu</div>
                <button
                  ref={menuCloseButtonRef}
                  type="button"
                  aria-label="Close menu"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-9 h-9 rounded-full bg-muted/30 border border-border/60 text-foreground/80 flex items-center justify-center hover:bg-muted/45 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-3 md:p-4 max-h-[calc(100vh-7rem)] overflow-auto">
                <div className="grid grid-cols-1 gap-2">
                  {menuLinks.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      target={item.external ? '_blank' : undefined}
                      rel={item.external ? 'noopener noreferrer' : undefined}
                      className="group flex items-start justify-between gap-4 rounded-xl p-3 hover:bg-muted/30 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-2 w-2 h-2 rounded-full bg-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                        <div className="text-left">
                          <div className="text-foreground/92 font-medium leading-tight">{item.title}</div>
                          <div className="text-foreground/60 text-sm leading-snug">{item.description}</div>
                        </div>
                      </div>
                      <div className="shrink-0 text-foreground/40 group-hover:text-foreground/70 transition-colors">↘</div>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Intro Screen (single layout; no overlap) */}
      {isIntro && (
        <div className="flex-1 overflow-y-auto px-4 pt-24 sm:pt-28 pb-14 md:pb-20 relative z-20">
          <div className="w-full max-w-[1100px] mx-auto flex flex-col items-center text-center">
            {/* Top section (staged in first) */}
            <div
              className={[
                'w-full flex flex-col items-center text-center',
                'transition-all duration-500 ease-out will-change-transform',
                introMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
              ].join(' ')}
            >
              <h1 className="text-2xl md:text-3xl font-medium leading-tight text-foreground/95 mb-2 mt-5 md:mt-8 max-w-[680px]">
                Hi, I'm Nasif. Product Designer who builds.
              </h1>
              <p className="text-sm md:text-base text-muted-foreground/80 max-w-[680px] mb-0">
                I design brands, build products and ship apps. 15+ years designing and building solutions. My first language is design, but I also speak dev and AI.
              </p>

              {/* Input (intro) */}
              <form
                onSubmit={handleSubmit}
                className="relative mt-4 flex items-center gap-2 w-full max-w-[680px]"
              >
                {/* Onboarding tooltip */}
                {showTooltip && (
                  <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-10">
                    <div className="relative bg-primary/95 text-primary-foreground px-4 py-2 rounded-full text-sm font-medium shadow-lg whitespace-nowrap">
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
                  className="w-full bg-muted/40 border border-border/60 hover:border-border focus:border-primary/70 rounded-full py-3.5 md:py-4 pl-5 md:pl-6 pr-14 text-base outline-none transition-all shadow-sm focus:ring-4 focus:ring-primary/15 focus:bg-muted/50 placeholder:text-muted-foreground/55 placeholder:font-normal"
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                  {isLoading ? (
                    <button
                      type="button"
                      onClick={stopRequest}
                      className="p-2 mr-1 bg-muted/40 border border-border/60 text-foreground rounded-full hover:bg-muted/55 transition-all shadow-sm"
                      aria-label="Stop"
                    >
                      <StopCircle size={20} />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!input.trim() || isLoading}
                      className="p-2 mr-1 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                      aria-label="Send"
                    >
                      <Send size={20} />
                    </button>
                  )}
                </div>
              </form>

              {/* Suggestions - animate open on focus */}
              <div
                aria-hidden={!showSuggestions}
                className={[
                  'mt-3 overflow-hidden transition-all duration-200 ease-out',
                  showSuggestions
                    ? 'max-h-24 opacity-100 translate-y-0'
                    : 'max-h-0 opacity-0 -translate-y-1 pointer-events-none',
                ].join(' ')}
              >
                <div className="flex flex-wrap justify-center gap-2">
                  {[
                    'What makes you different from other designers?',
                    'Walk me through your design process',
                    'Show me your AI projects',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onMouseDown={(e) => {
                        // Prevent input blur so suggestions don't disappear before we fill.
                        e.preventDefault();
                        fillInput(suggestion);
                      }}
                      className="text-xs md:text-sm px-3 py-1.5 bg-muted/20 hover:bg-muted/35 border border-border/40 rounded-full transition-colors text-muted-foreground/90 hover:text-foreground"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bento Grid Navigation */}
            <div className="w-full mt-8 md:mt-10 pb-12">
              <div
                className={[
                  'w-full',
                  'transition-all duration-500 ease-out will-change-transform',
                  bentoMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                ].join(' ')}
              >
                <div className="max-w-[1100px] mx-auto text-left">
                  <div className="flex items-center justify-between gap-4 mb-3">
                    <div className="text-xs tracking-wide uppercase text-muted-foreground/70">Quick links</div>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>
                </div>
                {/* Bento layout: 2 rows - optimized for mobile */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 md:gap-4 max-w-[1100px] mx-auto auto-rows-[160px] sm:auto-rows-[160px] md:auto-rows-[180px]">
                  {/* Row 1: large grey + 2 logo tiles */}
                  <a
                    href="/projects"
                    className={[
                      tileBase,
                      'col-span-1 sm:col-span-2 md:col-span-6 p-5 md:p-6 text-left bg-secondary/30',
                    ].join(' ')}
                  >
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-xs opacity-70 mb-2">Projects • Case Studies</div>
                      <div className="text-lg md:text-xl font-medium leading-snug tracking-tight max-w-[34ch]">
                        Explore selected work across design systems, AI products, and rapid prototyping
                      </div>
                      <div className="absolute bottom-5 right-5 text-lg opacity-70 group-hover:opacity-100 transition-opacity">↘</div>
                    </div>
                  </a>

                <a
                  href="/about"
                  className={[
                    tileBase,
                    'bg-black bg-cover bg-center relative text-white',
                    'border-0 hover:border-0 ring-1 ring-inset ring-white/10 hover:ring-white/20',
                    'col-span-1 md:col-span-3 p-0 text-left min-h-[160px]',
                  ].join(' ')}
                  style={{ backgroundImage: "url('/images/abstract/Frame%20120823.png')" }}
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
                  <div className="relative z-10 h-full">
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-sm font-semibold text-white/95 backdrop-blur">
                      About <span className="text-white/70">↘</span>
                    </div>
                  </div>
                </a>

                <a
                  href="/blog"
                  className={[
                    tileBase,
                    'bg-black bg-cover bg-center relative text-white',
                    'border-0 hover:border-0 ring-1 ring-inset ring-white/10 hover:ring-white/20',
                    'col-span-1 md:col-span-3 p-0 text-left min-h-[160px]',
                  ].join(' ')}
                  style={{ backgroundImage: "url('/images/abstract/Frame%20120827.png')" }}
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
                  <div className="relative z-10 h-full">
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-sm font-semibold text-white/95 backdrop-blur">
                      Insights <span className="text-white/70">↘</span>
                    </div>
                  </div>
                </a>

                {/* Row 2: Builds tile + Contact tile + Latest Insight */}
                <a
                  href="/projects?tag=Builds"
                  className={[
                    tileBase,
                    'bg-black bg-cover bg-center relative text-white',
                    'border-0 hover:border-0 ring-1 ring-inset ring-white/10 hover:ring-white/20',
                    'col-span-1 md:col-span-3 p-0 text-left min-h-[160px]',
                  ].join(' ')}
                  style={{ backgroundImage: "url('/images/abstract/Frame%20120825.png')" }}
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
                  <div className="relative z-10 h-full">
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-sm font-semibold text-white/95 backdrop-blur">
                      Builds <span className="text-white/70">↘</span>
                    </div>
                  </div>
                </a>

                <a
                  href="/contact"
                  className={[
                    tileBase,
                    'bg-black bg-cover bg-center relative text-white',
                    'border-0 hover:border-0 ring-1 ring-inset ring-white/10 hover:ring-white/20',
                    'col-span-1 md:col-span-3 p-0 text-left min-h-[160px]',
                  ].join(' ')}
                  style={{ backgroundImage: "url('/images/abstract/Frame%20120826.png')" }}
                >
                  <div className="absolute inset-0 bg-black/40 transition-colors group-hover:bg-black/30" />
                  <div className="relative z-10 h-full">
                    <div className="absolute bottom-2 left-2 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/55 px-2.5 py-1 text-sm font-semibold text-white/95 backdrop-blur">
                      Contact <span className="text-white/70">↘</span>
                    </div>
                  </div>
                </a>

                {latestPost ? (
                  <a
                    href={`/blog/${latestPost.slug}`}
                    className={[tileBase, 'col-span-1 sm:col-span-2 md:col-span-6 p-5 md:p-6 text-left bg-secondary/30'].join(' ')}
                  >
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-xs opacity-70 mb-2">Latest Insight</div>
                      <div className="text-lg md:text-xl font-medium leading-snug tracking-tight max-w-[36ch]">
                        {latestPost.data.title}
                      </div>
                      <div className="text-sm opacity-60 mt-2 max-w-[42ch] line-clamp-2">
                        {latestPost.data.description}
                      </div>
                      <div className="absolute bottom-5 right-5 text-lg opacity-70 group-hover:opacity-100 transition-opacity">↘</div>
                    </div>
                  </a>
                ) : (
                  <a
                    href="/about"
                    className={[tileBase, 'col-span-1 sm:col-span-2 md:col-span-6 p-5 md:p-6 text-left bg-secondary/30'].join(' ')}
                  >
                    <div className="relative z-10 h-full flex flex-col">
                      <div className="text-xs opacity-70 mb-2">Resume • Experience</div>
                      <div className="text-lg md:text-xl font-medium leading-snug tracking-tight max-w-[36ch]">
                        A quick scan of roles, skills, and outcomes across 15+ years
                      </div>
                      <div className="absolute bottom-5 right-5 text-lg opacity-70 group-hover:opacity-100 transition-opacity">↘</div>
                    </div>
                  </a>
                )}
              </div>
            </div>
            </div>

            {/* Browse traditionally link */}
            <div className="mt-6 text-center">
              <a
                href="/projects"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
              >
                <span>Or browse my work traditionally</span>
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14"/>
                  <path d="m12 5 7 7-7 7"/>
                </svg>
              </a>
            </div>

            {/* Simple Footer (Intro Only) */}
            <footer className="w-full border-t border-border/40 mt-8 pt-6 pb-4 text-xs text-muted-foreground/60">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>© {new Date().getFullYear()} Nasif Salaam</div>
                <div className="flex gap-4">
                  <a href="https://github.com/wemadeathing" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    GitHub
                  </a>
                  <a href="https://www.linkedin.com/in/nasifsalaam/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                    LinkedIn
                  </a>
                </div>
              </div>
            </footer>
          </div>
        </div>
      )}

      {/* Chat Area */}
      {!isIntro && (
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto p-4 md:p-8 transition-all duration-500 opacity-100 scroll-smooth"
        >
          <div className="max-w-[720px] mx-auto space-y-6 pt-20">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-4 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div className={`flex gap-4 max-w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Bot size={18} className="text-primary" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] rounded-2xl px-6 py-4 relative group ${
                      msg.role === 'user'
                        ? 'bg-primary/10 border border-primary/20 text-foreground'
                        : 'bg-muted/50 border border-border text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.id === typingMessageId && !msg.content ? (
                      <div className="flex items-center gap-2" role="status" aria-live="polite">
                        <span className="sr-only">Assistant is typing a response...</span>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" aria-hidden="true" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75" aria-hidden="true" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150" aria-hidden="true" />
                      </div>
                    ) : (
                      <>
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                        {msg.role === 'assistant' && msg.content && (
                          <button
                            type="button"
                            onClick={() => copyToClipboard(msg.content, msg.id)}
                            className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border border-border/60 opacity-0 group-hover:opacity-100 hover:bg-background transition-all"
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
                    <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0">
                      <User size={18} className="text-primary" />
                    </div>
                  )}
                </div>

                {msg.role === 'assistant' && msg.content.toLowerCase().includes('retry') && lastUserText && (
                  <div className="pl-12">
                    <button
                      type="button"
                      onClick={retryLast}
                      className="text-xs px-3 py-1.5 rounded-full border border-border/50 bg-muted/20 hover:bg-muted/35 transition-colors text-muted-foreground hover:text-foreground"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* Render Project Cards if present */}
                {msg.projects && msg.projects.length > 0 && (
                  <div className="w-full pl-12 pr-2">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="text-xs tracking-wide uppercase text-muted-foreground">Projects</div>
                      <a
                        href="/projects"
                        className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        View all →
                      </a>
                    </div>
                    <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {msg.projects.map((project) => (
                        <div
                          key={project.slug}
                          className="min-w-[240px] sm:min-w-[260px] md:min-w-[300px] snap-start"
                        >
                          <ProjectCard {...project} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render resource cards when present */}
                {msg.role === 'assistant' && msg.resources && msg.resources.length > 0 && (
                  <div className="w-full pl-12 pr-2 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Resources
                      </span>
                      <a
                        href="/resources"
                        className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        View all →
                      </a>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {msg.resources.map((resource) => (
                        <div
                          key={resource.url}
                          className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] snap-start"
                        >
                          <ResourceCard {...resource} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render blog cards when present */}
                {msg.role === 'assistant' && msg.blogs && msg.blogs.length > 0 && (
                  <div className="w-full pl-12 pr-2 mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Insights
                      </span>
                      <a
                        href="/blog"
                        className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        View all →
                      </a>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {msg.blogs.map((blog) => (
                        <div
                          key={blog.slug}
                          className="min-w-[200px] sm:min-w-[220px] md:min-w-[240px] snap-start"
                        >
                          <BlogCard {...blog} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render chips (links) when present */}
                {msg.role === 'assistant' && msg.chips && msg.chips.length > 0 && (
                  <div className="w-full pl-12 pr-2">
                    <div className="flex flex-wrap gap-2">
                      {msg.chips.map((chip) => (
                        <a
                          key={`${chip.label}-${chip.href}`}
                          href={chip.href}
                          className="text-xs md:text-sm px-3 py-1.5 bg-muted/20 hover:bg-muted/35 border border-border/40 rounded-full transition-colors text-muted-foreground hover:text-foreground"
                        >
                          {chip.label}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render follow-up suggestions when present */}
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
                              inputRef.current?.parentElement?.querySelector('button[type="submit"]')?.click();
                            }, 100);
                          }}
                          className="text-xs md:text-sm px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded-full transition-colors text-foreground/90 hover:text-foreground"
                        >
                          {followUp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}

      {/* Input Area (chat mode only) */}
      {!isIntro && (
        <div className="p-4 md:p-6 bg-background/80 backdrop-blur-md border-t border-border z-30">
          <div className="max-w-[720px] mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                ref={inputRef}
                placeholder="Ask me about my projects, skills, or experience..."
                className="w-full bg-muted/50 border border-border/60 hover:border-border focus:border-primary/70 rounded-full py-3 md:py-4 pl-5 md:pl-6 pr-14 text-base md:text-lg outline-none transition-all shadow-sm focus:ring-4 focus:ring-primary/15 placeholder:text-muted-foreground/55 placeholder:font-normal"
                disabled={isLoading}
              />
              <div className="absolute inset-y-0 right-2 flex items-center gap-1">
                {isLoading ? (
                  <button
                    type="button"
                    onClick={stopRequest}
                    className="p-2 bg-muted/40 border border-border/60 text-foreground rounded-full hover:bg-muted/55 transition-all"
                    aria-label="Stop"
                  >
                    <StopCircle size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Send"
                  >
                    <Send size={20} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
