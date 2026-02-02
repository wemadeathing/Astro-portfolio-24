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
      className="group block rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-border transition-all overflow-hidden h-full"
    >
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 mb-2">
          <Calendar className="w-3 h-3" />
          <span>{formatDate(pubDate)}</span>
        </div>

        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {title}
        </h4>

        {description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{description}</p>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary/50 border border-border/30 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
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
