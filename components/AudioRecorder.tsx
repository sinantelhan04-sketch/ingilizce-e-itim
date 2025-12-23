import React, { useState, useRef } from 'react';
import { analyzePronunciation } from '../services/geminiService';
import { AnalysisResult } from '../types';
import AudioVisualizer from './AudioVisualizer';

interface AudioRecorderProps {
  passageText: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({ passageText }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

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
        const analysis = await analyzePronunciation(base64String, passageText);
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
      if (score >= 80) return 'text-green-600 bg-green-50 ring-green-200';
      if (score >= 50) return 'text-amber-600 bg-amber-50 ring-amber-200';
      return 'text-red-600 bg-red-50 ring-red-200';
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-1.5 bg-purple-50 rounded text-purple-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
             </div>
             <div>
                <h3 className="text-lg font-bold text-slate-800">Genel Telaffuz Analizi</h3>
                <p className="text-xs text-slate-500">Tüm metnin sesli okuma performansı</p>
             </div>
          </div>
      </div>

      <div className="p-8 flex flex-col items-center justify-center bg-slate-50/50 min-h-[200px]">
           {!isRecording && !isAnalyzing && (
             <div className="text-center">
                <button
                onClick={startRecording}
                className="group flex items-center justify-center w-16 h-16 bg-white border-2 border-slate-200 rounded-full shadow-sm hover:border-purple-500 hover:text-purple-600 transition-all mx-auto mb-3"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-400 group-hover:text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                </button>
                <span className="text-sm font-medium text-slate-600 block">Metni okumaya başlamak için tıklayın</span>
             </div>
           )}

           {isRecording && (
             <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="bg-white p-2 rounded-xl shadow-inner w-full flex justify-center">
                     <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                </div>
                <button
                onClick={stopRecording}
                className="px-8 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors font-bold text-sm"
                >
                    Kaydı Bitir
                </button>
             </div>
           )}

           {isAnalyzing && (
             <div className="text-center">
               <div className="w-12 h-12 border-4 border-slate-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-3"></div>
               <span className="text-sm font-medium text-slate-600">Sesiniz analiz ediliyor...</span>
             </div>
           )}
      </div>

        {result && (
          <div className="border-t border-slate-200">
             <div className="p-6 bg-purple-50/30">
                  <div className="flex items-center gap-4 mb-4">
                      <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-black ring-4 ring-opacity-50 ${getScoreColor(result.score)}`}>
                          {result.score}
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 text-sm uppercase tracking-wide">
                            Genel Değerlendirme
                          </h4>
                          <p className="text-slate-600 text-xs mt-0.5">100 üzerinden puanınız</p>
                      </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed p-3 bg-white/50 rounded-lg border border-purple-100">
                      {result.feedback}
                  </p>
             </div>

              {result.corrections.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Kelime</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Duyulan</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Tavsiye</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-100">
                      {result.corrections.map((correction, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-6 py-3 text-sm font-bold text-slate-800">{correction.original}</td>
                          <td className="px-6 py-3 text-sm text-red-600 font-mono bg-red-50/50 w-fit rounded">
                              {correction.pronounced}
                          </td>
                          <td className="px-6 py-3 text-sm text-slate-500 italic">{correction.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 text-center border-t border-slate-100">
                   <p className="text-green-600 font-medium text-sm flex items-center justify-center gap-1">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                     </svg>
                     Harika! Telaffuzunuz çok akıcı ve anlaşılır.
                   </p>
                </div>
              )}
          </div>
        )}
    </div>
  );
};

export default AudioRecorder;
