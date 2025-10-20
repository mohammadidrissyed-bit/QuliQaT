import React from 'react';
import { Logo } from './Logo';

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
);

const OledIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

const HamburgerIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);


interface HeaderProps {
    theme: 'light' | 'oled';
    onToggleTheme: () => void;
    onOpenMenu: () => void;
    logoVisible: boolean;
}

export function Header({ 
    theme, onToggleTheme, onOpenMenu, logoVisible
}: HeaderProps): React.ReactNode {

  const themeButtonConfig = {
    light: { icon: <OledIcon />, label: "Switch to pitch black mode" },
    oled: { icon: <SunIcon />, label: "Switch to light mode" },
  };

  const { icon, label } = themeButtonConfig[theme];

  return (
    <header className="bg-white dark:bg-gray-900/80 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex-1 flex justify-start">
            <button
                onClick={onOpenMenu}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500 transition-colors"
                aria-label="Open menu"
            >
                <HamburgerIcon />
            </button>
          </div>

          <div className={`
            flex items-center justify-center
            transition-opacity duration-500 ease-in-out
            ${logoVisible ? 'opacity-100' : 'opacity-0'}
          `}>
            <Logo size="md" layout="horizontal" />
          </div>
          
          <div className="flex-1 flex justify-end">
            <button
                onClick={onToggleTheme}
                className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500 transition-colors"
                aria-label={label}
            >
                {icon}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
