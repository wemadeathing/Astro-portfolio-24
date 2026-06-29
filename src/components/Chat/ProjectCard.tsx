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
      className="group block h-full border-t border-border/80 pt-4 transition-colors hover:border-primary/30 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      <div className="aspect-[16/9] w-full overflow-hidden border-y border-border/80 bg-muted/20 relative">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      <div className="pt-4 text-left">
        <h4 className="mb-2 text-sm font-semibold text-foreground transition-colors line-clamp-1 group-hover:text-primary">
          {title}
        </h4>
        <p className="mb-3 text-xs text-muted-foreground line-clamp-2">
          {description}
        </p>

        <div className="flex items-center gap-x-2 gap-y-1.5 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
          {tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground font-medium">
              +{tags.length - 2}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
