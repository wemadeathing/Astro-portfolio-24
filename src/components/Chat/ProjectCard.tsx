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
      className="group block rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/20 hover:border-border transition-all overflow-hidden h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
    >
      {/* Image Area */}
      <div className="aspect-[16/9] w-full overflow-hidden bg-muted/20 relative">
        <img
          src={image}
          alt={title}
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>

      {/* Content Area */}
      <div className="p-3 text-left">
        <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1 mb-1">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {description}
        </p>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {visibleTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center rounded-full bg-secondary/50 border border-border/30 px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
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
