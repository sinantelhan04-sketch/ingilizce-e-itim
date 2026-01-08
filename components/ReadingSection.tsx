
import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../types';
import { playTTS, stopTTS, getQuickDefinition, translateSentence } from '../services/geminiService';
import PronunciationModal from './PronunciationModal';
import { useToast } from './Toast';

interface ReadingSectionProps {
  passage: string;
  words: Word[];
  savedWords: string[];
  onToggleSave: (word: string) => void;
}

interface QuickDef {
  word: string;
  turkish_meaning: string;
  english_definition: string;
  pronunciation: string;
  emoji: string;
}

const ReadingSection: React.FC<ReadingSectionProps> = ({ passage, words, savedWords, onToggleSave }) => {
  const [selectedWord, setSelectedWord] = useState<Word | null>(null);
  const [quickDef, setQuickDef] = useState<QuickDef | null>(null);
  const [loadingDef, setLoadingDef] = useState<string | null>(null);
  const [isPlayingPassage, setIsPlayingPassage] = useState(false);
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [translatedSentenceIndex, setTranslatedSentenceIndex] = useState<number | null>(null);
  const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);
  const [practiceText, setPracticeText] = useState<string | null>(null);
  
  const { addToast } = useToast();
  const shouldStopRef = useRef(false);
  const sentenceRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    sentenceRefs.current = [];
  }, [passage]);

  useEffect(() => {
    const handleExternalStop = () => {
      shouldStopRef.current = true;
      setIsPlayingPassage(false);
      setActiveSentenceIndex(null);
    };
    window.addEventListener('tts-stopped', handleExternalStop);
    return () => {
      window.removeEventListener('tts-stopped', handleExternalStop);
      shouldStopRef.current = true;
      stopTTS();
    };
  }, []);

  const handleStop = () => {
    shouldStopRef.current = true;
    stopTTS();
    setIsPlayingPassage(false);
    setActiveSentenceIndex(null);
  };

  const handlePlayPassage = async () => {
    if (isPlayingPassage) { handleStop(); return; }
    
    setIsPlayingPassage(true);
    shouldStopRef.current = false;
    
    try {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
      const segments = Array.from(segmenter.segment(passage)) as any[];
      
      for (let i = 0; i < segments.length; i++) {
        if (shouldStopRef.current) break;
        
        setActiveSentenceIndex(i);
        
        if (sentenceRefs.current[i]) {
            sentenceRefs.current[i]?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'nearest'
            });
        }

        await playTTS(segments[i].segment.replace(/\*\*/g, ''));
      }
    } catch (e) {
      addToast("Metin seslendirilemedi.", "error");
    } finally {
      setIsPlayingPassage(false);
      setActiveSentenceIndex(null);
      shouldStopRef.current = false;
    }
  };

  const handleWordClick = async (clickedWord: string, fullSentence: string) => {
    const cleanClicked = clickedWord.replace(/[.,;!?()"]/g, '').toLowerCase();
    const targetWord = words.find(w => w.word.toLowerCase() === cleanClicked);
    if (targetWord) {
        setSelectedWord(targetWord);
        setQuickDef(null);
        return;
    }
    setLoadingDef(clickedWord);
    setQuickDef(null);
    setSelectedWord(null);
    try {
        const def = await getQuickDefinition(cleanClicked, fullSentence);
        setQuickDef({
            word: clickedWord.replace(/[.,;!?()"]/g, ''),
            turkish_meaning: def.turkish_meaning,
            english_definition: def.english_definition,
            pronunciation: def.pronunciation,
            emoji: def.emoji
        });
    } catch (e) {
        addToast("Kelime analizi yapılamadı", "error");
    } finally {
        setLoadingDef(null);
    }
  };

  const handleTranslateSentence = async (index: number, sentence: string) => {
      if (translatedSentenceIndex === index) {
          setTranslatedSentenceIndex(null);
          setSentenceTranslation(null);
          return;
      }
      setTranslatedSentenceIndex(index);
      setSentenceTranslation(null);
      setLoadingTranslation(true);
      try {
          const translation = await translateSentence(sentence.replace(/\*\*/g, ''));
          setSentenceTranslation(translation);
      } catch (e) {
          setSentenceTranslation("Çeviri alınamadı.");
      } finally {
          setLoadingTranslation(false);
      }
  };

  const renderPassage = () => {
     const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
     const segments = Array.from(segmenter.segment(passage)) as any[];
     
     return segments.map((seg, idx) => (
         <span 
            key={idx} 
            ref={el => { sentenceRefs.current[idx] = el }}
            className={`relative inline transition-all duration-300 rounded-lg px-1 -mx-1
                ${activeSentenceIndex === idx 
                    ? 'bg-primary-50 text-slate-900 ring-1 ring-primary-100' 
                    : 'hover:bg-slate-50'
                }`}
         >
             <span 
                onClick={() => setActiveSentenceIndex(idx)}
                className="cursor-text"
             >
                 {seg.segment.split(' ').map((token: string, tIdx: number) => {
                    const isBold = token.includes('**');
                    const displayToken = token.replace(/\*\*/g, '');
                    return (
                        <React.Fragment key={tIdx}>
                            <span 
                                onClick={(e) => { e.stopPropagation(); handleWordClick(displayToken, seg.segment); }}
                                className={`inline-block cursor-pointer transition-all border-b-[1.5px] mx-[2px]
                                    ${isBold 
                                        ? 'font-bold text-primary-600 border-primary-200 hover:bg-primary-600 hover:text-white hover:border-transparent px-1 rounded' 
                                        : 'border-transparent hover:border-primary-200 text-slate-700'
                                    } ${loadingDef === displayToken ? 'animate-pulse bg-slate-200' : ''}`}
                            >{displayToken}</span>{' '}
                        </React.Fragment>
                    )
                 })}
             </span>
             
             {activeSentenceIndex === idx && (
                 <div className="absolute z-30 left-1/2 -translate-x-1/2 -top-14 flex gap-1 animate-in fade-in slide-in-from-bottom-2 bg-slate-900 text-white p-1.5 rounded-2xl shadow-xl shadow-slate-900/20 whitespace-nowrap">
                     <button onClick={(e) => { e.stopPropagation(); playTTS(seg.segment.replace(/\*\*/g, '')); }} className="px-3 py-1.5 flex items-center gap-2 hover:bg-white/10 rounded-xl transition-colors" title="Dinle">
                         <span className="material-symbols-rounded text-lg">volume_up</span>
                         <span className="text-xs font-bold hidden sm:inline">Dinle</span>
                     </button>
                     <div className="w-px h-6 bg-white/20 my-auto"></div>
                     <button onClick={(e) => { e.stopPropagation(); handleTranslateSentence(idx, seg.segment); }} className="px-3 py-1.5 flex items-center gap-2 hover:bg-white/10 rounded-xl transition-colors" title="Çevir">
                         <span className="material-symbols-rounded text-lg">translate</span>
                         <span className="text-xs font-bold hidden sm:inline">Çevir</span>
                     </button>
                     <div className="w-px h-6 bg-white/20 my-auto"></div>
                     <button onClick={(e) => { e.stopPropagation(); setPracticeText(seg.segment.replace(/\*\*/g, '')); }} className="px-3 py-1.5 flex items-center gap-2 bg-primary-600 hover:bg-primary-500 rounded-xl transition-colors shadow-lg shadow-primary-500/30" title="Konuş">
                         <span className="material-symbols-rounded text-lg">mic</span>
                         <span className="text-xs font-bold hidden sm:inline">Konuş</span>
                     </button>
                 </div>
             )}
             
             {translatedSentenceIndex === idx && (
                 <div className="block my-6 p-4 md:p-6 bg-white border border-slate-100 shadow-float rounded-3xl text-slate-700 relative animate-in zoom-in-95 origin-left">
                     <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                             <span className="material-symbols-rounded text-sm">auto_awesome</span>
                        </div>
                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Türkçe Çeviri</span>
                     </div>
                     {loadingTranslation ? (
                         <div className="flex items-center gap-3 text-slate-400 h-6">
                             <div className="w-4 h-4 border-2 border-slate-200 border-t-primary-600 rounded-full animate-spin"></div>
                             <span className="text-sm font-medium">Çevriliyor...</span>
                         </div>
                     ) : (
                         <p className="text-base md:text-lg font-medium leading-relaxed text-slate-800">{sentenceTranslation}</p>
                     )}
                 </div>
             )}
         </span>
     ));
  };

  const isSaved = (w: string) => savedWords.includes(w.toLowerCase());

  return (
    <div className="bg-white rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 shadow-dribbble relative overflow-hidden">
      {/* Decorative Background Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-50/50 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 md:mb-10 pb-6 border-b border-slate-100 relative z-10 gap-4">
         <div className="flex items-center gap-4 md:gap-5">
             <div className="w-12 h-12 md:w-14 md:h-14 rounded-3xl bg-white border border-slate-100 shadow-card flex items-center justify-center text-primary-600">
                 <span className="material-symbols-rounded text-2xl md:text-3xl">menu_book</span>
             </div>
             <div>
                 <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">Okuma Parçası</h2>
                 <p className="text-xs md:text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">İnteraktif Okuyucu</p>
             </div>
         </div>
         <button 
            onClick={handlePlayPassage} 
            className={`flex items-center justify-center gap-3 px-6 py-3 rounded-2xl font-bold text-sm transition-all duration-300 group w-full md:w-auto
            ${isPlayingPassage 
                ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                : 'bg-slate-900 text-white hover:bg-slate-800 hover:shadow-xl hover:shadow-slate-900/20'}`}
         >
            <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-colors ${isPlayingPassage ? 'bg-red-100' : 'bg-white/20'}`}>
                <span className="material-symbols-rounded text-base md:text-lg">{isPlayingPassage ? 'stop' : 'play_arrow'}</span>
            </div>
            {isPlayingPassage ? 'Durdur' : 'Metni Dinle'}
         </button>
      </div>
      
      <div className="font-sans leading-[1.8] md:leading-[2.2] text-lg md:text-[1.2rem] text-slate-700 relative z-10 selection:bg-accent-light selection:text-accent">
          {renderPassage()}
      </div>

      {/* Quick Definition Tooltip - Mobile Bottom Sheet */}
      {quickDef && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 bg-slate-900/40 backdrop-blur-sm" onClick={() => setQuickDef(null)}>
            <div className="bg-white rounded-t-[2rem] md:rounded-[2rem] shadow-2xl w-full max-w-sm overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
                <div className="p-6 md:p-8 text-center bg-gradient-to-b from-primary-50 to-white relative">
                    <button onClick={() => setQuickDef(null)} className="absolute top-4 right-4 md:top-6 md:right-6 text-slate-400 hover:text-slate-600 bg-white rounded-full p-2 shadow-sm transition-all md:hover:rotate-90"><span className="material-symbols-rounded">close</span></button>
                    <div className="text-6xl md:text-7xl mb-4 md:mb-6 drop-shadow-sm filter grayscale-[0.2]">{quickDef.emoji}</div>
                    <h3 className="text-2xl md:text-3xl font-bold text-slate-900 capitalize mb-2 tracking-tight">{quickDef.word}</h3>
                    <p className="text-primary-500 font-bold font-mono bg-primary-50 inline-block px-4 py-1.5 rounded-full text-sm">/{quickDef.pronunciation}/</p>
                    
                    <div className="flex justify-center gap-3 mt-6 md:mt-8">
                        <button onClick={() => playTTS(quickDef.word)} className="w-12 h-12 rounded-2xl bg-white border border-slate-100 text-slate-600 hover:border-primary-500 hover:text-primary-500 transition-colors shadow-sm flex items-center justify-center"><span className="material-symbols-rounded text-2xl">volume_up</span></button>
                        <button 
                            onClick={() => onToggleSave(quickDef.word)} 
                            className={`flex-1 px-6 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-lg ${isSaved(quickDef.word) ? 'bg-green-100 text-green-700 shadow-green-200' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'}`}
                        >
                            <span className="material-symbols-rounded text-xl">{isSaved(quickDef.word) ? 'bookmark_added' : 'bookmark_add'}</span>
                            {isSaved(quickDef.word) ? 'Kaydedildi' : 'Kaydet'}
                        </button>
                    </div>
                </div>
                <div className="p-6 md:p-8 pt-0 bg-white">
                    <div className="bg-slate-50 rounded-3xl p-6 text-center border border-slate-100">
                         <p className="text-lg md:text-xl font-bold text-slate-900 mb-3">{quickDef.turkish_meaning}</p>
                         <div className="h-px w-12 bg-slate-200 mx-auto mb-3"></div>
                         <p className="text-sm text-slate-500 font-medium leading-relaxed">"{quickDef.english_definition}"</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Detailed Word Modal - Mobile Full Screen/Sheet */}
      {selectedWord && (
          <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-6 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedWord(null)}>
             <div className="bg-white rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in slide-in-from-bottom-12 duration-500 max-h-[90vh] md:max-h-none overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="bg-primary-600 p-8 md:p-10 text-white relative overflow-hidden">
                    {/* Abstract Shapes */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-accent opacity-20 rounded-full -ml-10 -mb-10 blur-2xl"></div>
                    
                    <button onClick={() => setSelectedWord(null)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors backdrop-blur-md"><span className="material-symbols-rounded">close</span></button>
                    
                    <span className="inline-block px-3 py-1 rounded-lg bg-black/20 text-[10px] font-bold uppercase tracking-widest mb-6 backdrop-blur-md border border-white/10">{selectedWord.type}</span>
                    <h2 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">{selectedWord.word}</h2>
                    <div className="flex items-center gap-3">
                        <span className="font-mono text-lg opacity-80">/{selectedWord.ipa}/</span>
                        <button onClick={() => playTTS(selectedWord.word)} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center hover:bg-white text-white hover:text-primary-600 transition-all"><span className="material-symbols-rounded text-lg">volume_up</span></button>
                    </div>
                </div>
                <div className="p-8 md:p-10 space-y-6 md:space-y-8">
                    <div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedWord.turkish_meaning}</h3>
                        <p className="text-slate-600 leading-relaxed font-medium text-lg">{selectedWord.definition}</p>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 relative">
                        <div className="absolute -top-3 left-6 bg-white border border-slate-100 px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-400 uppercase tracking-widest">Örnek Cümle</div>
                        <p className="text-slate-700 italic font-medium">"{selectedWord.example_sentence}"</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Eş Anlamlısı</span>
                            <span className="font-bold text-slate-800 text-lg">{selectedWord.synonym}</span>
                         </div>
                         <div className="p-5 rounded-3xl bg-white border border-slate-100 hover:border-slate-200 hover:shadow-lg transition-all">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Zıt Anlamlısı</span>
                            <span className="font-bold text-slate-800 text-lg">{selectedWord.antonym}</span>
                         </div>
                    </div>
                </div>
             </div>
          </div>
      )}

      <PronunciationModal text={practiceText || ""} isOpen={!!practiceText} onClose={() => setPracticeText(null)} />
    </div>
  );
};

export default ReadingSection;
