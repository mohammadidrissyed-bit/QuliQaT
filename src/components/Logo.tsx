import React from 'react';

interface LogoProps {
  layout?: 'icon' | 'vertical' | 'horizontal';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: { svg: 'w-5 h-5', text: 'text-sm' },
  md: { svg: 'w-8 h-8', text: 'text-2xl' },
  lg: { svg: 'w-16 h-16', text: 'text-4xl' },
};

const layoutClasses = {
    icon: { container: 'flex-col', text: 'hidden' },
    vertical: { container: 'flex-col items-center gap-2', text: 'block' },
    horizontal: { container: 'flex-row items-center gap-2', text: 'block' }
}

export function Logo({ layout = 'vertical', size = 'md', className = '' }: LogoProps) {
  const sClass = sizeClasses[size];
  const lClass = layoutClasses[layout];

  return (
    <div className={`flex justify-center font-sans font-bold ${lClass.container} ${className}`}>
      <svg
        className={sClass.svg}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4338CA" /> 
            <stop offset="100%" stopColor="#22D3EE" />
          </linearGradient>
        </defs>
        <path 
          fillRule="evenodd" 
          clipRule="evenodd" 
          d="M24 44C35.0457 44 44 35.0457 44 24C44 12.9543 35.0457 4 24 4C12.9543 4 4 12.9543 4 24C4 35.0457 12.9543 44 24 44ZM24 40C32.8366 40 40 32.8366 40 24C40 15.1634 32.8366 8 24 8C15.1634 8 8 15.1634 8 24C8 32.8366 15.1634 40 24 40Z" 
          fill="url(#logo-gradient)" 
        />
        <path d="M36 36L26 26" stroke="url(#logo-gradient)" strokeWidth="5" strokeLinecap="round" />
      </svg>
      <span className={`${sClass.text} ${lClass.text} tracking-tight bg-gradient-to-r from-indigo-700 to-cyan-500 dark:from-indigo-500 dark:to-cyan-400 text-transparent bg-clip-text`}>
        QuliQaT
      </span>
    </div>
  );
}
