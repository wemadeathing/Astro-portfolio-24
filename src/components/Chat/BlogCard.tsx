import React from 'react';

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
  const visibleTags = tags.slice(0, 2);

  return (
    <a
      href={`/blog/${slug}`}
      className="group flex h-full flex-col rounded-lg border border-border/80 transition-colors hover:border-primary/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-foreground transition-colors line-clamp-2 leading-snug group-hover:text-primary">
            {title}
          </h4>
          {description && (
            <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2 leading-relaxed">{description}</p>
          )}
        </div>

        <div className="mt-3 flex items-center gap-x-2 border-t border-border/60 pt-3">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="min-w-0 flex-1 truncate text-xs text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="shrink-0 text-xs text-muted-foreground">+{tags.length - 2}</span>
          )}
          <span className="ml-auto shrink-0 font-mono text-xs text-muted-foreground">
            {formatDate(pubDate)}
          </span>
        </div>
      </div>
    </a>
  );
}
