import React, { useEffect, useRef, useState } from 'react';
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

export default function ChatInterface({ latestPost, projects = [], globalSiteNav = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [hasStarted, setHasStarted] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [introMounted, setIntroMounted] = useState(false);

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
  /** With Layout nav + footer, avoid nested scroll: let the document scroll instead of an inner overflow pane. */
  const useDocumentScrollIntro = Boolean(globalSiteNav && isIntro && introMode === 'portfolio');
  const retryLast = () => {
    if (!lastUserText) return;
    startChatWithPrompt(lastUserText);
  };

  // Subtle staged intro animation: top block first, then bento.
  useEffect(() => {
    if (!isIntro) {
      setIntroMounted(false);
      return;
    }

    let raf = 0;

    const prefersReduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduce) {
      setIntroMounted(true);
      return;
    }

    raf = window.requestAnimationFrame(() => setIntroMounted(true));

    return () => {
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [isIntro]);

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
      
      {/* Background Gradient & Noise */}
      {!globalSiteNav && (
        <div className="absolute inset-0 pointer-events-none -z-20">
          <div className="site-backdrop" />
        </div>
      )}
      <div className="absolute inset-0 bg-noise opacity-[0.03] -z-10 pointer-events-none" />

      {!globalSiteNav && (
        <>
          {/* Top Nav */}
          <div className="fixed top-4 left-0 right-0 z-40 px-4">
            <div className="max-w-[1100px] mx-auto relative">
              <nav
                className={`flex items-center justify-between h-14 rounded-full px-4 backdrop-blur-xl transition-all duration-300 ${
                  isScrolled ? 'bg-card/80 border border-border/60' : 'bg-transparent border-transparent'
                }`}
              >
                <a href="/" className="flex items-center hover:opacity-80 transition-opacity">
                  <img src="/images/ns26/logo26w-gradient.svg" alt="Nasif Salaam" className="h-7 sm:h-8 w-auto" />
                </a>

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
        </>
      )}

      {/* Intro Screen */}
      {isIntro && (
        <div
          className={
            useDocumentScrollIntro
              ? 'px-4 pt-4 sm:pt-6 pb-6 relative z-20'
              : introMode === 'chat'
              ? 'flex-1 px-4 pt-18 sm:pt-22 pb-4 relative z-20 overflow-hidden'
              : 'flex-1 overflow-y-auto px-4 pb-6 relative z-20 pt-24 sm:pt-28'
          }
        >
          <div className="w-full max-w-[1100px] mx-auto flex flex-col items-center text-center">
            {/* Content area with crossfade */}
            <div className="w-full relative">
              {/* Chat View Content */}
              {introMode === 'chat' && (
              <div
                className="w-full min-h-[calc(100dvh-8.75rem)] flex flex-col items-center justify-start text-center animate-[fadeSlideUp_0.35s_ease-out_both] pt-[15vh] md:pt-[17vh] pb-4"
              >
                <div
                  className={[
                    'w-full max-w-[700px] px-2 py-2 transition-all duration-500 ease-out will-change-transform md:px-4 md:py-3',
                    introMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2',
                  ].join(' ')}
                >
                <div className="inline-flex items-center px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                  AI Chat
                </div>
                <h1 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight tracking-[-0.03em] text-foreground/95">
                  Ask about the work, the systems, or how I build.
                </h1>
                <p className="text-base md:text-lg text-muted-foreground/80 max-w-[720px] mt-5 mx-auto leading-[1.7]">
                  Product designer and AI builder with 15+ years across brand, product, systems, and implementation.
                </p>

                {/* Input (intro) */}
                <form
                  onSubmit={handleSubmit}
                  className="relative mt-8 flex items-center gap-2 w-full max-w-[680px] mx-auto"
                >
                  {/* Onboarding tooltip */}
                  {showTooltip && (
                    <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 z-10">
                      <div className="relative bg-primary/92 text-primary-foreground px-4 py-2 rounded-2xl text-sm font-medium shadow-lg whitespace-nowrap">
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
                    className="w-full bg-black/20 border border-white/[0.08] hover:border-white/[0.14] focus:border-primary/40 rounded-full py-3.5 md:py-4 pl-5 md:pl-6 pr-14 text-base outline-none transition-all shadow-sm focus:ring-4 focus:ring-primary/10 focus:bg-black/25 placeholder:text-muted-foreground/55 placeholder:font-normal"
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
                    'mt-4 overflow-hidden transition-all duration-200 ease-out',
                    showSuggestions
                      ? 'max-h-28 opacity-100 translate-y-0'
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
                          e.preventDefault();
                          fillInput(suggestion);
                        }}
                        className="text-xs md:text-sm px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] rounded-full transition-colors text-muted-foreground/85 hover:text-foreground"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="h-px w-14 bg-border/45" />
                  <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground/68">
                    <span>Prefer browsing?</span>
                    <a href="/projects" className="hover:text-foreground transition-colors">
                      Work
                    </a>
                    <a href="/about" className="hover:text-foreground transition-colors">
                      About
                    </a>
                    <a href="/contact" className="hover:text-foreground transition-colors">
                      Contact
                    </a>
                  </div>
                </div>
                </div>
              </div>
              )}

              {/* Portfolio View Content */}
              {introMode === 'portfolio' && (
              <div
                className="w-full flex flex-col items-center animate-[fadeSlideUp_0.35s_ease-out_both]"
              >
                <div className="w-full max-w-[700px] text-center">
                  <div className="inline-flex items-center px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/75">
                    Product Designer + AI Builder
                  </div>
                  <h1 className="mt-6 text-3xl md:text-4xl lg:text-5xl font-medium leading-tight tracking-[-0.03em] text-foreground/95">
                    Product design, AI work, and digital experiences with a clear point of view.
                  </h1>
                  <p className="text-base md:text-lg text-muted-foreground/80 max-w-[720px] mt-5 mx-auto leading-[1.7]">
                    Rooted in graphic design and shaped by years in digital product, I work across interface design, systems, and AI-assisted product building.
                  </p>
                </div>

                {/* Projects Grid */}
                <div className="w-full mt-12 md:mt-14 text-left">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-xs tracking-wide uppercase text-muted-foreground/70">Selected Work</div>
                    <div className="h-px flex-1 bg-border/60" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                    {projects.map((project, i) => (
                      <a
                        key={project.slug}
                        href={`/projects/${project.slug}`}
                        className={[
                          'group block rounded-[22px] border border-border/35 bg-card/32 overflow-hidden transition-colors hover:bg-card/42 hover:border-border/55 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20',
                          introMode === 'portfolio' ? 'animate-[fadeSlideUp_0.4s_ease-out_both]' : '',
                        ].join(' ')}
                        style={introMode === 'portfolio' ? { animationDelay: `${i * 60}ms` } : undefined}
                      >
                        <div className="aspect-video overflow-hidden bg-muted/14 relative">
                          <img
                            src={project.image}
                            alt={project.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                        </div>
                        <div className="p-5 text-left">
                          <h2 className="text-base sm:text-lg font-semibold text-foreground/92 group-hover:text-primary transition-colors line-clamp-1">
                            {project.title}
                          </h2>
                          <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                            {project.description}
                          </p>
                          <div className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted-foreground/60">
                            {project.tags.slice(0, 2).join(' • ')}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                <div className="w-full max-w-[760px] mt-12 md:mt-14 text-center">
                  <p className="text-sm md:text-base leading-[1.8] text-muted-foreground/80">
                    The thread across these projects is thoughtful design with enough technical range to move ideas into working products, clearer systems, and stronger digital presence.
                  </p>
                </div>
              </div>
              )}
            </div>

            {/* Footer */}
            {!globalSiteNav && (
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
            )}
          </div>
        </div>
      )}

      {/* Chat Area */}
      {!isIntro && (
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 pt-4 pb-28 md:px-8 md:pt-8 md:pb-36 transition-all duration-500 opacity-100 scroll-smooth"
        >
          <div className={`max-w-[720px] mx-auto space-y-6 ${globalSiteNav ? 'pt-6' : 'pt-20'}`}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col gap-4 ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
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
                        ? 'max-w-[78%] rounded-[18px] border border-border/70 bg-muted/18 px-5 py-3.5 text-foreground shadow-[0_10px_30px_rgba(0,0,0,0.12)]'
                        : 'max-w-[92%] px-0 py-0 text-foreground'
                    }`}
                  >
                    {msg.role === 'assistant' && msg.id === typingMessageId && !msg.content ? (
                      <div className="flex items-center gap-2 px-1 py-2" role="status" aria-live="polite">
                        <span className="sr-only">Assistant is typing a response...</span>
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce" aria-hidden="true" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-75" aria-hidden="true" />
                        <div className="w-2 h-2 bg-foreground/50 rounded-full animate-bounce delay-150" aria-hidden="true" />
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
                            className="absolute -top-1 right-0 p-1.5 rounded-md bg-background/80 border border-border/60 opacity-0 group-hover:opacity-100 hover:bg-background transition-all"
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
                    <div className="mt-1 w-7 h-7 rounded-full bg-muted/25 border border-border/60 flex items-center justify-center shrink-0">
                      <User size={16} className="text-foreground/75" />
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
                  <div className="w-full pl-12 pr-2 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Projects</span>
                      <a
                        href="/projects"
                        className="text-xs text-muted-foreground/80 hover:text-foreground transition-colors"
                      >
                        View all →
                      </a>
                    </div>
                    <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory">
                      {msg.projects.map((project) => (
                        <div
                          key={project.slug}
                          className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start"
                        >
                          <ProjectCard {...project} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render resource cards when present */}
                {msg.role === 'assistant' && msg.resources && msg.resources.length > 0 && (
                  <div className="w-full pl-12 pr-2 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Resources</span>
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
                          className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start"
                        >
                          <ResourceCard {...resource} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Render blog cards when present */}
                {msg.role === 'assistant' && msg.blogs && msg.blogs.length > 0 && (
                  <div className="w-full pl-12 pr-2 text-left">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Insights</span>
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
                          className="min-w-[220px] sm:min-w-[240px] md:min-w-[260px] snap-start"
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
                              inputRef.current?.parentElement?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click();
                            }, 100);
                          }}
                          className="inline-flex items-center text-xs md:text-sm px-3 py-1.5 bg-secondary/70 hover:bg-secondary rounded-full transition-colors text-foreground/90 hover:text-foreground"
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
        <div className="sticky bottom-0 z-30 mt-4 border-t border-border/60 bg-background/96 px-4 pb-4 pt-4 backdrop-blur-xl md:px-6 md:pb-6 md:pt-5">
          <div className="max-w-[720px] mx-auto">
            <form onSubmit={handleSubmit} className="relative flex items-center gap-2 rounded-[28px] border border-border/65 bg-muted/14 px-2 shadow-[0_14px_40px_rgba(0,0,0,0.18)]">
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
                    className="p-2 bg-muted/30 border border-border/50 text-foreground rounded-full hover:bg-muted/45 transition-all"
                    aria-label="Stop"
                  >
                    <StopCircle size={20} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim() || isLoading}
                    className="p-2 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
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
