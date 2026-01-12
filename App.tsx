
import React, { useState, useEffect } from 'react';
import { generateLesson, regeneratePassage, generateThemeImage } from './services/geminiService';
import { DailyLesson } from './types';
import ReadingSection from './components/ReadingSection';
import VocabList from './components/VocabList';
import ExerciseSection from './components/ExerciseSection';
import ChatPractice from './components/ChatPractice';
import WritingExercise from './components/WritingExercise';
import AudioRecorder from './components/AudioRecorder';
import { SkeletonLoader } from './components/SkeletonLoader';
import { ToastProvider, useToast } from './components/Toast';
import ProgressMap from './components/ProgressMap';
import LevelSelector from './components/LevelSelector';
import UserProfile from './components/UserProfile';
import { AuthProvider, useAuth } from './context/AuthContext';

type ViewMode = 'MAP' | 'LESSON';
type LessonTab = 'VOCAB' | 'READ' | 'CHAT' | 'QUIZ';

// --- API ERROR MODAL ---
const ApiKeyErrorModal = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-6 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-rounded text-3xl text-red-500">key_off</span>
                </div>
                <h2 className="text-xl font-black text-slate-900 mb-2">API Anahtarı Eksik</h2>
                <p className="text-sm text-slate-500 mb-6">Uygulamanın çalışması için API anahtarı gereklidir.</p>
                <button onClick={() => window.location.reload()} className="w-full py-3 bg-slate-900 text-white font-bold rounded-xl active-scale transition-transform">
                    Yenile
                </button>
            </div>
        </div>
    );
};

// --- MOBILE NAVIGATION COMPONENT ---
const BottomNavigation = ({ 
    mode, 
    activeTab, 
    onTabChange, 
    onHomeClick 
}: { 
    mode: ViewMode, 
    activeTab?: LessonTab, 
    onTabChange?: (tab: LessonTab) => void,
    onHomeClick: () => void 
}) => {
    if (mode === 'MAP') {
        return (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 pb-safe z-50 shadow-nav">
                <div className="flex justify-around items-center h-16 px-2">
                    <button className="flex flex-col items-center gap-1 p-2 text-primary active-scale transition-transform">
                        <span className="material-symbols-rounded text-2xl">map</span>
                        <span className="text-[10px] font-bold">Harita</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600 active-scale transition-transform">
                        <span className="material-symbols-rounded text-2xl">leaderboard</span>
                        <span className="text-[10px] font-bold">Liderler</span>
                    </button>
                    <button className="flex flex-col items-center gap-1 p-2 text-slate-400 hover:text-slate-600 active-scale transition-transform">
                        <span className="material-symbols-rounded text-2xl">storefront</span>
                        <span className="text-[10px] font-bold">Market</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-100 pb-safe z-50 shadow-nav">
            <div className="flex justify-around items-center h-16 px-1">
                {[
                    { id: 'VOCAB', label: 'Kelime', icon: 'style' },
                    { id: 'READ', label: 'Okuma', icon: 'menu_book' },
                    { id: 'CHAT', label: 'Sohbet', icon: 'forum' },
                    { id: 'QUIZ', label: 'Test', icon: 'quiz' }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => onTabChange?.(tab.id as LessonTab)}
                        className={`flex flex-col items-center gap-1 p-2 min-w-[64px] rounded-xl transition-all duration-200 active-scale
                            ${activeTab === tab.id ? 'text-primary' : 'text-slate-300'}`}
                    >
                        <span className={`material-symbols-rounded text-2xl ${activeTab === tab.id ? 'fill-1' : ''}`}>{tab.icon}</span>
                        <span className={`text-[10px] font-bold ${activeTab === tab.id ? 'opacity-100' : 'opacity-0 scale-0'} transition-all`}>{tab.label}</span>
                        {activeTab === tab.id && <div className="w-1 h-1 bg-primary rounded-full absolute bottom-1"></div>}
                    </button>
                ))}
            </div>
        </div>
    );
};

const AppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [activeLessonTab, setActiveLessonTab] = useState<LessonTab>('VOCAB');
  
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(false); 
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  const { addToast } = useToast();
  const { isAuthenticated, user, updateUser } = useAuth();

  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    const savedLevel = localStorage.getItem('yds_user_level');
    const savedWordsLocal = localStorage.getItem('yds_saved_words');
    if (savedWordsLocal) setSavedWords(JSON.parse(savedWordsLocal));
    if (savedLevel) setUserLevel(savedLevel);
    else setIsLevelSelectorOpen(true);
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) localStorage.setItem('yds_saved_words', JSON.stringify(savedWords));
  }, [savedWords, isAuthenticated]);

  const handleLevelSelect = (level: string) => {
      setUserLevel(level);
      localStorage.setItem('yds_user_level', level);
      if (user) updateUser({ ...user, level });
      setIsLevelSelectorOpen(false);
      setCurrentDay(1); 
      setLesson(null);
      addToast(`${level} seviyesi ayarlandı`, 'success');
  };

  const toggleSaveWord = (word: string) => {
    const lowerWord = word.toLowerCase();
    setSavedWords(prev => prev.includes(lowerWord) ? prev.filter(w => w !== lowerWord) : [...prev, lowerWord]);
  };

  const openLesson = async (day: number) => {
      setCurrentDay(day);
      setViewMode('LESSON');
      setActiveLessonTab('VOCAB'); 
      
      const currentLevel = userLevel || 'A1';

      if (!lesson || lesson.day !== day || lesson.difficulty_level !== currentLevel) {
        setLoading(true);
        setApiKeyError(false);
        setLesson(null);
        try {
            const data = await generateLesson(day, currentLevel);
            setLesson(data);
            generateThemeImage(data.theme).then((imgUrl) => {
                if (imgUrl) setLesson(prev => prev ? { ...prev, imageUrl: imgUrl } : null);
            });
        } catch (err: any) {
            console.error("Lesson Loading Error:", err);
            if (err.message === "MISSING_API_KEY" || err.message === "INVALID_API_KEY" || err.message.includes("API key")) {
                setApiKeyError(true);
            } else {
                addToast("Bağlantı hatası oluştu.", 'error');
                setViewMode('MAP'); 
            }
        } finally {
            setLoading(false);
        }
      }
  };

  if (apiKeyError) return <ApiKeyErrorModal isOpen={true} />;
  if (isLevelSelectorOpen || !userLevel) return <LevelSelector onSelect={handleLevelSelect} />;

  return (
    <div className="min-h-screen bg-surface flex flex-col font-display overflow-hidden">
        
        {/* VIEW: MAP */}
        {viewMode === 'MAP' && (
            <>
                <ProgressMap 
                    currentDay={currentDay}
                    unlockedDay={currentDay} 
                    onSelectDay={openLesson} 
                    onChangeLevel={() => setIsLevelSelectorOpen(true)}
                    onProfileClick={() => setIsProfileOpen(true)}
                    user={user}
                />
                <UserProfile 
                    isOpen={isProfileOpen} 
                    onClose={() => setIsProfileOpen(false)}
                    onChangeLevel={() => setIsLevelSelectorOpen(true)}
                    user={user} 
                    savedWordsCount={savedWords.length}
                    currentDay={currentDay}
                />
                <BottomNavigation 
                    mode="MAP" 
                    onHomeClick={() => {}} 
                />
            </>
        )}

        {/* VIEW: LESSON */}
        {viewMode === 'LESSON' && (
            <div className="flex-1 flex flex-col h-[100dvh]">
                {/* Lesson Header */}
                <div className="bg-white/90 backdrop-blur-md pt-safe px-4 pb-2 border-b border-slate-100 flex items-center justify-between sticky top-0 z-40 shadow-sm">
                    <button 
                        onClick={() => setViewMode('MAP')} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-600 hover:bg-slate-100 active-scale"
                    >
                        <span className="material-symbols-rounded">arrow_back</span>
                    </button>
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-black text-primary-dark uppercase tracking-widest opacity-60">GÜN {currentDay}</span>
                        <h2 className="text-sm font-bold text-slate-800 line-clamp-1 max-w-[200px]">
                            {loading ? 'Ders Hazırlanıyor...' : lesson?.theme || 'Yükleniyor'}
                        </h2>
                    </div>
                    <div className="w-10 h-10 flex items-center justify-center rounded-full bg-primary/5 text-primary">
                        <div className="w-6 h-6 rounded-full border-[3px] border-current border-t-transparent animate-spin" style={{ display: loading ? 'block' : 'none' }}></div>
                        <span className="material-symbols-rounded" style={{ display: loading ? 'none' : 'block' }}>school</span>
                    </div>
                </div>

                {/* Main Content Area */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-32 bg-surface">
                    {loading ? <SkeletonLoader /> : lesson ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl mx-auto w-full space-y-4">
                            
                            {activeLessonTab === 'VOCAB' && (
                                <div className="space-y-4">
                                    {lesson.imageUrl && (
                                        <div className="rounded-3xl overflow-hidden shadow-lg h-56 relative group">
                                            <img src={lesson.imageUrl} className="w-full h-full object-cover" alt="Theme" />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                                                <h2 className="text-white font-black text-2xl leading-tight">{lesson.theme}</h2>
                                            </div>
                                        </div>
                                    )}
                                    <VocabList 
                                        words={lesson.target_words}
                                        savedWords={savedWords}
                                        onToggleSave={toggleSaveWord}
                                    />
                                    <button onClick={() => setActiveLessonTab('READ')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-btn shadow-primary-dark active:shadow-none active:translate-y-1 transition-all mt-4">
                                        Okumaya Geç
                                    </button>
                                </div>
                            )}

                            {activeLessonTab === 'READ' && (
                                <div className="space-y-4">
                                    <ReadingSection 
                                        passage={lesson.reading_passage}
                                        words={lesson.target_words}
                                        savedWords={savedWords}
                                        onToggleSave={toggleSaveWord}
                                    />
                                    <AudioRecorder passageText={lesson.reading_passage} />
                                    <WritingExercise passage={lesson.reading_passage} />
                                    <button onClick={() => setActiveLessonTab('CHAT')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-btn shadow-primary-dark active:shadow-none active:translate-y-1 transition-all mt-4">
                                        Sohbete Başla
                                    </button>
                                </div>
                            )}

                            {activeLessonTab === 'CHAT' && (
                                <div className="space-y-4 h-full">
                                     <ChatPractice 
                                        scenario={lesson.conversation_scenario}
                                        userLevel={userLevel || 'A1'}
                                     />
                                     <button onClick={() => setActiveLessonTab('QUIZ')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-btn shadow-primary-dark active:shadow-none active:translate-y-1 transition-all">
                                        Test Zamanı
                                    </button>
                                </div>
                            )}

                            {activeLessonTab === 'QUIZ' && (
                                <div className="space-y-4">
                                    <ExerciseSection exercises={lesson.exercises} />
                                    <button onClick={() => setViewMode('MAP')} className="w-full py-4 bg-success text-white rounded-2xl font-bold shadow-btn shadow-green-700 active:shadow-none active:translate-y-1 transition-all mt-4">
                                        Dersi Bitir
                                    </button>
                                </div>
                            )}

                        </div>
                    ) : null}
                </main>

                <BottomNavigation 
                    mode="LESSON" 
                    activeTab={activeLessonTab} 
                    onTabChange={setActiveLessonTab} 
                    onHomeClick={() => setViewMode('MAP')} 
                />
            </div>
        )}
    </div>
  );
};

const App: React.FC = () => (
  <ToastProvider>
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  </ToastProvider>
);

export default App;
