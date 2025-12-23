import React, { useState, useEffect } from 'react';
import { generateLesson, regeneratePassage, generateThemeImage } from './services/geminiService';
import { DailyLesson } from './types';
import ReadingSection from './components/ReadingSection';
import VocabList from './components/VocabList';
import ExerciseSection from './components/ExerciseSection';
import AudioRecorder from './components/AudioRecorder';
import { Spinner } from './components/Spinner';

const App: React.FC = () => {
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Word Bank State
  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [isWordBankOpen, setIsWordBankOpen] = useState(false);

  // Load saved words from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('yds_saved_words');
    if (saved) {
      setSavedWords(JSON.parse(saved));
    }
  }, []);

  // Save words to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('yds_saved_words', JSON.stringify(savedWords));
  }, [savedWords]);

  const toggleSaveWord = (word: string) => {
    const lowerWord = word.toLowerCase();
    setSavedWords(prev => 
      prev.includes(lowerWord) 
        ? prev.filter(w => w !== lowerWord) 
        : [...prev, lowerWord]
    );
  };

  useEffect(() => {
    const fetchLesson = async () => {
      setLoading(true);
      setError(null);
      setLesson(null);
      try {
        // 1. Generate text content
        const data = await generateLesson(currentDay);
        setLesson(data);
        
        // 2. Generate image in background
        setImageLoading(true);
        generateThemeImage(data.theme).then((imgUrl) => {
             if (imgUrl) {
                 setLesson(prev => prev ? { ...prev, imageUrl: imgUrl } : null);
             }
        }).finally(() => setImageLoading(false));

      } catch (err) {
        setError("Ders içeriği oluşturulamadı. Lütfen tekrar deneyin veya API anahtarını kontrol edin.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [currentDay]);

  const handleRegenerate = async () => {
    if (!lesson) return;
    setRegenerating(true);
    try {
      const data = await regeneratePassage(lesson.theme, lesson.target_words);
      setLesson(prev => prev ? {
        ...prev,
        reading_passage: data.reading_passage,
        exercises: data.exercises
      } : null);
    } catch (e) {
      console.error(e);
      alert("Yeni senaryo oluşturulamadı.");
    } finally {
      setRegenerating(false);
    }
  };

  // Progress percentage for the top bar
  const progress = (currentDay / 30) * 100;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 relative overflow-x-hidden">
      
      {/* Corporate Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold text-sm shadow-inner ring-1 ring-blue-500">
              AI
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight leading-none">
                YDS <span className="text-blue-400 font-light">Academy</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button 
                onClick={() => setIsWordBankOpen(true)}
                className="relative flex items-center gap-2 text-slate-300 hover:text-white transition-colors group text-sm font-medium"
                title="Kelime Defterim"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="hidden sm:block">Kelime Defteri</span>
                {savedWords.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full">
                        {savedWords.length}
                    </span>
                )}
            </button>

            <div className="hidden md:flex items-center gap-3 px-4 py-1.5 bg-slate-800 rounded-lg border border-slate-700">
                <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">İlerleme</span>
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                </div>
                <span className="text-xs text-white font-mono">{Math.round(progress)}%</span>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentDay(d => Math.max(1, d - 1))}
                disabled={currentDay === 1 || loading}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-all disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </button>
              <div className="flex flex-col items-center px-1">
                <span className="text-sm font-bold text-white">Gün {currentDay}</span>
              </div>
              <button 
                onClick={() => setCurrentDay(d => Math.min(30, d + 1))}
                disabled={currentDay === 30 || loading}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-md transition-all disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {loading && (
           <div className="flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700">
             <div className="relative">
                 <div className="w-16 h-16 rounded-full border-4 border-slate-200 border-t-blue-600 animate-spin"></div>
             </div>
             <div className="text-center mt-6 space-y-2">
               <h3 className="text-xl font-semibold text-slate-800">Ders Hazırlanıyor</h3>
               <p className="text-slate-500 text-sm">Akademik içerik ve analizler oluşturuluyor...</p>
             </div>
           </div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto bg-white border-l-4 border-red-500 p-6 rounded-r-lg shadow-sm flex items-start gap-4" role="alert">
            <div className="text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
            </div>
            <div className="flex-1">
              <strong className="block font-bold text-slate-800">Hata Oluştu</strong>
              <p className="mt-1 text-slate-600 text-sm">{error}</p>
            </div>
            <button onClick={() => window.location.reload()} className="text-sm font-semibold text-red-600 hover:text-red-800 underline">
                Yenile
            </button>
          </div>
        )}

        {!loading && lesson && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Sidebar: Context & Vocab */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 order-2 lg:order-1">
               {/* Context Card */}
               <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5">
                   <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Ders Bilgileri</h3>
                   <div className="space-y-4">
                       <div>
                           <label className="text-xs text-slate-500 block">Tema</label>
                           <p className="font-semibold text-slate-800">{lesson.theme}</p>
                       </div>
                       <div>
                           <label className="text-xs text-slate-500 block">Seviye</label>
                           <div className="flex items-center gap-2 mt-1">
                               <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-xs font-bold">
                                   {lesson.difficulty_level}
                               </span>
                           </div>
                       </div>
                   </div>
               </div>

              <VocabList 
                  words={lesson.target_words} 
                  savedWords={savedWords}
                  onToggleSave={toggleSaveWord}
              />
            </div>

            {/* Main Lesson Area */}
            <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
              
              {/* Hero Section - More Academic/Document Style */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="h-32 sm:h-48 bg-slate-100 relative overflow-hidden">
                    {/* Background Image with Overlay */}
                     <div className="absolute inset-0 bg-cover bg-center" 
                     style={{ 
                         backgroundImage: lesson.imageUrl ? `url(${lesson.imageUrl})` : 'none',
                         backgroundColor: '#1e293b'
                     }}>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10"></div>
                     </div>
                     <div className="absolute bottom-0 left-0 p-6 sm:p-8 w-full">
                        <div className="flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif tracking-tight shadow-black drop-shadow-md">
                                    {lesson.theme}
                                </h2>
                                <p className="text-slate-300 text-sm mt-1 max-w-lg">
                                    Akademik okuma parçası ve kelime çalışması.
                                </p>
                            </div>
                            <button
                                onClick={handleRegenerate}
                                disabled={regenerating}
                                className="hidden sm:flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-md text-sm font-medium hover:bg-white/20 transition-all disabled:opacity-50"
                            >
                                {regenerating ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                ) : (
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                                )}
                                İçeriği Yenile
                            </button>
                        </div>
                     </div>
                </div>
                
                <div className="border-t border-slate-200">
                    <ReadingSection 
                        passage={lesson.reading_passage} 
                        words={lesson.target_words} 
                        savedWords={savedWords}
                        onToggleSave={toggleSaveWord}
                    />
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                  <AudioRecorder passageText={lesson.reading_passage.replace(/\*\*/g, '')} />
                  <ExerciseSection exercises={lesson.exercises} />
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Word Bank Sidebar (Drawer) */}
      {isWordBankOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[2px] transition-opacity" onClick={() => setIsWordBankOpen(false)}></div>
            <div className="relative w-full max-w-sm bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300 border-l border-slate-200">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        Kelime Defterim
                    </h2>
                    <button onClick={() => setIsWordBankOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-200 rounded">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-0 bg-white">
                    {savedWords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-center p-6">
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                             </svg>
                             <p className="font-medium text-sm">Henüz kelime kaydetmediniz.</p>
                             <p className="text-xs mt-1 text-slate-400">Ders sırasında kelime kartlarındaki ikona tıklayarak ekleyin.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100">
                             {savedWords.map((word, idx) => (
                                 <div key={idx} className="p-4 hover:bg-slate-50 flex items-center justify-between group transition-colors">
                                     <span className="font-bold text-slate-700 capitalize text-sm">{word}</span>
                                     <button 
                                        onClick={() => toggleSaveWord(word)}
                                        className="text-slate-300 hover:text-red-500 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                                        title="Listeden Çıkar"
                                     >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                        </svg>
                                     </button>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
                <div className="p-4 bg-slate-50 border-t border-slate-200 text-center text-xs text-slate-500 font-medium">
                    Toplam {savedWords.length} kelime
                </div>
            </div>
        </div>
      )}
      
      {/* Professional Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-6 border-t border-slate-200 mt-12">
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-slate-400">
             <p>&copy; {new Date().getFullYear()} YDS Academy AI. All rights reserved.</p>
             <p className="mt-2 md:mt-0">Powered by Gemini AI Model</p>
        </div>
      </footer>
    </div>
  );
};

export default App;