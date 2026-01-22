import React from 'react';

export const HeroSlide: React.FC = () => {
  return (
    <div className="presentation-slide presentation-slide--full" style={{ background: '#000000' }}>
      <div className="flex items-center justify-center w-full h-full">
        <img
          src="/ns-logo.png"
          alt="NS Logo"
          className="w-28 h-auto opacity-90"
          style={{
            animation: 'loaderSpin 900ms linear infinite',
            transformOrigin: 'center'
          }}
        />
      </div>
    </div>
  );
};
