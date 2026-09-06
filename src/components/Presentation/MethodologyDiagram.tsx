import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Target, PenTool, Hammer, Send } from 'lucide-react';

interface Stage {
  name: string;
  description: string;
  icon: string;
}

interface MethodologyDiagramProps {
  stages: Stage[];
  title?: string;
}

const iconMap: Record<string, React.ComponentType<any>> = {
  search: Search,
  target: Target,
  'pen-tool': PenTool,
  hammer: Hammer,
  send: Send,
};

export const MethodologyDiagram: React.FC<MethodologyDiagramProps> = ({ stages, title }) => {
  const [currentStage, setCurrentStage] = useState(0);

  return (
    <div className="w-full">
      {title && <h2 className="type-h2 text-foreground text-center mb-8">{title}</h2>}

      <div className="flex flex-wrap items-center justify-center gap-8 mb-10">
        {stages.map((stage, index) => {
          const IconComponent = iconMap[stage.icon] || Search;
          const isActive = index <= currentStage;
          const isSelected = index === currentStage;
          
          return (
            <React.Fragment key={index}>
              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: isActive ? 1 : 0.3,
                  scale: isActive ? 1 : 0.8
                }}
                transition={{ duration: 0.4 }}
                type="button"
                onClick={() => setCurrentStage(index)}
                className="flex flex-col items-center gap-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20"
                aria-current={isSelected ? 'step' : undefined}
                aria-label={`Select stage: ${stage.name}`}
              >
                <div 
                  className={`flex h-28 w-28 items-center justify-center rounded-lg border transition-all ${
                    isActive 
                      ? 'bg-primary/10 border-primary/40' 
                      : 'bg-card/40 border-border/80'
                  }`}
                >
                  <IconComponent 
                    className={`h-12 w-12 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  />
                </div>
                <span 
                  className={`font-mono text-[11px] uppercase tracking-[0.16em] transition-colors ${
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {stage.name}
                </span>
              </motion.button>
              
              {index < stages.length - 1 && (
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: index < currentStage ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="hidden md:block h-px w-16 bg-primary/60 origin-left"
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.4 }}
          className="max-w-2xl mx-auto"
        >
          <h3 className="type-h3 text-foreground mb-3 text-center">{stages[currentStage].name}</h3>
          <p className="text-base sm:text-lg leading-[1.75] text-muted-foreground text-center">
            {stages[currentStage].description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
