import React, { useState } from 'react';
import { Exercise } from '../types';

interface ExerciseSectionProps {
  exercises: Exercise[];
}

const ExerciseSection: React.FC<ExerciseSectionProps> = ({ exercises }) => {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);

  const handleAnswerChange = (id: number, value: string) => {
    setAnswers(prev => ({ ...prev, [id]: value }));
  };

  const checkAnswers = () => {
    setShowResults(true);
  };

  const reset = () => {
    setAnswers({});
    setShowResults(false);
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
       <div className="p-6 border-b border-slate-100 flex items-center gap-3">
        <div className="p-1.5 bg-slate-100 rounded text-slate-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div>
            <h3 className="text-lg font-bold text-slate-800">Alıştırmalar</h3>
            <p className="text-xs text-slate-500">Öğrendiklerinizi test edin</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {exercises.map((ex) => (
          <div key={ex.id} className="pb-6 border-b border-slate-100 last:border-0 last:pb-0">
            <div className="flex gap-4 mb-4">
              <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold text-xs mt-0.5">
                {ex.id}
              </span>
              <p className="text-base font-medium text-slate-800 leading-relaxed">
                {ex.question}
              </p>
            </div>

            {ex.type === 'fill-in-blank' && ex.options && (
              <div className="pl-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {ex.options.map(opt => (
                  <button
                    key={opt}
                    onClick={() => handleAnswerChange(ex.id, opt)}
                    disabled={showResults}
                    className={`px-4 py-2.5 text-sm rounded-md border text-left transition-all ${
                      answers[ex.id] === opt 
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {ex.type === 'matching' && ex.options && (
               <div className="pl-10 max-w-md">
                   <select 
                    className="w-full p-2.5 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none text-slate-700 text-sm shadow-sm"
                    value={answers[ex.id] || ''}
                    onChange={(e) => handleAnswerChange(ex.id, e.target.value)}
                    disabled={showResults}
                   >
                     <option value="">Seçiniz...</option>
                     {ex.options.map((opt, i) => (
                       <option key={i} value={opt}>{opt}</option>
                     ))}
                   </select>
               </div>
            )}

            {showResults && (
              <div className={`mt-3 pl-10 text-sm flex items-center gap-2 ${
                answers[ex.id]?.toLowerCase() === ex.answer.toLowerCase() 
                  ? 'text-green-700' 
                  : 'text-red-600'
              }`}>
                {answers[ex.id]?.toLowerCase() === ex.answer.toLowerCase() 
                  ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-semibold">Doğru</span>
                    </>
                  )
                  : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                      <span>Yanlış. Cevap: <span className="font-bold">{ex.answer}</span></span>
                    </>
                  )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-end">
        {!showResults ? (
          <button 
            onClick={checkAnswers} 
            className="bg-slate-900 text-white px-6 py-2.5 rounded-md hover:bg-slate-800 transition-all font-semibold text-sm shadow-sm"
          >
            Kontrol Et
          </button>
        ) : (
          <button 
            onClick={reset} 
            className="bg-white border border-slate-300 text-slate-700 px-6 py-2.5 rounded-md hover:bg-slate-50 transition-all font-semibold text-sm shadow-sm"
          >
            Sıfırla
          </button>
        )}
      </div>
    </div>
  );
};

export default ExerciseSection;