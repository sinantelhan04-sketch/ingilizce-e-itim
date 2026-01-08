
import React, { useState, useEffect } from 'react';
import { generateLesson, regeneratePassage, generateThemeImage } from './services/geminiService';
import { DailyLesson } from './types';
import ReadingSection from './components/ReadingSection';
import VocabList from './components/VocabList';
import ExerciseSection from './components/ExerciseSection';
import ChatPractice from './components/ChatPractice';
import WritingExercise from './components/WritingExercise';
import AudioRecorder from './components/AudioRecorder'; // Imported AudioRecorder
import { SkeletonLoader } from './components/SkeletonLoader';
import { ToastProvider, useToast } from './components/Toast';
import ProgressMap from './components/ProgressMap';
import LevelSelector from './components/LevelSelector';
import UserProfile from './components/UserProfile';
import { AuthProvider, useAuth } from './context/AuthContext';

type ViewMode = 'MAP' | 'LESSON';
type LessonTab = 'VOCAB' | 'READ' | 'CHAT' | 'QUIZ';

const AppContent: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('MAP');
  const [currentDay, setCurrentDay] = useState<number>(1);
  const [activeLessonTab, setActiveLessonTab] = useState<LessonTab>('VOCAB');
  
  const [userLevel, setUserLevel] = useState<string | null>(null);
  const [lesson, setLesson] = useState<DailyLesson | null>(null);
  const [loading, setLoading] = useState<boolean>(false); 
  const [regenerating, setRegenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
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
        setError(null);
        setLesson(null);
        try {
            const data = await generateLesson(day, currentLevel);
            setLesson(data);
            generateThemeImage(data.theme).then((imgUrl) => {
                if (imgUrl) setLesson(prev => prev ? { ...prev, imageUrl: imgUrl } : null);
            });
        } catch (err) {
            setError(`İçerik oluşturulamadı.`);
            addToast("Ders yüklenirken hata oluştu", 'error');
            setViewMode('MAP'); 
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
    } catch (e) {
      addToast("Yenileme başarısız", 'error');
    } finally {
      setRegenerating(false);
    }
  };

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
                            flex-1 min-