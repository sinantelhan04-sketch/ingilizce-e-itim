
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

// --- NEW COMPONENT: API KEY ERROR MODAL ---
const ApiKeyErrorModal = ({ isOpen }: { isOpen: boolean }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] max-w-lg w-full p-8 shadow-2xl border border-red-100 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-rounded text-4xl text-red-500">key_off</span>
                </div>
                
                <h2 className="text-2xl font-black text-slate-900 mb-2">API Anahtarı Eksik</h2>
                <p className="text-slate-500 mb-8 font-medium">
                    Uygulamanın çalışması için Google Gemini API anahtarı gereklidir.
                </p>

                <div className="space-y-4 text-left bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 text-sm">
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">1</span>
                        <div>
                            <strong className="block text-slate-800">Eğer Vercel Kullanıyorsan:</strong>
                            <p className="text-slate-600 mt-1">Settings &gt; Environment Variables kısmına <code className="bg-slate-200 px-1 py-0.5 rounded text-red-600 font-mono">API_KEY</code> ekleyin ve ardından <strong>Deployments</strong> sekmesinden son deploy'u seçip <strong>"Redeploy"</strong> yapın.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs">2</span>
                        <div>
                            <strong className="block text-slate-800">Direkt Kod İçine Ekleme (Hızlı Çözüm):</strong>
                            <p className="text-slate-600 mt-1"><code className="bg-slate-200 px-1 py-0.5 rounded font-mono">services/geminiService.ts</code> dosyasını açın ve en üstteki <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-700 font-mono">MANUAL_API_KEY</code> değişkenine anahtarınızı yapıştırın.</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => window.location.reload()}
                    className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-rounded">refresh</span>
                    Sayfayı Yenile
                </button>
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
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [apiKeyError, setApiKeyError] = useState<boolean>(false);
  
  const { addToast } = useToast();
  const { isAuthenticated, user, updateUser } = useAuth();

  const [savedWords, setSavedWords] = useState<string[]>([]);
  const [isLevelSelectorOpen, setIsLevelSelectorOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Load user specific data
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
                addToast("Bağlantı hatası oluştu. Tekrar deneyin.", 'error');
                setViewMode('MAP'); 
            }
        } finally {
            setLoading(false);
        }
      }
  };

  const handleRegenerate = async () => {
    if (!lesson || !userLevel) return;
    setRegenerating(true);
    try {
      const data = await regeneratePassage(lesson.theme, lesson.target_words, userLevel);
      setLesson(prev => prev ? { ...prev, reading_passage: data.reading_passage, exercises: data.exercises } : null);
      addToast("Yeni alıştırmalar hazır", 'success');
    } catch (e: any) {
      if (e.message.includes("API key")) setApiKeyError(true);
      else addToast("Yenileme başarısız", 'error');
    } finally {
      setRegenerating(false);
    }
  };

  if (apiKeyError) return <ApiKeyErrorModal isOpen={true} />;

  if (isLevelSelectorOpen || !userLevel) return <LevelSelector onSelect={handleLevelSelect} />;

  if (viewMode === 'MAP') {
      return (
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
          </>
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-display selection:bg-primary-200">
        {/* Glassmorphism Header */}
        <div className="bg-white/80 backdrop-blur-xl border-b border-slate-200 sticky top-0 z-40 px-4 py-3 flex items-center justify-between shadow-sm">
            <button 
                onClick={() => setViewMode('MAP')} 
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"
            >
                <span className="material-icons-round text-2xl">arrow_back</span>
            </button>
            
            <div className="flex flex-col items-center">
                <div className="bg-primary/10 text-primary-dark text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest mb-0.5 border border-primary/20">Gün {currentDay}</div>
                <span className="text-base font-bold text-slate-800 line-clamp-1">{lesson?.theme || 'Yükleniyor...'}</span>
            </div>

            <div className="w-10"></div> 
        </div>

        {/* Floating Tabs */}
        <div className="sticky top-[70px] z-30 px-4 pb-2 pt-2">
             <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-2 shadow-xl shadow-slate-200/50 border border-slate-100 flex justify-between md:justify-center gap-1 overflow-x-auto no-scrollbar max-w-lg mx-auto">
                 {[
                    { id: 'VOCAB', label: 'Kelime', icon: 'style' },
                    { id: 'READ', label: 'Okuma', icon: 'menu_book' },
                    { id: 'CHAT', label: 'Sohbet', icon: 'forum' },
                    { id: 'QUIZ', label: 'Test', icon: 'quiz' }
                 ].map((tab) => (
                     <button 
                        key={tab.id}
                        onClick={() => setActiveLessonTab(tab.id as LessonTab)} 
                        className={`
                            flex-1 min-w-[80px] flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-2.5 rounded-[1.5rem] text-xs md:text-sm font-bold transition-all duration-300
                            ${activeLessonTab === tab.id 
                                ? 'bg-primary text-white shadow-md transform scale-100' 
                                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
                            }
                        `}
                     >
                         <span className="material-icons-round text-xl md:text-lg">{tab.icon}</span>
                         <span>{tab.label}</span>
                     </button>
                 ))}
             </div>
        </div>

        <main className="flex-1 p-4 md:p-8 max-w-3xl mx-auto w-full pb-32">
            {loading ? <SkeletonLoader /> : lesson ? (
                <div className="animate-in slide-in-from-bottom-8 duration-500 fade-in">
                    
                    {activeLessonTab === 'VOCAB' && (
                        <div className="space-y-6">
                            {lesson.imageUrl && (
                                <div className="rounded-[2.5rem] overflow-hidden shadow-2xl h-64 md:h-80 relative mb-8 group transform hover:scale-[1.01] transition-transform duration-500 border-4 border-white">
                                    <img src={lesson.imageUrl} className="w-full h-full object-cover" alt="Theme" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-8">
                                        <h2 className="text-white font-display font-black text-4xl drop-shadow-lg">{lesson.theme}</h2>
                                    </div>
                                </div>
                            )}
                            <VocabList 
                                words={lesson.target_words}
                                savedWords={savedWords}
                                onToggleSave={toggleSaveWord}
                            />
                            <div className="flex justify-center mt-12">
                                <button onClick={() => setActiveLessonTab('READ')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 btn-3d text-lg border-b-4 border-primary-dark">
                                    Okumaya Geç
                                </button>
                            </div>
                        </div>
                    )}

                    {activeLessonTab === 'READ' && (
                        <div className="space-y-6">
                            <ReadingSection 
                                passage={lesson.reading_passage}
                                words={lesson.target_words}
                                savedWords={savedWords}
                                onToggleSave={toggleSaveWord}
                            />
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <AudioRecorder passageText={lesson.reading_passage} />
                                <WritingExercise passage={lesson.reading_passage} />
                            </div>
                            <div className="flex justify-center mt-12">
                                <button onClick={() => setActiveLessonTab('CHAT')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 btn-3d text-lg border-b-4 border-primary-dark">
                                    Sohbete Başla
                                </button>
                            </div>
                        </div>
                    )}

                    {activeLessonTab === 'CHAT' && (
                        <div className="space-y-6">
                             <ChatPractice 
                                scenario={lesson.conversation_scenario}
                                userLevel={userLevel || 'A1'}
                             />
                             <div className="flex justify-center mt-12">
                                <button onClick={() => setActiveLessonTab('QUIZ')} className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-xl shadow-primary/30 btn-3d text-lg border-b-4 border-primary-dark">
                                    Teste Geç
                                </button>
                            </div>
                        </div>
                    )}

                    {activeLessonTab === 'QUIZ' && (
                        <div className="space-y-6">
                            <ExerciseSection exercises={lesson.exercises} />
                            <div className="flex justify-center mt-12">
                                <button onClick={() => setViewMode('MAP')} className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold shadow-xl shadow-emerald-500/30 btn-3d text-lg border-b-4 border-emerald-600">
                                    Dersi Tamamla
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            ) : null}
        </main>
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
