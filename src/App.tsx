import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CHAPTERS, TTS_VOICES, TTSVoice } from './constants';
import type { Standard, ChatSession, ChatMessage, TopicContent, ActiveContentView, Subject, UnitTest } from './types';
import { getChapterTopics, getTopicContent, getVisualPrompt, startChatSession, continueChatStream, getMCQsForTopic, getUnitTestForChapter, getRealWorldExampleForTopic, generateSpeechFromScript } from './services/geminiService';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ChatBox } from './components/ChatBox';
import { ChapterDropdown } from './components/ChapterDropdown';
import { TopicList } from './components/TopicList';
import { ContentDisplay } from './components/ContentDisplay';
import { CourseSelector } from './components/CourseSelector';
import { SelectedCoursePanel } from './components/SelectedCoursePanel';
import { Sidebar } from './components/Sidebar';
import { ErrorMessage } from './components/ErrorMessage';
import { GeneratedContentSkeleton } from './components/LoadingSpinner';
import { UnitTestCard } from './components/GeneratedContent';
import { IntroAnimation } from './components/IntroAnimation';

type Theme = 'light' | 'oled';

// State that will be persisted to localStorage
interface PersistentState {
  subject: Subject | null;
  standard: Standard | null;
  isCourseSelected: boolean;
  selectedChapter: string | null;
  selectedTopic: string | null;
  topics: Record<string, string[]>;
  content: Record<string, TopicContent>;
  activeView: Record<string, ActiveContentView>;
  noMoreTopics: Record<string, boolean>;
}

interface LoadingState<T> {
    isLoading: boolean;
    data?: T;
    error?: string;
}

const APP_STATE_KEY = 'quliqatAppState';

// Function to load state from local storage
const loadPersistentState = (): PersistentState => {
  try {
    const savedState = localStorage.getItem(APP_STATE_KEY);
    if (savedState) {
      // Basic validation to ensure the loaded state has the expected keys
      const parsed = JSON.parse(savedState);
      if (parsed.content && parsed.activeView) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Failed to parse persistent state from localStorage", error);
    localStorage.removeItem(APP_STATE_KEY); // Clear corrupted state
  }
  // Return default state if nothing is saved or if parsing fails
  return {
    subject: null,
    standard: null,
    isCourseSelected: false,
    selectedChapter: null,
    selectedTopic: null,
    topics: {},
    content: {},
    activeView: {},
    noMoreTopics: {},
  };
};

function App(): React.ReactNode {
  // --- STATE MANAGEMENT ---
  
  const [persistentState, setPersistentState] = useState<PersistentState>(loadPersistentState);
  const { subject, standard, isCourseSelected, selectedChapter, selectedTopic, topics, content, activeView, noMoreTopics } = persistentState;
  
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    // Default to 'light' unless 'oled' is explicitly saved
    return savedTheme === 'oled' ? 'oled' : 'light';
  });
  
  // State for the new intro animation sequence
  const [introPhase, setIntroPhase] = useState<'start' | 'fly' | 'fade' | 'hidden'>('start');

  const [isTopicsLoading, setIsTopicsLoading] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [isChatReady, setIsChatReady] = useState<boolean>(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const actionsAreaRef = useRef<HTMLDivElement>(null);
  const generatedContentAreaRef = useRef<HTMLDivElement>(null);

  // New state for chapter-level views
  const [chapterContentView, setChapterContentView] = useState<'topics' | 'unitTest'>('topics');
  const [chapterUnitTest, setChapterUnitTest] = useState<LoadingState<UnitTest>>({ isLoading: false });


  // --- EFFECTS ---
  
  // Effect for handling the intro animation sequence
  useEffect(() => {
    // Phase 1: Start 'fly' animation after 2 seconds
    const flyTimer = setTimeout(() => {
      setIntroPhase('fly');
    }, 2000);

    // Phase 2: 'fly' animation takes 1s. Just before it ends (at 2.9s total),
    // start the cross-fade between the animated logo and the real header logo.
    const fadeTimer = setTimeout(() => {
      setIntroPhase('fade');
    }, 2900);

    // Phase 3: After the fades complete (at 3.5s total), remove the intro component.
    const hideTimer = setTimeout(() => {
      setIntroPhase('hidden');
    }, 3500);

    return () => {
      clearTimeout(flyTimer);
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []); // Run only on mount

  useEffect(() => {
    try {
      // Create a deep copy to avoid mutating the original state that the UI is using.
      const stateToPersist = JSON.parse(JSON.stringify(persistentState));
      
      // Before saving, iterate through all generated content and remove the large
      // base64 audio data to prevent exceeding the localStorage quota.
      for (const topicKey in stateToPersist.content) {
        const topicContent = stateToPersist.content[topicKey];
        if (topicContent?.explanationAudio?.data) {
          // The other metadata will be saved, but the audio itself
          // will be cleared. It will be regenerated on demand when the user needs it.
          delete topicContent.explanationAudio.data;
        }
      }
      
      localStorage.setItem(APP_STATE_KEY, JSON.stringify(stateToPersist));
    } catch (error)
 {
      console.error("Failed to save state to localStorage", error);
      // If a quota error happens, it's a good practice to try to recover.
      // Here, we'll log a warning and clear the corrupted/oversized state.
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
          console.warn('LocalStorage quota exceeded. Clearing persisted state to recover.');
          localStorage.removeItem(APP_STATE_KEY);
      }
    }
  }, [persistentState]);
  
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'read-mode', 'oled-mode'); // Clear all theme classes
    if (theme === 'oled') {
      root.classList.add('dark'); // For Tailwind's dark: variants to work
      root.classList.add('oled-mode'); // For pitch-black overrides
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  useEffect(() => {
    if (isCourseSelected && standard && subject) {
      const newChatSession = startChatSession(standard, subject, selectedChapter || undefined);
      setChatSession(newChatSession);

      const welcomeMessage = selectedChapter
        ? `Great! Let's focus on "${selectedChapter}". Select a topic, or ask me a specific question.`
        : `I'm your AI study buddy! Ask me anything about the ${subject} syllabus for ${standard}, or select a chapter to begin.`;
      
      setChatHistory([{ role: 'model', parts: welcomeMessage }]);
      setIsChatReady(true);
    } else {
      setIsChatReady(false);
      setChatHistory([]);
      setChatSession(null);
    }
  }, [isCourseSelected, standard, subject, selectedChapter]);


  // --- HANDLERS & LOGIC ---
  const scrollToActions = () => {
    setTimeout(() => {
      const element = actionsAreaRef.current;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.focus({ preventScroll: true });
      }
    }, 100);
  };
  
  const scrollToGeneratedContent = () => {
    setTimeout(() => {
      const element = generatedContentAreaRef.current;
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.focus({ preventScroll: true });
      }
    }, 100);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'oled' : 'light'));
  };

  const fetchTopics = useCallback(async (chapter: string) => {
    if (isTopicsLoading[chapter] || !standard || !subject) return;

    setIsTopicsLoading(prev => ({ ...prev, [chapter]: true }));
    setError(null);

    try {
      const newTopics = await getChapterTopics(chapter, standard, subject, topics[chapter]);
      if (newTopics.length === 0) {
        setPersistentState(prev => ({ ...prev, noMoreTopics: {...prev.noMoreTopics, [chapter]: true } }));
      } else {
        setPersistentState(prev => ({ ...prev, topics: {...prev.topics, [chapter]: [...(prev.topics[chapter] || []), ...newTopics]} }));
      }
    } catch (err) {
      if (err instanceof Error) setError(err.message);
      else setError('An unexpected error occurred.');
    } finally {
      setIsTopicsLoading(prev => ({ ...prev, [chapter]: false }));
    }
  }, [standard, subject, topics, isTopicsLoading]);

  const handleChapterSelect = (chapter: string) => {
    if (selectedChapter === chapter || !standard || !subject) return;
    
    setPersistentState(prev => ({ ...prev, selectedChapter: chapter, selectedTopic: null }));
    setChapterContentView('topics'); // Reset to topic view
    setChapterUnitTest({ isLoading: false }); // Clear old test
    
    if (!topics[chapter]) fetchTopics(chapter);
  };

  const handleGenerateAnswer = async (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'answer'}}));
    scrollToGeneratedContent();
    if (content[topic]?.answer?.data || content[topic]?.answer?.isLoading) return;

    setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic] || { question: topic }), answer: { isLoading: true } } } }));
    try {
      const answer = await getTopicContent(topic, selectedChapter!, standard!, subject!);
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), answer: { isLoading: false, data: answer } } } }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), answer: { isLoading: false, error } } } }));
    }
  }

  const handleGenerateExplanationAudio = async (topic: string) => {
    const currentExplanation = content[topic]?.answer?.data;
    if (!currentExplanation) {
      console.warn("Explanation must be generated before creating audio.");
      return;
    }
    
    if (content[topic]?.explanationAudio?.data || content[topic]?.explanationAudio?.isLoading) return;

    setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), explanationAudio: { isLoading: true } } } }));

    try {
        const audioB64 = await generateSpeechFromScript(currentExplanation, 'Kore');
        setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), explanationAudio: { isLoading: false, data: audioB64 } } } }));
    } catch (err) {
        const error = err instanceof Error ? err.message : 'Unknown error generating audio.';
        setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), explanationAudio: { isLoading: false, error } } } }));
    }
  };

  const handleGenerateRealWorldExample = async (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'realWorldExample'}}));
    scrollToGeneratedContent();
    if (content[topic]?.realWorldExample?.data || content[topic]?.realWorldExample?.isLoading) return;

    setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic] || { question: topic }), realWorldExample: { isLoading: true } } } }));
    try {
      const example = await getRealWorldExampleForTopic(topic, subject!, standard!, selectedChapter!);
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), realWorldExample: { isLoading: false, data: example } } } }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), realWorldExample: { isLoading: false, error } } } }));
    }
  };

  const handleGenerateChapterUnitTest = async () => {
      if (!selectedChapter || !standard || !subject) return;

      setIsMenuOpen(false); // Close sidebar on action
      setChapterContentView('unitTest');
      setChapterUnitTest({ isLoading: true });
      setError(null);

      // Scroll to the main content area to show loading
      const mainContent = document.querySelector('main');
      mainContent?.scrollIntoView({ behavior: 'smooth', block: 'start' });

      try {
          const test = await getUnitTestForChapter(selectedChapter, subject, standard);
          setChapterUnitTest({ isLoading: false, data: test });
      } catch (err) {
          const errorMsg = err instanceof Error ? err.message : 'Failed to generate the unit test.';
          setChapterUnitTest({ isLoading: false, error: errorMsg });
          setError(errorMsg); // Set main error to display it prominently
      }
  };

  const handleGenerateVisualPrompt = async (topic: string) => {
    setPersistentState(prev => ({ ...prev, activeView: { ...prev.activeView, [topic]: 'visualize' } }));
    scrollToGeneratedContent();
    if (content[topic]?.visualPrompt?.data || content[topic]?.visualPrompt?.isLoading) return;

    setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic] || { question: topic }), visualPrompt: { isLoading: true } } } }));
    try {
      const prompt = await getVisualPrompt(topic, subject!);
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), visualPrompt: { isLoading: false, data: prompt } } } }));
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Unknown error';
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), visualPrompt: { isLoading: false, error } } } }));
    }
  };
  
  const handleGenerateMCQs = async (topic: string) => {
    setPersistentState(prev => ({...prev, activeView: {...prev.activeView, [topic]: 'mcqs'}}));
    scrollToGeneratedContent();
    if (content[topic]?.mcqs?.data || content[topic]?.mcqs?.isLoading) return;
    
    setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic] || { question: topic }), mcqs: { isLoading: true } } } }));
    try {
      const mcqs = await getMCQsForTopic(topic, subject!);
      setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), mcqs: { isLoading: false, data: mcqs } } } }));
    } catch (err) {
       const error = err instanceof Error ? err.message : 'Unknown error';
       setPersistentState(prev => ({ ...prev, content: { ...prev.content, [topic]: { ...(prev.content[topic]!), mcqs: { isLoading: false, error } } } }));
    }
  }

  const handleTopicSelect = (topic: string) => {
      setChapterContentView('topics'); // Ensure we are in topic view
      setPersistentState(prev => ({ ...prev, selectedTopic: topic }));
      scrollToActions();
      setIsMenuOpen(false);
  }
  
  const handleSendMessage = async (message: string) => {
    if (!chatSession || isChatLoading || !message.trim()) return;

    setIsChatLoading(true);
    const userMessage: ChatMessage = { role: 'user', parts: message };
    setChatHistory(prev => [...prev, userMessage, { role: 'model', parts: '' }]);

    try {
        const stream = await continueChatStream(chatSession, message);
        for await (const chunk of stream) {
            const chunkText = chunk.text;
            if (chunkText) {
                setChatHistory(prev => {
                    const newHistory = [...prev];
                    const lastMessage = newHistory[newHistory.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.parts += chunkText;
                    }
                    return newHistory;
                });
            }
        }
    } catch (err) {
        const errorText = err instanceof Error ? `Sorry, an error occurred: ${err.message}` : "Sorry, I couldn't get a response.";
        setChatHistory(prev => {
             const newHistory = [...prev];
             newHistory[newHistory.length - 1] = { role: 'model', parts: errorText };
             return newHistory;
        });
    } finally {
        setIsChatLoading(false);
    }
  };

  const resetStateForNewSelection = () => {
    localStorage.removeItem(APP_STATE_KEY);
    // Directly reset state instead of reloading, for a smoother UX
    setPersistentState({
        subject: null,
        standard: null,
        isCourseSelected: false,
        selectedChapter: null,
        selectedTopic: null,
        topics: {},
        content: {},
        activeView: {},
        noMoreTopics: {},
    });
    setError(null);
    setChatSession(null);
    setChatHistory([]);
    setIsChatReady(false);
  };

  const handleCourseSelect = (newSubject: Subject, newStandard: Standard) => {
    setPersistentState(prev => ({ ...prev, subject: newSubject, standard: newStandard, isCourseSelected: true }));
  };

  const currentChapters = (subject && standard && CHAPTERS[subject]?.[standard]) || [];

  return (
    <>
      {introPhase !== 'hidden' && <IntroAnimation phase={introPhase} />}

      <div className={`
        h-screen flex flex-col font-sans 
        bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 
        transition-opacity duration-1000 transition-colors duration-300
        ${introPhase === 'start' ? 'opacity-0' : 'opacity-100'}
      `}>
        <Header 
          theme={theme} 
          onToggleTheme={toggleTheme} 
          onOpenMenu={() => setIsMenuOpen(true)}
          logoVisible={introPhase === 'fade' || introPhase === 'hidden'}
        />

        <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)}>
          <div className="flex flex-col gap-6">
            {!isCourseSelected ? (
              <CourseSelector 
                onSelectCourse={handleCourseSelect}
                isLoading={Object.values(isTopicsLoading).some(Boolean)}
              />
            ) : (
              subject && standard && (
                <>
                  <SelectedCoursePanel 
                    subject={subject}
                    standard={standard}
                    onChangeCourse={resetStateForNewSelection}
                  />
                  <ChapterDropdown
                      chapters={currentChapters}
                      selectedChapter={selectedChapter}
                      onSelectChapter={handleChapterSelect}
                      isLoading={Object.values(isTopicsLoading).some(Boolean)}
                  />
                  <TopicList
                      selectedChapter={selectedChapter}
                      topics={topics[selectedChapter || ''] || []}
                      selectedTopic={selectedTopic}
                      onSelectTopic={handleTopicSelect}
                      isLoading={isTopicsLoading[selectedChapter || ''] || false}
                      noMoreTopics={noMoreTopics[selectedChapter || ''] || false}
                      onLoadMore={() => selectedChapter && fetchTopics(selectedChapter)}
                  />
                  {selectedChapter && (
                    <div className="mt-4 animate-fade-in">
                      <h3 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider mb-2">
                        Tools
                      </h3>
                      <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                        <button
                          onClick={handleGenerateChapterUnitTest}
                          disabled={chapterUnitTest.isLoading}
                          className="w-full flex items-center justify-center gap-2 text-sm font-semibold p-2 bg-slate-100 dark:bg-slate-800 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-wait"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 01-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 14l9-5-9-5-9 5 9 5zm0 0v6" /></svg>
                          {chapterUnitTest.isLoading ? 'Generating Test...' : 'Unit Test for Chapter'}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            )}
          </div>
        </Sidebar>
        
        <div className="flex-grow overflow-y-auto flex flex-col">
          <main className="w-full container mx-auto p-4 md:p-6 lg:p-8 flex-grow">
            {chapterContentView === 'unitTest' ? (
                <section className="min-w-0">
                    {chapterUnitTest.isLoading && <GeneratedContentSkeleton />}
                    {chapterUnitTest.error && <ErrorMessage message={chapterUnitTest.error} />}
                    {chapterUnitTest.data && selectedChapter && (
                        <div className="animate-fade-in space-y-6">
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                                  Unit Test: <span className="text-blue-600 dark:text-blue-400">{selectedChapter}</span>
                            </h2>
                            <UnitTestCard title="" unitTest={chapterUnitTest.data} />
                        </div>
                    )}
                </section>
            ) : (
              <section className="min-w-0">
                  <ContentDisplay
                  error={error}
                  selectedTopic={selectedTopic}
                  isCourseSelected={isCourseSelected}
                  content={content[selectedTopic || '']}
                  activeView={activeView[selectedTopic || '']}
                  onGenerateAnswer={handleGenerateAnswer}
                  onGenerateVisualPrompt={handleGenerateVisualPrompt}
                  onGenerateMCQs={handleGenerateMCQs}
                  onGenerateRealWorldExample={handleGenerateRealWorldExample}
                  onGenerateExplanationAudio={handleGenerateExplanationAudio}
                  actionsAreaRef={actionsAreaRef}
                  generatedContentAreaRef={generatedContentAreaRef}
                  />
              </section>
            )}
          </main>
          
          <Footer selectedStandard={standard} />
        </div>
        
        {isChatReady && (
            <ChatBox 
                key={`${subject}-${standard}-${selectedChapter || 'general'}-chat`}
                chatHistory={chatHistory} 
                isLoading={isChatLoading} 
                onSendMessage={handleSendMessage} 
            />
        )}
      </div>
    </>
  );
}

export default App;