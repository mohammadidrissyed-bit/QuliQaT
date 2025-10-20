
import React, { useEffect, useRef } from 'react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  // FIX: Made children prop optional to resolve TypeScript error.
  children?: React.ReactNode;
}

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

export function Sidebar({ isOpen, onClose, children }: SidebarProps) {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden'; // Prevent background scroll
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } transition-colors`}
        aria-hidden="true"
      />

      {/* Sidebar Panel */}
      <div
        ref={sidebarRef}
        className={`fixed top-0 left-0 h-full w-full max-w-xs z-50 bg-slate-50 dark:bg-slate-950 shadow-xl transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-colors`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                <h2 id="sidebar-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Menu</h2>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70"
                    aria-label="Close menu"
                >
                    <CloseIcon />
                </button>
            </div>
            <div className="flex-grow overflow-y-auto p-4">
                {children}
            </div>
        </div>
      </div>
    </>
  );
}