import React, { useState, PropsWithChildren, useEffect, useRef, useCallback } from 'react';
import type { MCQ, TopicContent, UnitTest, FillInTheBlank, ShortAnswerQuestion } from '../types';
import { ErrorMessage } from './ErrorMessage';

// --- AUDIO DECODING HELPERS ---
// Decodes a base64 string into a Uint8Array.
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Converts raw PCM audio data from the Gemini API into an AudioBuffer that can be played.
async function decodeRawAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  // The raw data is 16-bit PCM, so we create a Int16Array view on the buffer.
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Normalize the 16-bit integer samples to the float range [-1.0, 1.0]
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}


// --- UI ICONS ---
const PlayIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const PauseIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> );
const LoadingIcon = () => ( <div className="w-6 h-6 border-2 border-slate-400 dark:border-slate-500 border-t-blue-500 rounded-full animate-spin"></div> );
const ClipboardIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>);
const CheckIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>);
const WhatsAppIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04C6.5 2.04 2.04 6.5 2.04 12c0 1.8 0.5 3.47 1.38 4.95L2 22l5.25-1.38c1.48 0.88 3.15 1.38 4.95 1.38 5.5 0 9.96-4.46 9.96-9.96S17.5 2.04 12 2.04zm4.83 11.43c-0.25 0.68-0.89 1.15-1.54 1.29 -0.52 0.11-1.12 0.16-3.39-0.65 -2.76-1-4.55-3.64-4.7-3.8-0.15-0.16-1.25-1.68-1.25-3.18 0-1.5 0.79-2.23 1.09-2.53s0.62-0.45 0.89-0.45 0.54 0.04 0.79 0.44c0.25 0.4 0.89 2.18 0.96 2.33 0.07 0.15 0.12 0.35-0.03 0.6 -0.15 0.25-0.28 0.45-0.53 0.65 -0.25 0.2-0.53 0.45-0.23 0.89 0.3 0.44 1.35 2.23 2.91 3.79 1.86 1.86 3.25 2.18 3.75 2.18 0.5 0 0.89-0.2 1.19-0.49 0.3-0.3 0.53-0.68 0.68-0.93s0.15-0.53 0.23-0.68c0.08-0.15 0.44-0.2 0.78-0.1s1.35 0.64 1.58 0.75 0.38 0.16 0.43 0.25 0.04 0.53-0.2 1.2z"/>
    </svg>
);

// --- REUSABLE COMPONENTS ---

const CodeBlock: React.FC<{ code: string }> = ({ code }) => {
    const [isCopied, setIsCopied] = useState(false);
    const codeContent = code.replace(/^```[a-z]*\n?/, '').replace(/```$/, '').trim();
    const handleCopy = () => {
        navigator.clipboard.writeText(codeContent);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
    };
    return (
        <div className="not-prose bg-slate-800 dark:bg-black/50 text-white rounded-lg border border-slate-700 my-4 transition-colors duration-300">
            <div className="flex justify-between items-center px-4 py-1.5 bg-slate-900/50 rounded-t-lg border-b border-slate-700 transition-colors duration-300">
                <span className="text-xs font-sans text-slate-400">Python</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                    {isCopied ? <CheckIcon /> : <ClipboardIcon />} {isCopied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="text-slate-200 p-4 text-sm overflow-x-auto font-mono whitespace-pre">
                <code>{codeContent}</code>
            </pre>
        </div>
    );
};

const GeneratedCard = ({ title, children, headerContent }: PropsWithChildren<{ title: string; headerContent?: React.ReactNode }>) => (
    <div className="bg-white dark:bg-slate-900 rounded-lg p-6 animate-fade-in transition-colors duration-300">
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
            {headerContent}
        </div>
        {children}
    </div>
);


// --- MAIN EXPORTED COMPONENTS ---

interface AnswerCardProps {
  title: string;
  content: string;
  audioState?: TopicContent['explanationAudio'];
  onGenerateAudio: () => void;
}
export const AnswerCard = ({ title, content, audioState, onGenerateAudio }: AnswerCardProps) => {
    const parts = content.split(/(```[\s\S]*?```)/g).filter(part => part.trim() !== '');
    
    type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused';
    const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
    
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const audioBufferRef = useRef<AudioBuffer | null>(null);
    
    const stopPlayback = useCallback(() => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.onended = null;
            sourceNodeRef.current.stop(0);
            sourceNodeRef.current = null;
        }
    }, []);

    useEffect(() => {
        // Main cleanup effect for unmounting or content change
        return () => {
            stopPlayback();
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                audioContextRef.current.close();
                audioContextRef.current = null;
            }
        };
    }, [content, stopPlayback]);

    useEffect(() => {
        // Effect to decode incoming audio data and prepare it for playback
        if (audioState?.isLoading) {
            setPlaybackState('loading');
        } else if (audioState?.error) {
            console.error("Audio generation error:", audioState.error);
            setPlaybackState('idle');
        } else if (audioState?.data) {
            const processAudio = async () => {
                try {
                    // Initialize or reuse the AudioContext
                    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                    }
                    const audioBytes = decode(audioState.data);
                    const decodedBuffer = await decodeRawAudioData(audioBytes, audioContextRef.current, 24000, 1);
                    audioBufferRef.current = decodedBuffer;
                    setPlaybackState('idle'); // Audio is ready to be played on user command
                } catch (e) {
                    console.error("Error processing audio data:", e);
                    setPlaybackState('idle');
                }
            };
            processAudio();
        }
    }, [audioState]);

    const handlePlayPauseClick = () => {
        const context = audioContextRef.current;

        // Handle Pause
        if (playbackState === 'playing' && context?.state === 'running') {
            context.suspend().then(() => setPlaybackState('paused'));
            return;
        }

        // Handle Resume
        if (playbackState === 'paused' && context?.state === 'suspended') {
            context.resume().then(() => setPlaybackState('playing'));
            return;
        }
        
        // Handle Play (from idle state)
        if (playbackState === 'idle') {
            if (audioBufferRef.current) {
                // If buffer is ready, play it
                if (!context || context.state === 'closed') {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const liveContext = audioContextRef.current!;
                
                if (liveContext.state === 'suspended') {
                    liveContext.resume();
                }

                stopPlayback(); // Stop any lingering previous audio

                const source = liveContext.createBufferSource();
                source.buffer = audioBufferRef.current;
                source.connect(liveContext.destination);
                source.onended = () => {
                    setPlaybackState('idle');
                    sourceNodeRef.current = null;
                };
                source.start(0);
                sourceNodeRef.current = source;
                setPlaybackState('playing');
            } else {
                // If no buffer, trigger generation. The useEffect will handle decoding.
                onGenerateAudio();
            }
        }
    };
    
    const renderMarkdown = (text: string) => {
        const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim() !== '');
        const htmlContent = paragraphs.map(p => {
            const bolded = p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return `<p>${bolded}</p>`;
        }).join('');
        return htmlContent;
    };
    
    const isAudioEnabled = title === 'Explanation';

    const renderPlayButton = () => {
      switch (playbackState) {
          case 'loading': return <LoadingIcon />;
          case 'playing': return <PauseIcon />;
          case 'paused': return <PlayIcon />;
          case 'idle': return <PlayIcon />;
      }
    };

    return (
        <GeneratedCard 
            title={title}
            headerContent={
                isAudioEnabled ? (
                    <div className="relative group">
                        <button 
                            onClick={handlePlayPauseClick}
                            disabled={playbackState === 'loading'}
                            className="p-1 rounded-full text-slate-500 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 focus-visible:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-wait"
                            aria-label={playbackState === 'playing' ? "Pause narration" : "Play narration"}
                        >
                           {renderPlayButton()}
                        </button>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max hidden group-hover:block px-2 py-1 bg-slate-800 text-white text-xs rounded-md shadow-lg">
                           First time generation may take a moment.
                        </div>
                    </div>
                ) : null
            }
        >
            <div className="prose prose-sm max-w-none prose-p:text-slate-600 dark:prose-p:text-slate-300 prose-strong:font-semibold prose-strong:text-slate-700 dark:prose-strong:text-slate-200">
                {parts.map((part, index) => {
                    if (part.startsWith('```')) {
                        return <CodeBlock key={index} code={part} />;
                    } else {
                        return <div key={index} dangerouslySetInnerHTML={{ __html: renderMarkdown(part) }} />;
                    }
                })}
            </div>
        </GeneratedCard>
    );
};

export const VisualizationCard = ({ title, topic, promptState }: { title: string; topic: string; promptState?: TopicContent['visualPrompt']; }) => {
    const [editablePrompt, setEditablePrompt] = useState(promptState?.data || '');
    const [isGeminiCopied, setIsGeminiCopied] = useState(false);

    useEffect(() => {
        setEditablePrompt(promptState?.data || '');
    }, [promptState?.data]);
    
    const handleGeminiClick = () => {
        navigator.clipboard.writeText(editablePrompt);
        setIsGeminiCopied(true);
        setTimeout(() => setIsGeminiCopied(false), 3000);
        window.open(`https://gemini.google.com/`, '_blank', 'noopener,noreferrer');
    };

    const handleWhatsAppClick = () => {
        const metaAiPhoneNumber = '13135550002';
        const promptText = `/imagine ${editablePrompt}`;
        const encodedPrompt = encodeURIComponent(promptText);
        window.open(`https://wa.me/${metaAiPhoneNumber}?text=${encodedPrompt}`, '_blank', 'noopener,noreferrer');
    };

    return (
        <GeneratedCard title={title}>
            {promptState?.error && <ErrorMessage message={promptState.error} />}
            {editablePrompt && (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="prompt-textarea" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                            Editable Image Prompt
                        </label>
                        <textarea id="prompt-textarea" value={editablePrompt} onChange={(e) => setEditablePrompt(e.target.value)} rows={4} className="w-full p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-100 resize-y" />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={handleGeminiClick} className="flex-1 inline-flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-cyan-700 transition-all">
                           {isGeminiCopied ? <><CheckIcon />Copied! Now Paste</> : <><ClipboardIcon />Copy Prompt & Open Gemini</>}
                        </button>
                        <button onClick={handleWhatsAppClick} className="flex-1 inline-flex items-center justify-center gap-2 bg-[#25D366] text-white font-semibold py-2 px-4 rounded-md hover:bg-[#1DA851] transition-all">
                            <WhatsAppIcon />Visualize on WhatsApp
                        </button>
                    </div>
                </div>
            )}
        </GeneratedCard>
    );
};

const MCQViewer = ({ mcqs }: { mcqs: MCQ[] }) => {
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [showResults, setShowResults] = useState(false);
    
    const handleAnswerSelect = (questionIndex: number, option: string) => {
        setUserAnswers(prev => ({ ...prev, [questionIndex]: option }));
        if (showResults) setShowResults(false);
    };

    return (
        <div className="mt-4">
            {showResults && <span className="text-lg font-bold text-blue-600 dark:text-blue-400">Score: {mcqs.reduce((acc, mcq, index) => (userAnswers[index] === mcq.correctAnswer ? acc + 1 : acc), 0)}/{mcqs.length}</span>}
            <div className="space-y-6 mt-4">
                {mcqs.map((mcq, index) => (
                    <div key={index}>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 mb-3">{index + 1}. {mcq.question}</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {mcq.options.map((option) => {
                                const isSelected = userAnswers[index] === option;
                                const isCorrect = showResults && mcq.correctAnswer === option;
                                const isIncorrect = showResults && isSelected && !isCorrect;
                                let optionClass = 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent';
                                if (showResults) {
                                    if (isCorrect) optionClass = 'bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-300 border-green-500';
                                    else if (isIncorrect) optionClass = 'bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-300 border-red-500';
                                    else optionClass = 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-transparent';
                                } else if (isSelected) {
                                    optionClass = 'bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 border-blue-500';
                                }
                                return <button key={option} onClick={() => handleAnswerSelect(index, option)} disabled={showResults} className={`w-full text-left p-2.5 text-sm rounded-md transition-colors border ${showResults ? 'cursor-default' : ''} ${optionClass}`}>{option}</button>;
                            })}
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-6 flex justify-end">
                {showResults ? <button onClick={() => { setShowResults(false); setUserAnswers({}); }} className="bg-slate-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-slate-700 transition-all">Try Again</button> : <button onClick={() => setShowResults(true)} disabled={Object.keys(userAnswers).length !== mcqs.length} className="bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed transition-all">Check Answers</button>}
            </div>
        </div>
    );
};

export const QuizCard = ({ title, mcqs }: { title: string, mcqs: MCQ[] }) => (
    <GeneratedCard title={title}>
        <MCQViewer mcqs={mcqs} />
    </GeneratedCard>
);

const FillInTheBlankViewer = ({ questions }: { questions: FillInTheBlank[] }) => {
    const [answersVisible, setAnswersVisible] = useState<Record<number, boolean>>({});
    return (
        <div className="space-y-4">
            {questions.map((item, index) => (
                <div key={index} className="text-sm">
                    <p className="text-slate-800 dark:text-slate-100" dangerouslySetInnerHTML={{ __html: `${index + 1}. ${item.question.replace(/____/g, '<span class="font-semibold text-slate-400 dark:text-slate-500 tracking-widest">____</span>')}` }}/>
                    <div className="mt-2">
                        <button onClick={() => setAnswersVisible(p => ({ ...p, [index]: !p[index] }))} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">{answersVisible[index] ? 'Hide' : 'Show'} Answer</button>
                        {answersVisible[index] && <p className="mt-1 p-2 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-700 dark:text-slate-200 font-medium transition-colors duration-300">{item.answer}</p>}
                    </div>
                </div>
            ))}
        </div>
    );
};

export const UnitTestCard = ({ title, unitTest }: { title: string, unitTest: UnitTest }) => {
    const renderShortAnswerQuestions = (questions: ShortAnswerQuestion[]) => (
        <div className="space-y-3">{questions.map((q, index) => <p key={index} className="text-sm text-slate-800 dark:text-slate-100">{index + 1}. {q.question}</p>)}</div>
    );
    return (
        <GeneratedCard title={title}>
            <div className="space-y-8">
                {unitTest.mcqs?.length > 0 && (<div><h4 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Multiple Choice Questions</h4><MCQViewer mcqs={unitTest.mcqs} /></div>)}
                {unitTest.fillInTheBlanks?.length > 0 && (<div><h4 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Fill in the Blanks</h4><FillInTheBlankViewer questions={unitTest.fillInTheBlanks} /></div>)}
                {unitTest.twoMarkQuestions?.length > 0 && (<div><h4 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Short Answer Questions (2 Marks)</h4>{renderShortAnswerQuestions(unitTest.twoMarkQuestions)}</div>)}
                {unitTest.threeMarkQuestions?.length > 0 && (<div><h4 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Medium Answer Questions (3 Marks)</h4>{renderShortAnswerQuestions(unitTest.threeMarkQuestions)}</div>)}
                {unitTest.fiveMarkQuestions?.length > 0 && (<div><h4 className="text-md font-bold text-slate-700 dark:text-slate-200 mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">Long Answer Questions (5 Marks)</h4>{renderShortAnswerQuestions(unitTest.fiveMarkQuestions)}</div>)}
            </div>
        </GeneratedCard>
    );
};