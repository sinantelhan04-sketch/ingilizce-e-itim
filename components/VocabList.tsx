
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

  const handlePlay = async (word: string) => {
    if (playingWord) return;
    setPlayingWord(word);
    try { await playTTS(word); } 
    catch (e) { console.error(e); } 
    finally { setTimeout(() => setPlayingWord(null), 1000); }
  };

  const isSaved = (w: string) => savedWords.includes(w.toLowerCase());

  const getCardColor = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes('noun')) return 'border-l-blue-500 bg-blue-50/50';
      if (t.includes('verb')) return 'border-l-green-500 bg-green-50/50';
      if (t.includes('adj')) return 'border-l-purple-500 bg-purple-50/50';
      return 'border-l-slate-500 bg-slate-50/50';
  };

  return (
    <div className="space-y-4">
      <div className="bg-primary rounded-3xl p-6 text-white relative overflow-hidden shadow-lg">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            <div className="relative z-10 flex justify-between items-center">
                <div>
                    <h3 className="font-display font-bold text-2xl">Kelime Kartları</h3>
                    <p className="text-primary-light text-sm font-medium">{words.length} yeni kelime</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <span className="material-symbols-rounded text-2xl">style</span>
                </div>
            </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 pb-4">
          {words.map((word, idx) => (
            <div 
                key={idx} 
                className={`bg-white rounded-3xl p-5 border-l-[6px] shadow-sm relative overflow-hidden ${getCardColor(word.type)}`}
            >
                <div className="flex justify-between items-start mb-2">
                    <span className="px-2 py-1 rounded-lg bg-white/60 backdrop-blur-sm text-[10px] font-black uppercase tracking-wider text-slate-500 border border-slate-100">
                        {word.type}
                    </span>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => handlePlay(word.word)}
                            className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm text-slate-700 active:scale-90 transition-transform"
                        >
                            <span className="material-symbols-rounded text-xl">volume_up</span>
                        </button>
                        <button 
                            onClick={() => onToggleSave(word.word)}
                            className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm active:scale-90 transition-transform ${isSaved(word.word) ? 'bg-warning text-white' : 'bg-white text-slate-300'}`}
                        >
                            <span className="material-symbols-rounded text-xl">bookmark</span>
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-2xl font-display font-black text-slate-800">{word.word}</h4>
                    {word.emoji && <span className="text-3xl filter drop-shadow-sm animate-in zoom-in">{word.emoji}</span>}
                </div>
                
                <div className="text-slate-400 font-mono text-sm mb-4">/{word.ipa}/</div>
                
                <div className="bg-white/80 p-4 rounded-2xl border border-white/50 backdrop-blur-sm mb-2">
                    <p className="text-slate-900 font-bold text-lg mb-1">{word.turkish_meaning}</p>
                    <p className="text-sm text-slate-500 leading-snug">{word.definition}</p>
                </div>

                <div className="pl-2 border-l-2 border-slate-200 mt-3">
                    <p className="text-xs text-slate-600 italic">"{word.example_sentence}"</p>
                </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default VocabList;
