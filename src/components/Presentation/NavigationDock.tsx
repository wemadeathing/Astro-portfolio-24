import React, { useEffect, useMemo, useState } from 'react';
import { Briefcase, Grid, Home, Mail, User } from 'lucide-react';

declare global {
  interface Window {
    navigateToSlide?: (slideIndex: number) => void;
    Reveal?: { slide: (indexh: number) => void };
  }
}

export const NavigationDock: React.FC = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [showProjectsMenu, setShowProjectsMenu] = useState(false);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'n' || e.key === 'N') {
        setIsVisible(!isVisible);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isVisible]);

  const navigate = (slideIndex: number) => {
    if (typeof window.navigateToSlide === 'function') {
      window.navigateToSlide(slideIndex);
      return;
    }
    if (window.Reveal?.slide) {
      window.Reveal.slide(slideIndex);
    }
  };

  const sections = useMemo(
    () => [
      { name: 'Home', icon: Home, slide: 0 },
      { name: 'Intro', icon: User, slide: 1 },
      { name: 'Projects', icon: Briefcase, slide: 4, hasSubmenu: true },
      { name: 'More', icon: Grid, slide: 17 },
      { name: 'Contact', icon: Mail, slide: 20 },
    ],
    []
  );

  const projects = useMemo(
    () => [
      { name: 'Banking suite (cross‑platform)', slide: 4 },
      { name: 'Design system', slide: 8 },
      { name: 'Rapid innovation projects', slide: 12 },
    ],
    []
  );

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transition-all duration-300">
      <div className="relative">
        <div className="flex items-center gap-1 rounded-full border border-border/60 bg-card/80 px-2 py-2 backdrop-blur-xl">
          {sections.map((section) => (
            <div key={section.name} className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (section.hasSubmenu) {
                    setShowProjectsMenu(true);
                    return;
                  }
                  navigate(section.slide);
                  setShowProjectsMenu(false);
                }}
                className="inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted/30 hover:text-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                title={section.name}
              >
                <section.icon className="h-4 w-4 text-foreground/70" />
                <span className="hidden sm:inline">{section.name}</span>
              </button>

              {section.hasSubmenu && showProjectsMenu && (
                <div className="absolute bottom-full left-0 mb-2 w-[220px] overflow-hidden rounded-2xl border border-border/60 bg-popover/92 shadow-2xl backdrop-blur-xl">
                  <div className="px-3 py-2 text-xs tracking-[0.22em] uppercase text-foreground/50">
                    Projects
                  </div>
                  <div className="p-2 pt-0">
                    {projects.map((project) => (
                      <button
                        key={project.name}
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate(project.slide);
                          setShowProjectsMenu(false);
                        }}
                        className="w-full rounded-xl px-3 py-2 text-left text-sm text-foreground/80 transition-colors hover:bg-muted/30 hover:text-foreground focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
