
import React, { useState, useEffect, useRef } from 'react';
import { ConversationScenario } from '../types';
import { getChatReply, playTTS, stopTTS } from '../services/geminiService';
import { useAuth } from '../context/AuthContext';
import AudioVisualizer from './AudioVisualizer';

interface ChatPracticeProps {
    scenario: ConversationScenario;
    userLevel: string;
}

interface Message {
    id: number;
    role: 'user' | 'model';
    text: string;
}

const ChatPractice: React.FC<ChatPracticeProps> = ({ scenario, userLevel }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [userInput, setUserInput] = useState('');
    const [suggestions, setSuggestions] = useState<string[]>(scenario.suggested_replies);
    const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { user } = useAuth();

    // Initial Message
    useEffect(() => {
        if (messages.length === 0 && scenario.starter_message) {
            const initialMsg = { id: Date.now(), role: 'model' as const, text: scenario.starter_message };
            setMessages([initialMsg]);
            playTTS(scenario.starter_message);
        }
    }, [scenario]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (text: string) => {
        if (!text.trim()) return;

        stopTTS();
        
        const userMsg: Message = { id: Date.now(), role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setUserInput('');
        setSuggestions([]);
        setIsProcessing(true);

        try {
            // Build history for API
            const history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            
            const replyData = await getChatReply(history.concat({ role: 'user', parts: [{ text }] }), userLevel);
            
            const aiMsg: Message = { id: Date.now() + 1, role: 'model', text: replyData.text };
            setMessages(prev => [...prev, aiMsg]);
            setSuggestions(replyData.suggestions);
            
            await playTTS(replyData.text);

        } catch (error) {
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const startListening = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Tarayıcınız sesli yazdırmayı desteklemiyor.");
            return;
        }
        
        // Visualizer setup
        navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
            setAudioStream(stream);
        });

        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => setIsRecording(true);
        recognition.onend = () => {
            setIsRecording(false);
            if (audioStream) {
                audioStream.getTracks().forEach(t => t.stop());
                setAudioStream(null);
            }
        };
        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setUserInput(transcript); 
        };

        recognition.start();
    };

    return (
        <div className="flex flex-col h-[650px] bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 relative shadow-2xl shadow-indigo-500/10">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-5 flex justify-between items-center z-10 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-3xl border-2 border-white/30 shadow-lg">
                        👾
                    </div>
                    <div>
                        <div className="font-bold text-lg leading-tight">{scenario.ai_role}</div>
                        <div className="text-xs text-indigo-100 font-medium opacity-80 flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                            Çevrimiçi • {scenario.setting}
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar bg-slate-50">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg mr-2 border border-indigo-200 flex-shrink-0 self-end mb-1">👾</div>
                        )}
                        <div className={`max-w-[75%] p-5 rounded-3xl relative transition-all duration-300 shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 text-white rounded-br-none shadow-indigo-200' 
                                : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none shadow-sm'
                            }`}
                        >
                            <p className="text-sm md:text-[15px] leading-relaxed font-medium">{msg.text}</p>
                            
                            {msg.role === 'model' && (
                                <button onClick={() => playTTS(msg.text)} className="absolute -right-12 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white rounded-full text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all border border-slate-100 group">
                                    <span className="material-symbols-rounded text-xl group-hover:scale-110 transition-transform">volume_up</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start items-end">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-lg mr-2 border border-indigo-200 flex-shrink-0">👾</div>
                        <div className="bg-white px-4 py-3 rounded-3xl rounded-bl-none border border-slate-100 shadow-sm flex gap-1.5 items-center">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Overlay */}
            {suggestions.length > 0 && !isProcessing && (
                <div className="px-4 py-3 flex gap-3 overflow-x-auto no-scrollbar z-10 bg-slate-50 border-t border-slate-100">
                    {suggestions.map((sug, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleSendMessage(sug)}
                            className="whitespace-nowrap px-5 py-2.5 bg-white border-2 border-indigo-100 text-indigo-600 text-sm font-bold rounded-2xl hover:bg-indigo-500 hover:text-white hover:border-indigo-500 transition-all shadow-sm flex-shrink-0 hover:-translate-y-0.5"
                        >
                            {sug}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 flex items-center gap-3 relative z-20">
                <button 
                    onClick={startListening}
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-sm border-2 ${isRecording ? 'bg-red-50 border-red-100 text-red-500 animate-pulse' : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100'}`}
                >
                    <span className="material-symbols-rounded text-2xl">{isRecording ? 'mic_off' : 'mic'}</span>
                </button>

                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                        placeholder="Bir şeyler yaz..."
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3.5 pl-5 pr-14 text-slate-800 font-medium focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                    <button 
                        onClick={() => handleSendMessage(userInput)}
                        disabled={!userInput.trim()}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-indigo-600 text-white rounded-xl disabled:opacity-50 disabled:bg-slate-300 hover:bg-indigo-700 transition-all flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:scale-105"
                    >
                        <span className="material-symbols-rounded text-xl">send</span>
                    </button>
                </div>
            </div>
            
             {/* Visualizer Overlay when recording */}
             {isRecording && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-6 py-3 rounded-2xl z-30 flex flex-col items-center gap-2 shadow-2xl animate-in zoom-in-95 duration-200">
                    <div className="text-white text-xs font-bold uppercase tracking-widest animate-pulse">Dinliyorum...</div>
                    <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                </div>
            )}
        </div>
    );
};

export default ChatPractice;
