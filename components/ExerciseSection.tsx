import React, { useState } from 'react';
import { Exercise } from '../types';

interface ExerciseSectionProps {
  exercises: Exercise[];
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ exercises }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerChange = (id: number, value: string) => {
    if (showResults) return;
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const calculateScore = () => {
    let correct = 0;
    exercises.forEach(ex => {
      if (answers[ex.id]?.toLowerCase() === ex.answer.toLowerCase()) correct++;
    });
    return correct;
  };

  const score = calculateScore();
  const allAnswered = exercises.every(ex => answers[ex.id]);

  return (
    <div className="bg-white rounded-[2.5rem] p-8 md:p-12 border border-slate-100 shadow-dribbble relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-accent-light rounded-full blur-3xl -mr-20 -mt-20 opacity-40"></div>
        
       <div className="flex items-center justify-between mb-12 relative z-10">
           <div>
               <h3 className="text-2xl font-bold text-slate-900 tracking-tight">Quiz Zamanı</h3>
               <p className="text-slate-500 font-medium mt-1">Bilgini test etme vakti</p>
           </div>
           <div className="w-16 h-16 rounded-3xl bg-white text-accent flex items-center justify-center border border-slate-100 shadow-card">
               <span className="material-symbols-rounded text-3xl">psychology</span>
           </div>
       </div>

       <div className="space-y-16 relative z-10">
           {exercises.map((ex, idx) => (
               <div key={ex.id} className="animate-in slide-in-from-bottom-4 duration-700" style={{animationDelay: `${idx * 100}ms`}}>
                    <div className="flex gap-5 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0 shadow-lg shadow-slate-900/20">
                            {idx + 1}
                        </div>
                        <h4 className="font-bold text-xl text-slate-800 leading-snug pt-1">
                            {ex.question}
                        </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 pl-0 md:pl-16">
                        {ex.options.map((opt, i) => {
                            const isSelected = answers[ex.id] === opt;
                            const isCorrect = ex.answer.toLowerCase() === opt.toLowerCase();
                            
                            let btnClass = "bg-white border-2 border-slate-100 text-slate-500 hover:border-slate-300 hover:bg-slate-50";
                            let icon = <span className="w-6 h-6 rounded-full border-2 border-slate-200"></span>;
                            
                            if (showResults) {
                                if (isCorrect) {
                                    btnClass = "bg-green-50 border-green-500 text-green-700";
                                    icon = <span className="material-symbols-rounded text-green-600">check_circle</span>;
                                } else if (isSelected) {
                                    btnClass = "bg-red-50 border-red-500 text-red-700";
                                    icon = <span className="material-symbols-rounded text-red-600">cancel</span>;
                                } else {
                                    btnClass = "bg-slate-50 border-slate-100 text-slate-300 opacity-50"; 
                                }
                            } else if (isSelected) {
                                btnClass = "bg-slate-900 border-slate-900 text-white shadow-xl shadow-slate-900/10 scale-[1.01]";
                                icon = <span className="material-symbols-rounded text-accent">check_circle</span>;
                            }

                            return (
                                <button 
                                    key={i}
                                    disabled={showResults}
                                    onClick={() => handleAnswerChange(ex.id, opt)}
                                    className={`w-full p-5 rounded-2xl text-left font-bold transition-all duration-200 flex items-center justify-between group ${btnClass}`}
                                >
                                    <span>{opt}</span>
                                    {icon}
                                </button>
                            )
                        })}
                    </div>
               </div>
           ))}
       </div>

       <div className="mt-16 pt-10 border-t border-slate-100 relative z-10">
           {!showResults ? (
               <button 
                onClick={() => setShowResults(true)}
                disabled={!allAnswered}
                className="w-full py-5 bg-primary-600 text-white rounded-2xl font-bold text-lg hover:bg-primary-700 transition-all shadow-xl shadow-primary-600/30 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
               >
                   Cevapları Kontrol Et
               </button>
           ) : (
               <div className="text-center animate-in zoom-in duration-300">
                   <div className="inline-flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 mb-8">
                       <span className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">Skorun</span>
                       <div className="text-5xl font-black text-slate-900">
                         <span className={score === exercises.length ? 'text-green-500' : 'text-primary-600'}>{score}</span>
                         <span className="text-slate-300 text-3xl">/{exercises.length}</span>
                       </div>
                   </div>
                   <button 
                    onClick={() => { setAnswers({}); setShowResults(false); document.getElementById('reading-section')?.scrollIntoView({behavior: 'smooth'}); }}
                    className="w-full py-5 bg-white text-slate-900 border-2 border-slate-100 hover:border-slate-900 rounded-2xl font-bold text-lg transition-all"
                   >
                       Tekrar Dene
                   </button>
               </div>
           )}
       </div>
    </div>
  );
};

export default ExerciseSection;