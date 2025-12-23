import React, { useState, useRef, useEffect } from 'react';
import { Word } from '../types';
import { playTTS, stopTTS, getQuickDefinition, translateSentence } from '../services/geminiService';
import PronunciationModal from './PronunciationModal';

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
  const [isPlayingWord, setIsPlayingWord] = useState(false);
  
  // Sentence state
  const [activeSentenceIndex, setActiveSentenceIndex] = useState<number | null>(null);
  const [translatedSentenceIndex, setTranslatedSentenceIndex] = useState<number | null>(null);
  const [sentenceTranslation, setSentenceTranslation] = useState<string | null>(null);
  const [loadingTranslation, setLoadingTranslation] = useState(false);

  // Pronunciation Practice State
  const [practiceText, setPracticeText] = useState<string | null>(null);

  // Ref to control the playback loop
  const shouldStopRef = useRef(false);

  // Stop audio when component unmounts
  useEffect(() => {
    return () => {
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
    if (isPlayingPassage) {
        handleStop();
        return;
    }

    setIsPlayingPassage(true);
    shouldStopRef.current = false;
    
    try {
      const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
      const segments = Array.from(segmenter.segment(passage)) as any[];

      for (let i = 0; i < segments.length; i++) {
        if (shouldStopRef.current) break;

        setActiveSentenceIndex(i);
        const sentence = segments[i].segment;
        const cleanSentence = sentence.replace(/\*\*/g, '');
        
        await playTTS(cleanSentence);
      }
    } catch (e) {
      console.error(e);
      alert("Metin seslendirilemedi.");
    } finally {
      setIsPlayingPassage(false);
      setActiveSentenceIndex(null);
      shouldStopRef.current = false;
    }
  };

  const handlePlayWord = async (word: string) => {
    if (isPlayingWord) return;
    if (isPlayingPassage) handleStop();

    setIsPlayingWord(true);
    try {
      await playTTS(word);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPlayingWord(false);
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
        console.error(e);
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

  const renderInteractiveSentence = (sentence: string) => {
    const tokens = sentence.split(' ');
    
    return tokens.map((token, index) => {
      const isBold = token.includes('**');
      const displayToken = token.replace(/\*\*/g, ''); 
      
      return (
        <React.Fragment key={index}>
          <span 
            onClick={(e) => {
                e.stopPropagation();
                handleWordClick(displayToken, sentence);
            }}
            className={`inline-block cursor-pointer rounded-sm transition-colors duration-150 ${
                isBold 
                ? 'font-bold text-blue-900 border-b border-blue-400 hover:bg-blue-50' 
                : 'hover:bg-slate-100 hover:text-black'
            } ${loadingDef === displayToken ? 'bg-slate-200 animate-pulse' : ''}`}
          >
            {displayToken}
          </span>
          {' '}
        </React.Fragment>
      );
    });
  };

  const renderPassage = () => {
     const segmenter = new (Intl as any).Segmenter('en', { granularity: 'sentence' });
     const segments = Array.from(segmenter.segment(passage)) as any[];

     return segments.map((seg, idx) => (
         <span key={idx} className="relative inline">
             <span 
                onClick={() => setActiveSentenceIndex(idx)}
                className={`transition-colors duration-300 decoration-clone cursor-text ${
                    activeSentenceIndex === idx 
                    ? 'bg-yellow-50/80' 
                    : ''
                }`}
             >
                 {renderInteractiveSentence(seg.segment)}
             </span>
             
             {/* Interaction Popup - More refined look */}
             {activeSentenceIndex === idx && (
                 <span className="block my-4 p-4 bg-white rounded-lg border border-slate-200 shadow-md animate-in fade-in zoom-in-95 duration-200">
                     <div className="flex flex-wrap items-center gap-2 mb-2">
                         <button 
                            onClick={() => handleTranslateSentence(idx, seg.segment)}
                            className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-md hover:bg-blue-100 transition-colors flex items-center gap-1.5"
                         >
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                             </svg>
                             {translatedSentenceIndex === idx ? 'Gizle' : 'Türkçesi'}
                         </button>
                         <button 
                             onClick={() => playTTS(seg.segment.replace(/\*\*/g, ''))}
                             className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md hover:bg-slate-100 transition-colors flex items-center gap-1.5"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                            </svg>
                             Dinle
                         </button>
                         <button 
                             onClick={() => setPracticeText(seg.segment.replace(/\*\*/g, ''))}
                             className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-md hover:bg-purple-100 transition-colors flex items-center gap-1.5"
                         >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                              </svg>
                             Telaffuz
                         </button>
                     </div>
                     
                     {translatedSentenceIndex === idx && (
                         <div className="mt-2 text-sm text-slate-700 font-medium border-l-2 border-blue-500 pl-3 py-1">
                             {loadingTranslation ? (
                                 <span className="flex items-center gap-2 text-slate-400">
                                     <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                     Çevriliyor...
                                 </span>
                             ) : (
                                 sentenceTranslation
                             )}
                         </div>
                     )}
                 </span>
             )}
         </span>
     ));
  };

  const isSaved = (w: string) => savedWords.includes(w.toLowerCase());

  return (
    <div className="p-8 lg:p-10 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-4 border-b border-slate-100 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-lg text-slate-600">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
              <h3 className="text-lg font-bold text-slate-800">Okuma Metni</h3>
              <p className="text-xs text-slate-500">Akademik Makale</p>
          </div>
        </div>
        
        <button 
          onClick={handlePlayPassage}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-all border ${
              isPlayingPassage 
              ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100' 
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:text-blue-700'
          }`}
        >
          {isPlayingPassage ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clipRule="evenodd" />
              </svg>
              Durdur
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
              Sesli Oku
            </>
          )}
        </button>
      </div>
      
      <div className="prose prose-lg max-w-none">
        <p className="text-lg leading-loose text-slate-700 font-serif antialiased">
          {renderPassage()}
        </p>
      </div>
      
      {/* QUICK DEFINITION MODAL */}
      {quickDef && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setQuickDef(null)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5" onClick={e => e.stopPropagation()}>
                {/* Header with Emoji background or large icon */}
                <div className="bg-gradient-to-br from-slate-50 to-slate-100 p-6 border-b border-slate-100 relative">
                     <button onClick={() => setQuickDef(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                    
                    <div className="flex flex-col items-center text-center">
                        <div className="text-5xl mb-3 filter drop-shadow-sm leading-normal">{quickDef.emoji}</div>
                        <h4 className="font-bold text-2xl text-slate-900 capitalize font-serif tracking-tight">{quickDef.word}</h4>
                        
                        <div className="flex items-center gap-3 mt-2">
                             <span className="font-mono text-xs text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 shadow-sm">/{quickDef.pronunciation}/</span>
                             <div className="flex gap-1">
                                <button 
                                    onClick={() => handlePlayWord(quickDef.word)}
                                    disabled={isPlayingWord}
                                    className="p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 transition-colors"
                                    title="Dinle"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" /></svg>
                                </button>
                                <button
                                    onClick={() => onToggleSave(quickDef.word)}
                                    className={`p-1.5 rounded-full transition-colors ${isSaved(quickDef.word) ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                                    title="Kaydet"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isSaved(quickDef.word) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                                    </svg>
                                </button>
                             </div>
                        </div>
                    </div>
                </div>

                <div className="p-5 space-y-4">
                    {/* Turkish Meaning */}
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 mb-1 block">Türkçe Anlam</span>
                        <p className="text-lg font-bold text-slate-800 leading-snug">{quickDef.turkish_meaning}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-3"></div>

                    {/* English Definition */}
                    <div>
                        <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1 block">İngilizce Tanım</span>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{quickDef.english_definition}</p>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* TARGET WORD DETAILED MODAL */}
      {selectedWord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedWord(null)}>
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="bg-slate-900 p-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 flex gap-2 z-10">
                 <button
                    onClick={() => onToggleSave(selectedWord.word)}
                    className={`p-2 rounded-md transition-colors ${isSaved(selectedWord.word) ? 'bg-blue-600 text-white' : 'bg-white/10 text-slate-300 hover:bg-white/20'}`}
                 >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isSaved(selectedWord.word) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                 </button>
                 <button onClick={() => setSelectedWord(null)} className="text-slate-400 hover:text-white transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
               </div>
              
              <div className="flex flex-col gap-1 relative z-10">
                <div className="flex items-center gap-3">
                    <h4 className="text-3xl font-serif font-bold text-white tracking-wide">{selectedWord.word}</h4>
                    <button 
                        onClick={() => handlePlayWord(selectedWord.word)}
                        disabled={isPlayingWord}
                        className="p-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 shadow-lg shadow-blue-900/50"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={() => setPracticeText(selectedWord.word)}
                        className="p-1.5 rounded-full bg-purple-600 hover:bg-purple-500 text-white transition-colors shadow-lg shadow-purple-900/50"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                         </svg>
                    </button>
                </div>
                <div className="flex items-center gap-3 mt-1 text-slate-400 text-sm">
                    <span className="font-mono">/{selectedWord.ipa}/</span>
                    <span className="w-1 h-1 bg-slate-500 rounded-full"></span>
                    <span className="italic">{selectedWord.type}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 space-y-6 bg-slate-50">
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                <h5 className="text-xs uppercase tracking-wide text-slate-400 font-bold mb-2">Anlam & Tanım</h5>
                <p className="text-lg font-bold text-slate-900">{selectedWord.turkish_meaning}</p>
                <p className="text-slate-600 mt-1 text-sm leading-relaxed">{selectedWord.definition}</p>
              </div>
              
              <div className="bg-white p-4 rounded-lg border-l-4 border-amber-400 shadow-sm">
                <h5 className="text-xs uppercase tracking-wide text-amber-600 font-bold mb-2">Örnek Kullanım</h5>
                <p className="text-slate-800 italic font-serif leading-relaxed">"{selectedWord.example_sentence}"</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Eş Anlam</span>
                  <span className="text-slate-700 font-medium text-sm">{selectedWord.synonym}</span>
                </div>
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">Zıt Anlam</span>
                  <span className="text-slate-700 font-medium text-sm">{selectedWord.antonym}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRONUNCIATION PRACTICE MODAL */}
      <PronunciationModal 
        text={practiceText || ""} 
        isOpen={!!practiceText} 
        onClose={() => setPracticeText(null)} 
      />
    </div>
  );
};

export default ReadingSection;