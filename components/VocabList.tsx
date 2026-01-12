
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

  // Dynamic style generator based on word type or index
  const getCardStyle = (index: number, type: string) => {
     const t = type.toLowerCase();
     if (t.includes('noun')) return 'bg-blue-50 border-blue-100 hover:border-blue-300 hover:shadow-blue-200';
     if (t.includes('verb')) return 'bg-green-50 border-green-100 hover:border-green-300 hover:shadow-green-200';
     if (t.includes('adj')) return 'bg-purple-50 border-purple-100 hover:border-purple-300 hover:shadow-purple-200';
     
     // Fallback to cycling colors
     const colors = [
         'bg-orange-50 border-orange-100 hover:border-orange-300 hover:shadow-orange-200',
         'bg-rose-50 border-rose-100 hover:border-rose-300 hover:shadow-rose-200',
         'bg-cyan-50 border-cyan-100 hover:border-cyan-300 hover:shadow-cyan-200'
     ];
     return colors[index % colors.length];
  };

  const getTagColor = (type: string) => {
      const t = type.toLowerCase();
      if (t.includes('noun')) return 'bg-blue-100 text-blue-700';
      if (t.includes('verb')) return 'bg-green-100 text-green-700';
      if (t.includes('adj')) return 'bg-purple-100 text-purple-700';
      return 'bg-slate-200 text-slate-700';
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-[2.5rem] p-8 border border-indigo-500/30 shadow-xl shadow-indigo-500/20 flex items-center justify-between relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white rounded-full blur-3xl -mr-10 -mt-10 opacity-20"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500 rounded-full blur-3xl -ml-10 -mb-10 opacity-30"></div>
            
            <div className="relative z-10">
                <h3 className="font-display font-bold text-3xl tracking-wide">Kelime Kartları</h3>
                <p className="text-indigo-100 font-medium mt-1">Bugün öğrenilecek {words.length} süper kelime!</p>
            </div>
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-inner border border-white/20 relative z-10 transform rotate-6">
                <span className="material-symbols-rounded text-3xl">style</span>
            </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {words.map((word, idx) => (
            <div 
                key={idx} 
                className={`rounded-[2rem] p-6 border-2 transition-all duration-300 group relative flex flex-col h-full hover:-translate-y-1 hover:shadow-xl ${getCardStyle(idx, word.type)}`}
            >
                <div className="flex justify-between items-start mb-4">
                    <span className={`inline-block px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider ${getTagColor(word.type)}`}>
                        {word.type}
                    </span>
                    <div className="flex gap-2">
                        <button onClick={() => handlePlay(word.word)} className="w-10 h-10 rounded-xl bg-white hover:bg-black hover:text-white flex items-center justify-center transition-all shadow-sm"><span className="material-symbols-rounded text-xl">volume_up</span></button>
                        <button onClick={() => onToggleSave(word.word)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm ${isSaved(word.word) ? 'bg-yellow-400 text-yellow-900' : 'bg-white text-slate-400 hover:text-slate-600'}`}><span className="material-symbols-rounded text-xl">bookmark</span></button>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 mb-1">
                    <h4 className="text-3xl font-display font-bold text-slate-800 tracking-tight">{word.word}</h4>
                    {word.emoji && <span className="text-3xl filter drop-shadow-sm transform group-hover:scale-125 transition-transform duration-300">{word.emoji}</span>}
                </div>
                
                <div className="text-slate-400 font-mono text-sm mb-4">/{word.ipa}/</div>
                <p className="text-slate-700 font-bold text-lg mb-6 leading-relaxed border-l-4 border-black/10 pl-3">{word.turkish_meaning}</p>
                
                <div className="mt-auto bg-white/60 p-4 rounded-2xl border border-black/5">
                    <p className="text-sm text-slate-600 font-medium italic">"{word.example_sentence}"</p>
                </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default VocabList;
