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
      className="group block rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-border transition-all overflow-hidden h-full"
    >
      {/* Image */}
      <div className="aspect-[16/10] w-full overflow-hidden bg-muted/20 relative">
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
        
        {/* Type Badge */}
        <div className="absolute left-2 top-2 inline-flex items-center rounded-full bg-black/60 backdrop-blur-md border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-white/70">
          {typeLabel(type)}
        </div>
      </div>

      <div className="p-3">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
          {title}
        </h4>
        {description && (
          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
          <span className="truncate">{siteName || hostname}</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
        </div>
      </div>
    </a>
  );
}
