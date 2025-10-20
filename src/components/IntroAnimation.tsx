import React from 'react';
import { Logo } from './Logo';

interface IntroAnimationProps {
  phase: 'start' | 'fly' | 'fade' | 'hidden';
}

export function IntroAnimation({ phase }: IntroAnimationProps): React.ReactNode {
  const isStart = phase === 'start';

  return (
    <div
      className={`
        fixed inset-0 z-[100]
        transition-opacity duration-500 ease-in-out
        ${phase === 'fade' || phase === 'hidden' ? 'opacity-0 pointer-events-none' : 'opacity-100'}
        ${phase === 'hidden' ? 'hidden' : ''}
      `}
      aria-hidden="true"
    >
      {/* Background overlay, fades out first */}
      <div
        className={`
          absolute inset-0 bg-slate-50 dark:bg-slate-950
          transition-opacity duration-500 ease-in-out
          ${isStart ? 'opacity-100' : 'opacity-0'}
        `}
      />

      {/* The Logo container that moves and scales */}
      <div
        className={`
          absolute left-1/2 -translate-x-1/2 
          transition-all duration-1000 ease-in-out
          ${isStart ? 'top-1/2 -translate-y-1/2 scale-100' : 'top-8 -translate-y-1/2 scale-50'}
        `}
      >
        <div className={isStart ? 'animate-pulse-fade-in' : ''}>
          <Logo size="lg" layout="vertical" />
        </div>
      </div>
    </div>
  );
}
