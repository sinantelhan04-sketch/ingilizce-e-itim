import React, { useState } from 'react';
import { evaluateWriting } from '../services/geminiService';
import { WritingAnalysisResult } from '../types';

const WritingExercise: React.FC<{ passage: string }> = ({ passage }) => {
  const [userInput, setUserInput] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<WritingAnalysisResult | null>(null);

  const handleEvaluate = async () => {
    if (!userInput.trim() || userInput.length < 10) return;
    setIsAnalyzing(true);
    setResult(null);
    try {
        const analysis = await evaluateWriting(passage.replace(/\*\*/g, ''), userInput);
        setResult(analysis);
    } catch (e) { console.error(e); } 
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-card h-full flex flex-col justify-between group hover:shadow-float transition-all duration-300">
        <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 rounded-3xl bg-accent-light text-accent flex items-center justify-center border border-pink-100">
                <span className="material-symbols-rounded text-2xl">edit_note</span>
             </div>
             <div>
                <h3 className="font-bold text-xl text-slate-900 tracking-tight">Yazma Pratiği</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Özet Çıkarma</p>
             </div>
        </div>
        
        {!result ? (
            <div className="flex-1 flex flex-col">
                <textarea 
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    className="flex-1 w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-accent/30 focus:ring-4 focus:ring-accent/10 rounded-2xl p-5 text-slate-700 font-medium resize-none transition-all placeholder:text-slate-400 mb-6 text-lg"
                    placeholder="Metni Türkçe olarak özetle..."
                />
                <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{userInput.length} karakter</span>
                    <button 
                        onClick={handleEvaluate}
                        disabled={isAnalyzing || !userInput.trim()}
                        className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-all disabled:opacity-50 disabled:shadow-none"
                    >
                        {isAnalyzing ? 'Kontrol Ediliyor...' : 'Gönder'}
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right duration-500">
                 <div className="bg-primary-50 border border-primary-100 rounded-[2rem] p-6 mb-6 flex items-center gap-6">
                     <div className="text-center min-w-[80px]">
                        <div className="text-4xl font-black text-primary-600 tracking-tighter">{result.score}</div>
                        <span className="text-[10px] font-bold text-primary-400 uppercase tracking-widest">Puan</span>
                     </div>
                     <div className="w-px h-12 bg-primary-200"></div>
                     <p className="text-sm text-slate-700 font-medium leading-relaxed">{result.feedback}</p>
                 </div>
                 
                 <div className="bg-white border border-slate-100 p-6 rounded-[2rem] mb-6 flex-1 shadow-sm">
                     <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Daha İyi Bir Versiyon</h5>
                     <p className="text-base font-medium text-slate-800 leading-relaxed font-serif italic">"{result.better_version}"</p>
                 </div>
                 
                 <button onClick={() => setResult(null)} className="w-full py-4 border-2 border-slate-100 text-slate-500 hover:text-slate-900 hover:border-slate-900 rounded-2xl font-bold transition-all">
                    Tekrar Dene
                 </button>
            </div>
        )}
    </div>
  );
};

export default WritingExercise;