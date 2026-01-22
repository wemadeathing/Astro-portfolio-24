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
      {title && <h2 className="type-h2 text-white/90 text-center mb-8">{title}</h2>}

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
                className="flex flex-col items-center gap-4 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/20 rounded-2xl"
                aria-current={isSelected ? 'step' : undefined}
                aria-label={`Select stage: ${stage.name}`}
              >
                <div 
                  className={`w-28 h-28 rounded-full flex items-center justify-center transition-all ${
                    isActive 
                      ? 'bg-primary/10 border border-primary/40' 
                      : 'bg-white/[0.03] border border-white/10'
                  }`}
                >
                  <IconComponent 
                    className={`w-12 h-12 ${isActive ? 'text-primary' : 'text-white/40'}`}
                  />
                </div>
                <span 
                  className={`text-sm font-semibold transition-colors ${
                    isActive ? 'text-white/90' : 'text-white/40'
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
          <h3 className="type-h3 text-white/92 mb-3 text-center">{stages[currentStage].name}</h3>
          <p className="text-base sm:text-lg leading-[1.75] text-white/70 text-center">
            {stages[currentStage].description}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
