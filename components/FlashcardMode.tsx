
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Word } from '../types';
import { getQuickDefinition, playTTS } from '../services/geminiService';

interface FlashcardModeProps {
  savedWords: any[];
  onClose: () => void;
}

const FlashcardMode: React.FC<FlashcardModeProps> = ({ savedWords, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [currentWordData, setCurrentWordData] = useState<Word | null>(null);
  const [loading, setLoading] = useState(false);
  const [direction, setDirection] = useState(0); // -1 for prev, 1 for next

  const activeWord = savedWords[currentIndex];

  useEffect(() => {
    if (!activeWord) return;
    
    setIsFlipped(false);
    
    // If it's already a full Word object
    if (typeof activeWord !== 'string' && activeWord.turkish_meaning) {
      setCurrentWordData(activeWord);
      return;
    }

    // If it's a string, fetch details
    const fetchDetails = async () => {
      setLoading(true);
      const wordStr = typeof activeWord === 'string' ? activeWord : activeWord.word;
      try {
        const details = await getQuickDefinition(wordStr, "");
        setCurrentWordData({
          word: wordStr,
          emoji: details.emoji,
          ipa: details.pronunciation,
          type: 'word',
          turkish_meaning: details.turkish_meaning,
          definition: details.english_definition,
          synonym: '...',
          antonym: '...',
          example_sentence: '...'
        });
      } catch (e) {
        console.error("Failed to fetch word details", e);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activeWord]);

  const handleNext = () => {
    if (currentIndex < savedWords.length - 1) {
      setDirection(1);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentWordData) playTTS(currentWordData.word);
  };

  if (savedWords.length === 0) {
    return (
      <div className="fixed inset-0 z-[200] bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
            <span className="material-symbols-rounded text-4xl text-slate-400">bookmark_border</span>
        </div>
        <h2 className="text-2xl font-display font-bold text-slate-800 mb-2">Henüz Kelime Yok</h2>
        <p className="text-slate-500 max-w-xs mb-8">Hafıza kartı antrenmanı yapabilmek için önce birkaç kelime kaydetmelisin.</p>
        <button onClick={onClose} className="px-8 py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all">
            Geri Dön
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[200] bg-surface flex flex-col font-display overflow-hidden">
      {/* Header */}
      <div className="p-4 md:p-6 flex items-center justify-between bg-white border-b border-slate-100">
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
            <span className="material-symbols-rounded">close</span>
        </button>
        <div className="text-center">
            <h1 className="text-lg font-bold text-slate-900 leading-none">Hafıza Kartları</h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Kelime Antrenmanı</p>
        </div>
        <div className="w-10 text-right font-mono text-sm text-slate-400">
            {currentIndex + 1}/{savedWords.length}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 bg-slate-100 w-full overflow-hidden">
         <div 
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / savedWords.length) * 100}%` }}
         ></div>
      </div>

      {/* Card Stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden relative">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
                key={currentIndex}
                custom={direction}
                initial={{ x: direction * 50, opacity: 0, scale: 0.95 }}
                animate={{ x: 0, opacity: 1, scale: 1 }}
                exit={{ x: -direction * 50, opacity: 0, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-sm aspect-[3/4] perspective-1000"
            >
                <div 
                    className={`relative w-full h-full transition-all duration-500 transform-style-3d cursor-pointer ${isFlipped ? 'rotate-y-180' : ''}`}
                    onClick={() => !loading && setIsFlipped(!isFlipped)}
                >
                    {/* Front of Card */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-[3rem] shadow-2xl p-8 flex flex-col items-center justify-center border border-slate-100">
                        {loading ? (
                            <div className="space-y-4 flex flex-col items-center">
                                <div className="w-20 h-20 bg-slate-50 animate-pulse rounded-full"></div>
                                <div className="h-8 w-40 bg-slate-50 animate-pulse rounded-xl"></div>
                            </div>
                        ) : (
                            <div className="text-center flex flex-col items-center">
                                <div className="text-7xl mb-8 filter drop-shadow-xl animate-bounce-slow">
                                    {currentWordData?.emoji || '❓'}
                                </div>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-2">
                                    {currentWordData?.word}
                                </h2>
                                <p className="text-slate-400 font-mono text-lg">/{currentWordData?.ipa}/</p>
                                
                                <div className="mt-12 text-slate-300 flex flex-col items-center gap-2">
                                    <span className="material-symbols-rounded text-3xl animate-pulse">touch_app</span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest">Anlamını Gör</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Back of Card */}
                    <div className="absolute inset-0 w-full h-full backface-hidden bg-slate-900 rounded-[3rem] shadow-2xl p-8 flex flex-col rotate-y-180 border border-slate-800">
                        <div className="flex justify-between items-start mb-6">
                            <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold text-white/60 tracking-wider uppercase">
                                {currentWordData?.type}
                            </span>
                            <button 
                                onClick={handlePlay}
                                className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-rounded">volume_up</span>
                            </button>
                        </div>

                        <div className="flex-1 flex flex-col justify-center">
                            <h3 className="text-3xl font-bold text-white mb-2">{currentWordData?.turkish_meaning}</h3>
                            <p className="text-slate-400 text-lg leading-relaxed mb-8">
                                {currentWordData?.definition}
                            </p>
                            
                            {currentWordData?.example_sentence && currentWordData.example_sentence !== '...' && (
                                <div className="p-5 bg-white/5 rounded-3xl border border-white/10">
                                    <p className="text-primary-300 font-medium italic text-sm">
                                        "{currentWordData.example_sentence}"
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-center text-slate-500">
                             <div className="flex items-center gap-2">
                                <span className="material-symbols-rounded text-sm">sync</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest">Kelimeye Dön</span>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
          </AnimatePresence>
      </div>

      {/* Navigation Controls */}
      <div className="p-8 pb-12 flex items-center justify-center gap-6">
          <button 
            disabled={currentIndex === 0}
            onClick={handlePrev}
            className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm active:scale-95 transition-all disabled:opacity-30"
          >
              <span className="material-symbols-rounded text-3xl">chevron_left</span>
          </button>

          <button 
            onClick={() => setIsFlipped(!isFlipped)}
            className="flex-1 max-w-[200px] h-16 bg-slate-900 text-white rounded-3xl font-bold shadow-xl shadow-slate-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
              <span className="material-symbols-rounded">flip</span>
              {isFlipped ? 'Kapat' : 'Bak'}
          </button>

          <button 
            disabled={currentIndex === savedWords.length - 1}
            onClick={handleNext}
            className="w-16 h-16 rounded-3xl bg-white border border-slate-100 flex items-center justify-center text-slate-900 shadow-sm active:scale-95 transition-all disabled:opacity-30"
          >
              <span className="material-symbols-rounded text-3xl">chevron_right</span>
          </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-5%) scale(1.05); }
          50% { transform: translateY(0) scale(1); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}} />
    </div>
  );
};

export default FlashcardMode;
