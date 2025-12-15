import React from 'react';

interface ProjectCardProps {
  title: string;
  description: string;
  image: string;
  tags: string[];
  slug: string;
}

export default function ProjectCard({ title, description, image, tags, slug }: ProjectCardProps) {
  // Show only 2 tags to keep it simple/small
  const visibleTags = tags.slice(0, 2);

  return (
    <a
      href={`/projects/${slug}`}
      className="group block h-full w-full focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded-xl"
    >
      <div className="h-full overflow-hidden rounded-xl border bg-card text-card-foreground shadow transition-colors hover:bg-accent/5">
        {/* Image Area */}
        <div className="aspect-[16/9] overflow-hidden border-b border-border/50">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        </div>
        
        {/* Content Area */}
        <div className="p-4">
          <h3 className="font-semibold leading-none tracking-tight mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
            {description}
          </p>
          
          {/* Footer/Tags */}
          <div className="flex items-center gap-2">
            {visibleTags.map((tag) => (
              <span 
                key={tag} 
                className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors border-transparent bg-secondary text-secondary-foreground"
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
      </div>
    </a>
  );
}
