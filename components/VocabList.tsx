import React, { useState } from 'react';
import { Word } from '../types';
import { playTTS } from '../services/geminiService';

interface VocabListProps {
  words: Word[];
  savedWords: string[];
  onToggleSave: (word: string) => void;
}

const VocabList: React.FC<VocabListProps> = ({ words, savedWords, onToggleSave }) => {
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handlePlay = async (word: string) => {
    if (playingWord) return;
    setPlayingWord(word);
    try {
      await playTTS(word);
    } catch (e) {
      console.error(e);
      alert("Ses çalınamadı.");
    } finally {
      setTimeout(() => setPlayingWord(null), 1000);
    }
  };

  const isSaved = (w: string) => savedWords.includes(w.toLowerCase());

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-center cursor-pointer lg:cursor-default"
      >
        <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Hedef Kelimeler
            </h3>
        </div>
        <div className="lg:hidden text-slate-500">
             <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
             </svg>
        </div>
      </div>
      
      {/* List */}
      <div className={`${isOpen ? 'block' : 'hidden'} lg:block lg:max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar`}>
        <div className="flex flex-col">
          {words.map((word, idx) => (
            <div key={idx} className={`p-4 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors group relative ${isSaved(word.word) ? 'bg-blue-50/30' : ''}`}>
              {/* Left accent border */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${isSaved(word.word) ? 'bg-blue-500' : 'bg-transparent group-hover:bg-slate-300'}`}></div>
              
              <div className="flex justify-between items-start mb-1 pl-2">
                <div>
                   <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{word.word}</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 border border-slate-200 px-1 rounded">
                            {word.type}
                        </span>
                   </div>
                   <span className="text-xs text-slate-500 block mt-0.5">{word.turkish_meaning}</span>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handlePlay(word.word); }}
                    disabled={playingWord !== null}
                    className="p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                  >
                     {playingWord === word.word ? (
                       <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                     ) : (
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.983 5.983 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                     )}
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleSave(word.word); }}
                    className={`p-1.5 rounded hover:bg-white border border-transparent hover:border-slate-200 transition-all ${isSaved(word.word) ? 'text-blue-600' : 'text-slate-400 hover:text-blue-600'}`}
                  >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill={isSaved(word.word) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-slate-50 p-3 text-center border-t border-slate-200">
         <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">Çalışma Listesi</p>
      </div>
    </div>
  );
};

export default VocabList;