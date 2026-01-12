
import React, { useRef, useEffect } from 'react';
import { User } from '../types';

interface ProgressMapProps {
  currentDay: number;
  unlockedDay: number; 
  onSelectDay: (day: number) => void;
  onChangeLevel: () => void;
  onProfileClick: () => void;
  user: User | null;
}

const ProgressMap: React.FC<ProgressMapProps> = ({ currentDay, unlockedDay, onSelectDay, onChangeLevel, onProfileClick, user }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const days = Array.from({ length: 30 }, (_, i) => i + 1);
  const NODE_HEIGHT = 140; // slightly more compact for mobile
  
  // Auto scroll to current day
  useEffect(() => {
    if (scrollRef.current) {
        setTimeout(() => {
            const currentEl = document.getElementById(`day-${currentDay}`);
            if (currentEl) {
                currentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    }
  }, [currentDay]);

  const getPositionStyle = (index: number) => {
    const xOffset = Math.sin(index * 0.7) * 32; 
    return { 
        left: `${50 + xOffset}%`,
        top: `${index * NODE_HEIGHT + 100}px` 
    };
  };

  const generatePathData = () => {
      const points = days.map((_, i) => {
          const x = 50 + Math.sin(i * 0.7) * 32; 
          const y = i * NODE_HEIGHT + 132; // adjusted center
          return { x, y };
      });

      if (points.length === 0) return "";

      let d = `M ${points[0].x} ${points[0].y}`;
      for (let i = 0; i < points.length - 1; i++) {
          const p1 = points[i];
          const p2 = points[i+1];
          const cp1y = p1.y + NODE_HEIGHT / 2;
          const cp2y = p2.y - NODE_HEIGHT / 2;
          d += ` C ${p1.x} ${cp1y}, ${p2.x} ${cp2y}, ${p2.x} ${p2.y}`;
      }
      return d;
  };

  const totalHeight = days.length * NODE_HEIGHT + 300;

  return (
    <div className="bg-surface-dark min-h-screen font-body text-white relative flex flex-col items-center overflow-hidden h-[100dvh]">
        
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950"></div>
        <div className="absolute top-0 w-full h-full opacity-20 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>

        {/* Top Bar (Sticky) */}
        <header className="w-full pt-safe px-4 pb-2 flex justify-between items-center z-30 absolute top-0 bg-gradient-to-b from-slate-900 to-transparent h-24">
            <button 
                onClick={onChangeLevel}
                className="bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-1.5 py-1.5 pr-4 flex items-center gap-2 active-scale"
            >
                <div className="w-8 h-8 rounded-full bg-warning flex items-center justify-center border-2 border-slate-900">
                    <span className="material-symbols-rounded text-slate-900 text-lg font-bold">flag</span>
                </div>
                <div className="text-left">
                    <div className="font-display font-bold text-sm leading-none">{user?.level || 'A1'}</div>
                </div>
            </button>
            
            <button 
                onClick={onProfileClick}
                className="w-10 h-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center overflow-hidden active-scale"
            >
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-display font-bold">
                    {user?.username?.charAt(0).toUpperCase() || 'S'}
                </div>
            </button>
        </header>

        {/* Scrollable Map Area */}
        <div ref={scrollRef} className="w-full flex-1 overflow-y-auto no-scrollbar relative z-10 pb-32 pt-20">
            
            <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: `${totalHeight}px` }}>
                <svg 
                    className="w-full h-full" 
                    viewBox={`0 0 100 ${totalHeight}`} 
                    preserveAspectRatio="none"
                >
                    <path 
                        d={generatePathData()} 
                        className="stroke-slate-700 stroke-[4] fill-none stroke-dasharray-4"
                        strokeLinecap="round"
                    />
                </svg>
            </div>

            <div className="relative w-full h-full">
                {days.map((day, index) => {
                     const isLocked = day > unlockedDay;
                     const isCurrent = day === unlockedDay;
                     const style = getPositionStyle(index);

                     return (
                        <div 
                            id={`day-${day}`}
                            key={day} 
                            className="absolute transform -translate-x-1/2 flex flex-col items-center"
                            style={style}
                        >
                            {isCurrent ? (
                                <div className="relative z-10 group">
                                    <div className="absolute -inset-4 bg-primary/30 rounded-full animate-pulse blur-xl"></div>
                                    <button 
                                        onClick={() => onSelectDay(day)}
                                        className="w-20 h-20 bg-primary rounded-[2rem] flex flex-col items-center justify-center shadow-btn shadow-primary-dark border-b-8 border-primary-dark relative z-10 transition-transform active:translate-y-2 active:shadow-none"
                                    >
                                        <span className="text-xs font-bold text-white/60 uppercase -mb-1">Gün</span>
                                        <span className="text-3xl font-display font-black text-white">{day}</span>
                                        
                                        <div className="absolute -top-8 bg-white text-primary font-bold px-3 py-1 rounded-full text-xs shadow-lg animate-bounce">
                                            BAŞLA
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-white rotate-45"></div>
                                        </div>
                                    </button>
                                </div>
                            ) : isLocked ? (
                                <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm border-b-4 border-slate-900 opacity-60">
                                    <span className="material-symbols-rounded text-slate-600 text-2xl">lock</span>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => onSelectDay(day)}
                                    className="w-16 h-16 bg-warning rounded-2xl flex items-center justify-center shadow-btn shadow-orange-700 border-b-4 border-orange-700 relative z-10 active:translate-y-1 active:shadow-none transition-all"
                                >
                                    <span className="material-symbols-rounded text-white text-3xl drop-shadow-sm">check</span>
                                </button>
                            )}
                        </div>
                     );
                })}

                <div 
                    className="absolute transform -translate-x-1/2 flex flex-col items-center pb-safe"
                    style={{ 
                        left: '50%', 
                        top: `${days.length * NODE_HEIGHT + 60}px` 
                    }}
                >
                     <div className="w-32 h-32 bg-gradient-to-br from-yellow-300 to-orange-500 rounded-full flex items-center justify-center shadow-2xl border-4 border-white/20">
                        <span className="text-6xl drop-shadow-md">🏆</span>
                     </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ProgressMap;
