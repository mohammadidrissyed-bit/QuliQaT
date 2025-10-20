

import React from 'react';
import type { TopicContent, ActiveContentView, Subject } from '../types';
import { ErrorMessage } from './ErrorMessage';
import { AnswerCard, VisualizationCard, QuizCard, UnitTestCard } from './GeneratedContent';
import { Logo } from './Logo';
import { GeneratedContentSkeleton } from './LoadingSpinner';

interface ContentDisplayProps {
  error: string | null;
  selectedTopic: string | null;
  isCourseSelected: boolean;
  content: TopicContent | undefined;
  activeView: ActiveContentView | undefined;
  onGenerateAnswer: (topic: string) => void;
  onGenerateVisualPrompt: (topic: string) => void;
  onGenerateMCQs: (topic: string) => void;
  onGenerateRealWorldExample: (topic: string) => void;
  onGenerateExplanationAudio: (topic: string) => void;
  actionsAreaRef: React.RefObject<HTMLDivElement>;
  generatedContentAreaRef: React.RefObject<HTMLDivElement>;
}

const WelcomeMessage = () => (
    <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-lg flex flex-col items-center justify-center h-full animate-fade-in transition-colors duration-300">
        <Logo size="lg" layout="vertical" className="mb-4" />
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Select a course from the menu to begin your interactive learning journey.</p>
    </div>
);

const ChapterPrompt = () => (
    <div className="text-center p-8 bg-white dark:bg-slate-900 rounded-lg flex flex-col items-center justify-center h-full animate-fade-in transition-colors duration-300">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Ready to Dive In?</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">Choose a topic from the menu to start generating study materials.</p>
    </div>
);

const ActionButton = ({ icon, text, onClick, isLoading }: { icon: React.ReactNode, text: string, onClick: () => void, isLoading: boolean }) => (
    <button
        onClick={onClick}
        disabled={isLoading}
        className="relative flex flex-col items-center justify-center text-center p-4 bg-white dark:bg-slate-900 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
    >
        <div className="text-blue-600 dark:text-blue-400 mb-2">{icon}</div>
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text}</span>
        {isLoading && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex justify-center items-center rounded-lg"><div className="w-6 h-6 border-2 border-t-blue-500 rounded-full animate-spin"></div></div>}
    </button>
);

export function ContentDisplay({ 
    error, selectedTopic, isCourseSelected, content, activeView, onGenerateAnswer, onGenerateVisualPrompt, onGenerateMCQs, onGenerateRealWorldExample, onGenerateExplanationAudio, actionsAreaRef, generatedContentAreaRef
}: ContentDisplayProps): React.ReactNode {

  if (error) {
    return <ErrorMessage message={error} />;
  }

  if (!isCourseSelected) {
    return <WelcomeMessage />;
  }
  
  if (!selectedTopic) {
    return <ChapterPrompt />;
  }
  
  return (
    <div key={selectedTopic} className="space-y-8 animate-fade-in">
      <div>
        <p className="text-md text-blue-600 dark:text-blue-400 font-medium mb-1">Selected Topic</p>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{selectedTopic}</h2>
      </div>

      <div 
        ref={actionsAreaRef}
        tabIndex={-1}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 scroll-mt-20 focus:outline-none"
      >
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
            text="Explanation"
            isLoading={content?.answer?.isLoading ?? false}
            onClick={() => onGenerateAnswer(selectedTopic)}
          />
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
            text="Visualize"
            isLoading={content?.visualPrompt?.isLoading ?? false}
            onClick={() => onGenerateVisualPrompt(selectedTopic)}
          />
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>}
            text="Real Example"
            isLoading={content?.realWorldExample?.isLoading ?? false}
            onClick={() => onGenerateRealWorldExample(selectedTopic)}
          />
          <ActionButton
            icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>}
            text="MCQ Quiz"
            isLoading={content?.mcqs?.isLoading ?? false}
            onClick={() => onGenerateMCQs(selectedTopic)}
          />
      </div>

      <div 
        ref={generatedContentAreaRef}
        tabIndex={-1}
        className="space-y-6 scroll-mt-20 focus:outline-none"
      >
        {activeView === 'answer' && (
            content?.answer?.isLoading ? <GeneratedContentSkeleton /> :
            content?.answer?.error ? <ErrorMessage message={content.answer.error} /> :
            content?.answer?.data ? <AnswerCard 
                title="Explanation" 
                content={content.answer.data} 
                audioState={content.explanationAudio}
                onGenerateAudio={() => onGenerateExplanationAudio(selectedTopic)}
            /> : null
        )}

        {activeView === 'visualize' && (
             content?.visualPrompt?.isLoading ? <GeneratedContentSkeleton /> :
             content?.visualPrompt?.error ? <ErrorMessage message={content.visualPrompt.error} /> :
             <VisualizationCard 
                 title="Visualize Concept" 
                 topic={selectedTopic}
                 promptState={content?.visualPrompt}
             />
        )}

        {activeView === 'realWorldExample' && (
             content?.realWorldExample?.isLoading ? <GeneratedContentSkeleton /> :
             content?.realWorldExample?.error ? <ErrorMessage message={content.realWorldExample.error} /> :
             content?.realWorldExample?.data ? <AnswerCard 
                title="Real-world Example" 
                content={content.realWorldExample.data}
                audioState={undefined}
                onGenerateAudio={() => {}}
            /> : null
        )}

        {activeView === 'mcqs' && (
            content?.mcqs?.isLoading ? <GeneratedContentSkeleton /> :
            content?.mcqs?.error ? <ErrorMessage message={content.mcqs.error} /> :
            content?.mcqs?.data ? <QuizCard title="MCQ Quiz" mcqs={content.mcqs.data} /> : null
        )}
      </div>
    </div>
  );
}