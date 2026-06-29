import React from 'react';
import { Calendar } from 'lucide-react';

interface BlogCardProps {
  title: string;
  description: string;
  slug: string;
  pubDate: Date | string;
  tags: string[];
}

const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(dateObj);
};

export default function BlogCard({ title, description, slug, pubDate, tags }: BlogCardProps) {
  const visibleTags = tags.slice(0, 3);

  return (
    <a
      href={`/blog/${slug}`}
      className="group block h-full border-t border-border/80 pt-4 transition-colors hover:border-primary/30"
    >
      <div className="text-left">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(pubDate)}</span>
        </div>

        <h4 className="mb-2 text-sm font-semibold text-foreground transition-colors line-clamp-1 group-hover:text-primary">
          {title}
        </h4>

        {description && (
          <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{description}</p>
        )}

        <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              +{tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
