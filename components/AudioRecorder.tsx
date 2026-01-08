
import React, { useState, useRef } from 'react';
import { analyzePronunciation, stopTTS } from '../services/geminiService';
import { AnalysisResult } from '../types';
import AudioVisualizer from './AudioVisualizer';
import { useToast } from './Toast';

const AudioRecorder: React.FC<{ passageText: string }> = ({ passageText }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const { addToast } = useToast();

  const startRecording = async () => {
    stopTTS();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      // Fix: Explicitly type 'e' as BlobEvent to access 'data' property safely
      mediaRecorder.ondataavailable = (e: BlobEvent) => {
          if (e.data && e.data.size > 0) {
              chunksRef.current.push(e.data);
          }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        handleAnalysis(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setAudioStream(null);
      };
      mediaRecorder.start();
      setIsRecording(true);
      setResult(null);
    } catch (err) { addToast("Mikrofon izni gerekli", "error"); }
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
            const analysis = await analyzePronunciation(base64String, passageText);
            setResult(analysis);
            addToast("Analiz tamamlandı", "success");
          } catch (error) { addToast("Analiz başarısız", "error"); } 
          finally { setIsAnalyzing(false); }
      }
    };
  };

  return (
    <div className="bg-white border border-slate-100 rounded-[2.5rem] p-8 shadow-card h-full flex flex-col justify-between relative overflow-hidden group hover:shadow-float transition-all duration-300">
        <div className="flex items-center gap-4 mb-8">
             <div className="w-14 h-14 rounded-3xl bg-primary-50 text-primary-600 flex items-center justify-center border border-primary-100">
                <span className="material-symbols-rounded text-2xl">mic</span>
             </div>
             <div>
                <h3 className="font-bold text-xl text-slate-900 tracking-tight">Konuşma Pratiği</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Telaffuz Analizi</p>
             </div>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center relative z-10">
            {!isRecording && !isAnalyzing && !result && (
                <div className="text-center py-6">
                    <button 
                        onClick={startRecording}
                        className="w-24 h-24 rounded-full bg-slate-900 text-white flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-slate-900/30 hover:scale-110 transition-transform duration-300 group/btn"
                    >
                        <span className="material-symbols-rounded text-4xl group-hover/btn:rotate-12 transition-transform">mic</span>
                    </button>
                    <p className="text-slate-900 font-bold text-lg">Kaydetmek için dokun</p>
                </div>
            )}

            {isRecording && (
                <div className="w-full text-center">
                    <div className="h-32 flex items-center justify-center mb-8 bg-slate-50 rounded-3xl w-full border border-slate-100">
                        <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                    </div>
                    <button onClick={stopRecording} className="px-8 py-3 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-colors flex items-center gap-2 mx-auto">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                        Kaydı Durdur
                    </button>
                </div>
            )}

            {isAnalyzing && (
                <div className="flex flex-col items-center py-10">
                    <div className="relative w-20 h-20 mb-6">
                        <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin"></div>
                    </div>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest animate-pulse">Analiz Ediliyor...</p>
                </div>
            )}

            {result && (
                <div className="w-full animate-in zoom-in duration-300">
                    <div className={`p-8 rounded-[2rem] border mb-6 text-center ${result.score >= 70 ? 'bg-green-50 border-green-100 text-green-800' : 'bg-orange-50 border-orange-100 text-orange-800'}`}>
                        <div className="text-6xl font-black mb-2 tracking-tighter">{result.score}<span className="text-3xl opacity-50">%</span></div>
                        <div className="text-sm font-bold opacity-80">{result.feedback}</div>
                    </div>
                    <button onClick={() => setResult(null)} className="w-full py-4 text-slate-500 font-bold hover:text-slate-900 hover:bg-slate-50 rounded-2xl transition-colors">
                        Tekrar Dene
                    </button>
                </div>
            )}
        </div>
    </div>
  );
};

export default AudioRecorder;
