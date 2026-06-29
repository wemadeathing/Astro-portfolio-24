import React from 'react';
import { ExternalLink } from 'lucide-react';

interface ResourceCardProps {
  title: string;
  description: string;
  url: string;
  type: string;
  tags: string[];
  image?: string;
  siteName?: string;
}

const typeLabel = (t: string) => {
  const kind = t.toLowerCase().trim();
  if (!kind || kind === 'other') return 'Resource';
  if (kind === 'library') return 'Library';
  if (kind === 'directory') return 'Directory';
  if (kind === 'tool') return 'Tool';
  if (kind === 'article') return 'Article';
  if (kind === 'video') return 'Video';
  return kind.charAt(0).toUpperCase() + kind.slice(1);
};

export default function ResourceCard({ title, description, url, type, image, siteName }: ResourceCardProps) {
  const hostname = (() => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return 'External';
    }
  })();

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block h-full border-t border-border/80 pt-4 transition-colors hover:border-primary/30"
    >
      <div className="aspect-[16/10] w-full overflow-hidden border-y border-border/80 bg-muted/20 relative">
        {image ? (
          <img
            src={image}
            alt={title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/30 to-muted/10">
            <ExternalLink className="w-6 h-6 text-muted-foreground/30" />
          </div>
        )}
        
        <div className="absolute left-2 top-2 inline-flex items-center border border-border/80 bg-background/88 px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {typeLabel(type)}
        </div>
      </div>

      <div className="pt-4 text-left">
        <h4 className="mb-2 text-sm font-semibold text-foreground transition-colors line-clamp-1 group-hover:text-primary">
          {title}
        </h4>
        {description && (
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="flex items-center gap-1.5 border-t border-border/80 pt-3 text-[10px] text-muted-foreground/60">
          <span className="truncate">{siteName || hostname}</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
        </div>
      </div>
    </a>
  );
}
