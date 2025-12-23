import React, { useState, useRef } from 'react';
import { analyzePronunciation } from '../services/geminiService';
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
  
  // State for Visualizer
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  if (!isOpen) return null;

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream); // Set stream for visualizer

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        handleAnalysis(audioBlob);
        
        // Stop all tracks to release mic
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
      const base64String = (reader.result as string).split(',')[1];
      try {
        const analysis = await analyzePronunciation(base64String, text);
        setResult(analysis);
      } catch (error) {
        console.error(error);
        alert("Analiz sırasında bir hata oluştu.");
      } finally {
        setIsAnalyzing(false);
      }
    };
  };

  const getScoreColor = (score: number) => {
      if (score >= 80) return 'text-green-600 border-green-500 bg-green-50';
      if (score >= 50) return 'text-amber-600 border-amber-500 bg-amber-50';
      return 'text-red-600 border-red-500 bg-red-50';
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="bg-slate-50 p-6 border-b border-slate-200 flex justify-between items-center">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
             <span className="p-1.5 bg-purple-100 text-purple-600 rounded-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </span>
             Telaffuz Koçu
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-8 text-center space-y-6">
           <div className="bg-white p-4 rounded-lg border border-slate-100 shadow-sm relative overflow-hidden">
             <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
             <p className="text-lg font-serif text-slate-800 leading-relaxed">"{text}"</p>
           </div>

           <div className="flex flex-col items-center justify-center h-24">
              {!isRecording && !isAnalyzing && (
                 <button
                    onClick={startRecording}
                    className="flex flex-col items-center gap-2 group"
                 >
                    <div className="w-16 h-16 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-200 flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 group-hover:text-purple-600 transition-colors">Kaydı Başlat</span>
                 </button>
              )}

              {isRecording && (
                <div className="flex flex-col items-center gap-3 w-full">
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
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-full border-4 border-slate-100 border-t-purple-600 animate-spin"></div>
                    <span className="text-sm font-bold text-slate-400 animate-pulse">Analiz Ediliyor...</span>
                 </div>
              )}
           </div>
        </div>

        {result && (
          <div className="bg-slate-50 border-t border-slate-200 p-6 animate-in slide-in-from-bottom-5">
             <div className="flex items-start gap-4 mb-4">
                 {/* Score Circle */}
                 <div className={`flex-shrink-0 w-16 h-16 rounded-full border-4 flex items-center justify-center bg-white ${getScoreColor(result.score)}`}>
                     <span className="text-xl font-black">{result.score}</span>
                 </div>
                 
                 <div>
                    <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide mb-1">
                        AI Geri Bildirimi
                    </h4>
                    <p className="text-slate-600 text-sm leading-relaxed">{result.feedback}</p>
                 </div>
             </div>

             {result.corrections.length > 0 ? (
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                   <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase">Hatalar</div>
                   <div className="divide-y divide-slate-100">
                   {result.corrections.map((c, i) => (
                       <div key={i} className="p-3 flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
                           <div className="flex items-center gap-2 min-w-[120px]">
                               <span className="font-bold text-slate-800">{c.original}</span>
                               <span className="text-slate-300">→</span>
                           </div>
                           <div className="flex items-center gap-2 flex-1">
                               <span className="font-mono text-red-500 bg-red-50 px-1.5 py-0.5 rounded text-xs border border-red-100">{c.pronounced}</span>
                               <span className="text-slate-500 italic text-xs border-l border-slate-200 pl-2">{c.note}</span>
                           </div>
                       </div>
                   ))}
                   </div>
                </div>
             ) : (
                <div className="bg-green-50 border border-green-200 p-3 rounded-md flex items-center gap-2 text-green-700 text-sm font-medium">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Mükemmel telaffuz! Kayda değer bir hata bulunamadı.
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PronunciationModal;
