import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
}

export default function ProjectCard({ title, description, image, tags, slug }: ProjectCardProps) {
  const visibleTags = tags.slice(0, 2);

  return (
    <a
      href={`/projects/${slug}`}
      className="group block h-full border border-border/80 transition-colors hover:border-primary/35 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      {/* Image */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted/20">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col p-4">
        <h4 className="text-sm font-semibold text-foreground transition-colors line-clamp-2 leading-snug group-hover:text-primary">
          {title}
        </h4>
        <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Footer */}
        <div className="mt-3 flex items-center gap-x-2 border-t border-border/60 pt-3">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="font-mono text-xs uppercase tracking-[0.12em] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="font-mono text-xs text-muted-foreground">+{tags.length - 2}</span>
          )}
          <svg
            className="ml-auto h-3 w-3 -translate-x-1 text-primary opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
          >
            <path d="M7 17L17 7" /><path d="M7 7h10v10" />
          </svg>
        </div>
      </div>
    </a>
  );
}
