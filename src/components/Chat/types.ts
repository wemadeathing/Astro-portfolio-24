// Shared shapes for the chat UI. Extracted from ChatInterface.tsx, which had
// grown past 1600 lines with its types, constants, animation config and two
// sub-components all inlined above the component itself.
import type { IntakeState } from './IntakeCard';
import type { ToolTraceItem } from './ToolTrace';

export interface ProjectData {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
}

export interface ResourceData {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
  image?: string;
  siteName?: string;
}

export interface BlogData {
  title: string;
  description: string;
  slug: string;
  pubDate: string;
  tags: string[];
}

export interface Message {
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
  /** True while a model call is in flight with no answer text yet — drives
   *  the "Thinking…" row. These models all reason before answering, and that
   *  silence is otherwise indistinguishable from the app having hung. */
  thinking?: boolean;
  projects?: ProjectData[];
  resources?: ResourceData[];
  blogs?: BlogData[];
  chips?: { label: string; href: string; kind?: string }[];
  followUps?: string[];
  intake?: IntakeState;
}

export interface LatestPostData {
  slug: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
  };
}

export interface ChatInterfaceProps {
  latestPost?: LatestPostData;
  projects?: ProjectData[];
  /** When true, Layout provides Navbar + backdrop; skip duplicate chrome here. */
  globalSiteNav?: boolean;
  /** Overrides the `?view=` URL param — use for a page dedicated to one mode. */
  forceView?: 'chat' | 'portfolio';
  /** Calendly (or similar) booking link, offered as an escape hatch from the intake flow. */
  calendlyUrl?: string;
}

// Web Speech API isn't in the standard lib.dom types yet, so this is typed loosely.
export type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
