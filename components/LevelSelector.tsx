
import React, { useState } from 'react';

interface LevelSelectorProps {
  onSelect: (level: string) => void;
}

const levels = [
  {
    id: 'A1',
    title: 'Başlangıç (Beginner)',
    description: 'İngilizce ile yeni tanışıyorum.',
    focus: 'Temel kelimeler, Geniş Zaman.',
    icon: 'spa',
    color: 'bg-green-500',
    lightColor: 'bg-green-50',
    textColor: 'text-green-600',
    borderColor: 'border-green-200',
    shadow: 'shadow-green-500/20'
  },
  {
    id: 'A2',
    title: 'Temel (Elementary)',
    description: 'Basit kalıpları anlıyorum.',
    focus: 'Geçmiş Zaman, Gelecek planları.',
    icon: 'school',
    color: 'bg-blue-500',
    lightColor: 'bg-blue-50',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-200',
    shadow: 'shadow-blue-500/20'
  },
  {
    id: 'B1',
    title: 'Orta (Intermediate)',
    description: 'Çoğu konuyu anlayabiliyorum.',
    focus: 'Karmaşık cümleler, İş İngilizcesi.',
    icon: 'chat_bubble',
    color: 'bg-orange-500',
    lightColor: 'bg-orange-50',
    textColor: 'text-orange-600',
    borderColor: 'border-orange-200',
    shadow: 'shadow-orange-500/20'
  },
  {
    id: 'B2',
    title: 'Orta Üstü (Upper)',
    description: 'Akıcı konuşabilirim.',
    focus: 'Soyut konular, Bağlaçlar.',
    icon: 'rocket_launch',
    color: 'bg-purple-500',
    lightColor: 'bg-purple-50',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-200',
    shadow: 'shadow-purple-500/20'
  },
  {
    id: 'C1',
    title: 'İleri (Advanced)',
    description: 'Akademik metinleri anlarım.',
    focus: 'Makale analizi, Devrik cümleler.',
    icon: 'diamond',
    color: 'bg-pink-500',
    lightColor: 'bg-pink-50',
    textColor: 'text-pink-600',
    borderColor: 'border-pink-200',
    shadow: 'shadow-pink-500/20'
  }
];

const LevelSelector: React.FC<LevelSelectorProps> = ({ onSelect }) => {
  const [selectedLevel, setSelectedLevel] = useState('A1');

  return (
    <div className="bg-sky-50 min-h-screen flex flex-col font-display selection:bg-primary-100">
        
        {/* Header */}
        <div className="pt-10 pb-6 px-6 text-center">
            <h1 className="text-3xl font-black text-slate-800 mb-2">Hangi Seviyedesin?</h1>
            <p className="text-slate-500 font-medium text-lg">Senin için en uygun rotayı çizelim.</p>
        </div>

        <main className="flex-grow w-full max-w-md mx-auto px-6 pb-32 overflow-y-auto">
            <div className="space-y-4">
                {levels.map((level) => (
                    <label key={level.id} className="block group cursor-pointer relative perspective-1000">
                        <input 
                            type="radio" 
                            name="level" 
                            value={level.id} 
                            checked={selectedLevel === level.id}
                            onChange={() => setSelectedLevel(level.id)}
                            className="peer sr-only" 
                        />
                        {/* 3D Card */}
                        <div className={`
                            relative overflow-hidden
                            bg-white 
                            rounded-[2rem] p-1 
                            border-2 border-transparent
                            transition-all duration-200 
                            peer-checked:scale-[1.02] 
                            peer-checked:border-b-8 peer-checked:-translate-y-1
                            shadow-card
                            ${level.borderColor}
                        `}>
                             <div className={`rounded-[1.8rem] p-5 h-full transition-colors ${selectedLevel === level.id ? level.lightColor : 'bg-white group-hover:bg-slate-50'}`}>
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl ${level.color} text-white flex items-center justify-center shadow-lg transform group-hover:rotate-6 transition-transform duration-300 flex-shrink-0`}>
                                        <span className="material-icons-round text-3xl">{level.icon}</span>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-xs font-black px-2 py-0.5 rounded-md bg-white/80 ${level.textColor}`}>{level.id}</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-800 mb-1 leading-tight">{level.title}</h3>
                                        <p className="text-sm text-slate-500 leading-snug">{level.description}</p>
                                    </div>
                                    
                                    {/* Radio Circle */}
                                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors ${selectedLevel === level.id ? `bg-white border-transparent ${level.textColor}` : 'border-slate-200 bg-white'}`}>
                                        {selectedLevel === level.id && <span className="material-icons-round font-bold text-lg">check</span>}
                                    </div>
                                </div>
                             </div>
                        </div>
                    </label>
                ))}
            </div>
        </main>

        <div className="fixed bottom-0 w-full bg-white border-t border-slate-100 p-4 z-50 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
            <div className="max-w-md mx-auto">
                <button 
                    onClick={() => onSelect(selectedLevel)}
                    className="w-full bg-primary hover:bg-primary-dark text-white font-bold text-xl py-4 rounded-2xl shadow-xl shadow-primary/30 btn-3d flex items-center justify-center gap-3 border-b-4 border-primary-dark"
                >
                    <span>Maceraya Başla</span>
                    <span className="material-icons-round">arrow_forward</span>
                </button>
            </div>
        </div>
    </div>
  );
};

export default LevelSelector;
