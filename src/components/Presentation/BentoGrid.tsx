import React, { type ReactNode } from 'react';

interface BentoGridProps {
  layout?: '2x3' | '3x2' | '3x3' | '4x2';
  children: ReactNode;
}

export const BentoGrid: React.FC<BentoGridProps> = ({ layout = '3x2', children }) => {
  return (
    <div className={`presentation-bento presentation-bento--${layout}`}>
      {children}
    </div>
  );
};

interface BentoItemProps {
  children: ReactNode;
  className?: string;
}

export const BentoItem: React.FC<BentoItemProps> = ({ children, className = '' }) => {
  return (
    <div className={`presentation-bento__item ${className}`}>
      {children}
    </div>
  );
};
