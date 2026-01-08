
import React, { useState, useRef } from 'react';
import { analyzePronunciation, stopTTS } from '../services/geminiService';
import { AnalysisResult } from '../types';
import AudioVisualizer from './AudioVisualizer';

interface PronunciationModalProps {
  text: string;
  isOpen: boolean;
  onClose: () => void;
}

const PronunciationModal: React.FC<PronunciationModalProps> = ({ text, isOpen, onClose }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    stopTTS();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      // Fix: Explicitly type 'e' as BlobEvent
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
        if (e.data && e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        handleAnalysis(audioBlob);
        
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) {
      console.error("Microphone access denied:", err);
      alert("Mikrofon izni gerekli.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleAnalysis = async (blob: Blob) => {
    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = async () => {
      const resultString = reader.result as string;
      if (resultString) {
          const base64String = resultString.split(',')[1];
          try {
            const analysis = await analyzePronunciation(base64String, text);
            setResult(analysis);
          } catch (error) {
            console.error(error);
            alert("Analiz sırasında bir hata oluştu.");
          } finally {
            setIsAnalyzing(false);
          }
      }
    };
  };

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-emerald-600 border-emerald-500 bg-emerald-50';
      if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-50';
      return 'text-red-600 border-red-500 bg-red-50';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/20" onClick={e => e.stopPropagation()}>
        <div className="bg-zinc-50 p-6 border-b border-zinc-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-zinc-800 flex items-center gap-2">
             <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </div>
             Telaffuz Koçu
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 transition-colors p-2 hover:bg-zinc-200 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 text-center space-y-8">
           <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm relative overflow-hidden group">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 group-hover:w-1.5 transition-all"></div>
             <p className="text-xl font-serif text-zinc-800 leading-relaxed">"{text}"</p>
           </div>

           <div className="flex flex-col items-center justify-center min-h-[100px]">
              {!isRecording && !isAnalyzing && (
                 <button
                    onClick={startRecording}
                    className="flex flex-col items-center gap-3 group"
                 >
                    <div className="w-20 h-20 rounded-full bg-indigo-600 text-white shadow-xl shadow-indigo-200 flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-400 group-hover:text-indigo-600 transition-colors">Kaydı Başlat</span>
                 </button>
              )}

              {isRecording && (
                <div className="flex flex-col items-center gap-4 w-full">
                    <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                    <button
                        onClick={stopRecording}
                        className="px-6 py-2 bg-red-50 text-red-600 border border-red-200 rounded-full font-bold text-sm hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Kaydı Durdur
                    </button>
                </div>
              )}

              {isAnalyzing && (
                 <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-full border-4 border-zinc-100 border-t-indigo-600 animate-spin"></div>
                    <span className="text-sm font-bold text-zinc-400 animate-pulse">Analiz Ediliyor...</span>
                 </div>
              )}
           </div>
        </div>

        {result && (
          <div className="bg-zinc-50 border-t border-zinc-200 p-6 animate-in slide-in-from-bottom-5">
             <div className="flex items-start gap-4 mb-4">
                 <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white ${getScoreColor(result.score)}`}>
                     <span className="text-xl font-black">{result.score}</span>
                 </div>
                 
                 <div className="flex-1">
                    <h4 className="font-bold text-zinc-800 text-xs uppercase tracking-wide mb-1 opacity-70">
                        AI Geri Bildirimi
                    </h4>
                    <p className="text-zinc-600 text-sm leading-relaxed">{result.feedback}</p>
                 </div>
             </div>

             {result.corrections.length > 0 ? (
                <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden">
                   <div className="bg-zinc-100 px-4 py-2 border-b border-zinc-200 text-[10px] font-bold text-zinc-500 uppercase">Telaffuz Hataları</div>
                   <div className="divide-y divide-zinc-100">
                   {result.corrections.map((c, i) => (
                       <div key={i} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                           <div className="flex items-center gap-2 min-w-[100px]">
                               <span className="font-bold text-zinc-800">{c.original}</span>
                               <span className="text-zinc-300">→</span>
                           </div>
                           <div className="flex items-center gap-2 flex-1">
                               <div className="flex flex-col gap-1">
                                 <span className="font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-xs border border-red-100 w-fit">{c.pronounced}</span>
                                 {c.correct_pronunciation && (
                                     <span className="font-mono text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded text-xs border border-emerald-100 w-fit">
                                         {c.correct_pronunciation}
                                     </span>
                                 )}
                               </div>
                               <span className="text-zinc-500 italic text-xs border-l border-zinc-200 pl-2">{c.note}</span>
                           </div>
                       </div>
                   ))}
                   </div>
                </div>
             ) : (
                <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-center gap-2 text-emerald-700 text-sm font-bold">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Mükemmel telaffuz!
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationModal;
