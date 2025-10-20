
import React, { useState, useEffect } from 'react';
import type { Standard } from '../types';
import { STANDARDS } from '../constants';
import { Logo } from './Logo';

// --- IMPORTANT ---
// 1. Go to formspree.io and create a new form.
// 2. Paste your unique Formspree endpoint URL here.
const FORMSPREE_ENDPOINT_URL = 'https://formspree.io/f/movnonkd';
// -----------------

const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

interface FeedbackModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialStandard: Standard | null;
}

type SubmissionStatus = 'idle' | 'submitting' | 'success' | 'error';

const FeedbackModal = ({ isOpen, onClose, initialStandard }: FeedbackModalProps) => {
    const [name, setName] = useState('');
    const [studentClass, setStudentClass] = useState<Standard>(initialStandard || STANDARDS[0]);
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<SubmissionStatus>('idle');

    useEffect(() => {
        setStudentClass(initialStandard || STANDARDS[0]);
        if (isOpen) {
            // Reset form when modal is opened
            setStatus('idle');
            setName('');
            setMessage('');
        }
    }, [initialStandard, isOpen]);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        setStatus('submitting');
        try {
            const response = await fetch(FORMSPREE_ENDPOINT_URL, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json' 
                },
                body: JSON.stringify({ name, class: studentClass, message }),
            });

            if (response.ok) {
                setStatus('success');
                setTimeout(() => {
                   onClose();
                }, 2500);
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error('Feedback submission error:', error);
            setStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
        >
            <div 
                className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg m-4 border border-slate-200 dark:border-slate-800 animate-fade-in transition-colors duration-300"
                onClick={e => e.stopPropagation()}
            >
                {status === 'success' ? (
                    <div className="text-center p-10">
                        <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mt-4">Thank You!</h2>
                        <p className="text-slate-500 dark:text-slate-400 mt-2">Your feedback has been submitted successfully.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="flex justify-between items-center p-4 border-b border-slate-200 dark:border-slate-800">
                            <h2 id="feedback-title" className="text-lg font-semibold text-slate-800 dark:text-slate-100">Share Your Feedback</h2>
                            <button type="button" onClick={onClose} className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800" aria-label="Close feedback form">
                                <CloseIcon />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Name</label>
                                    <input type="text" id="name" value={name} onChange={e => setName(e.target.value)} required disabled={status === 'submitting'} className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 disabled:opacity-50" />
                                </div>
                                <div>
                                    <label htmlFor="studentClass" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Your Class</label>
                                    <select id="studentClass" value={studentClass} onChange={e => setStudentClass(e.target.value as Standard)} disabled={status === 'submitting'} className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 disabled:opacity-50">
                                        {STANDARDS.map(std => <option key={std} value={std}>{std}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Feedback</label>
                                <textarea id="message" value={message} onChange={e => setMessage(e.target.value)} required rows={4} disabled={status === 'submitting'} className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-y disabled:opacity-50" placeholder="Tell us what you think..."></textarea>
                            </div>
                             {status === 'error' && (
                                <p className="text-sm text-red-600 dark:text-red-400">Sorry, something went wrong. Please try again.</p>
                             )}
                        </div>

                        <div className="flex justify-end p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-800 rounded-b-lg">
                            <button type="submit" className="py-2 px-5 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-wait w-28" disabled={!name.trim() || !message.trim() || status === 'submitting'}>
                                {status === 'submitting' ? 'Submitting...' : 'Submit'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

interface FooterProps {
  selectedStandard: Standard | null;
}

export function Footer({ selectedStandard }: FooterProps): React.ReactNode {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <footer className="bg-transparent mt-4 py-8">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="text-center text-slate-500 dark:text-slate-400 text-xs space-y-2">
            <div className="flex items-center justify-center gap-1 text-sm">
              <span>&copy; {new Date().getFullYear()}</span>
              <Logo size="sm" layout="horizontal" />
              <span>. All Rights Reserved.</span>
            </div>
            <p>
              Developed by <strong>Syed Mohammed Idris</strong> and tested by saleemuddin(PCMB) Falcon Institute Mysore Road Branch. | <button onClick={() => setIsModalOpen(true)} className="font-semibold text-blue-600 dark:text-blue-400 hover:underline">Share Feedback</button>
            </p>
        </div>
      </div>
      <FeedbackModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialStandard={selectedStandard}
      />
    </footer>
  );
}