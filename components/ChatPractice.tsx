
import React, { useState, useEffect, useRef } from 'react';
import { ConversationScenario } from '../types';
import { getChatReply, playTTS, stopTTS } from '../services/geminiService';
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

    // Initial Message
    useEffect(() => {
        if (messages.length === 0 && scenario.starter_message) {
            const initialMsg = { id: Date.now(), role: 'model' as const, text: scenario.starter_message };
            setMessages([initialMsg]);
            // Don't auto-play audio on mount to avoid annoying users
        }
    }, [scenario]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isProcessing]);

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
            alert("Cihazınız sesli yazdırmayı desteklemiyor.");
            return;
        }
        
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
        <div className="flex flex-col h-[calc(100vh-180px)] md:h-[650px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 relative">
            
            {/* Header */}
            <div className="bg-white p-4 border-b border-slate-100 flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl border border-primary/20">
                    👾
                </div>
                <div className="flex-1">
                    <div className="font-bold text-sm text-slate-900">{scenario.ai_role}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{scenario.setting}</div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-[#EFE7DD] bg-opacity-30">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-3.5 rounded-2xl relative text-sm font-medium leading-relaxed shadow-sm
                            ${msg.role === 'user' 
                                ? 'bg-primary text-white rounded-br-none' 
                                : 'bg-white text-slate-800 rounded-bl-none'
                            }`}
                        >
                            {msg.text}
                            {msg.role === 'model' && (
                                <button onClick={() => playTTS(msg.text)} className="absolute -right-8 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center bg-white/50 rounded-full text-slate-600 active:scale-90 transition-transform">
                                    <span className="material-symbols-rounded text-sm">volume_up</span>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                {isProcessing && (
                    <div className="flex justify-start">
                        <div className="bg-white px-3 py-2 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && !isProcessing && (
                <div className="px-3 py-2 flex gap-2 overflow-x-auto no-scrollbar bg-slate-50 border-t border-slate-100 shrink-0">
                    {suggestions.map((sug, idx) => (
                        <button 
                            key={idx}
                            onClick={() => handleSendMessage(sug)}
                            className="whitespace-nowrap px-4 py-2 bg-white border border-primary/20 text-primary text-xs font-bold rounded-full active:bg-primary/10 transition-colors shadow-sm"
                        >
                            {sug}
                        </button>
                    ))}
                </div>
            )}

            {/* Input Area */}
            <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0 pb-safe">
                <button 
                    onClick={startListening}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isRecording ? 'bg-red-50 text-red-500 animate-pulse' : 'bg-slate-100 text-slate-500 active:bg-slate-200'}`}
                >
                    <span className="material-symbols-rounded text-xl">{isRecording ? 'mic_off' : 'mic'}</span>
                </button>

                <div className="flex-1 relative">
                    <input 
                        type="text" 
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(userInput)}
                        placeholder="Mesaj yaz..."
                        className="w-full bg-slate-50 border-0 rounded-full py-2.5 pl-4 pr-10 text-slate-800 text-sm font-medium focus:ring-2 focus:ring-primary/20 placeholder:text-slate-400"
                    />
                    <button 
                        onClick={() => handleSendMessage(userInput)}
                        disabled={!userInput.trim()}
                        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-slate-300 active:scale-90 transition-transform"
                    >
                        <span className="material-symbols-rounded text-sm">send</span>
                    </button>
                </div>
            </div>
            
             {isRecording && (
                <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-xl z-30 flex items-center gap-2 shadow-2xl">
                     <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                    <AudioVisualizer stream={audioStream} isRecording={isRecording} />
                </div>
            )}
        </div>
    );
};

export default ChatPractice;
