
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
  const NODE_HEIGHT = 160; 
  
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

  // Sine wave position calculation
  const getPositionStyle = (index: number) => {
    const xOffset = Math.sin(index * 0.6) * 35; // Amplitude
    return { 
        left: `${50 + xOffset}%`,
        top: `${index * NODE_HEIGHT + 120}px` 
    };
  };

  // Generate SVG Path
  const generatePathData = () => {
      const points = days.map((_, i) => {
          const x = 50 + Math.sin(i * 0.6) * 35; 
          const y = i * NODE_HEIGHT + 170; // Center of the button roughly
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
    <div className="bg-sky-gradient min-h-screen font-body text-white relative flex flex-col items-center overflow-hidden">
        
        {/* Animated Clouds Background */}
        <div className="absolute top-20 left-[-10%] w-32 h-20 opacity-40 animate-cloud pointer-events-none z-0">
            <svg className="text-white w-full h-full" fill="currentColor" viewBox="0 0 100 60"><path d="M25,60.2c-13.8,0-25-11.2-25-25s11.2-25,25-25c1.7,0,3.4,0.2,5,0.5c3.8-6.2,10.6-10.3,18.3-10.3 c11.9,0,21.6,9.7,21.6,21.6c0,0.6,0,1.2-0.1,1.8c7.3,2.4,12.6,9.3,12.6,17.4C92.4,52.3,81.3,60.2,25,60.2z"></path></svg>
        </div>
        <div className="absolute top-60 right-[-5%] w-24 h-16 opacity-30 animate-cloud pointer-events-none z-0" style={{animationDelay: '2s'}}>
            <svg className="text-white w-full h-full" fill="currentColor" viewBox="0 0 100 60"><path d="M25,60.2c-13.8,0-25-11.2-25-25s11.2-25,25-25c1.7,0,3.4,0.2,5,0.5c3.8-6.2,10.6-10.3,18.3-10.3 c11.9,0,21.6,9.7,21.6,21.6c0,0.6,0,1.2-0.1,1.8c7.3,2.4,12.6,9.3,12.6,17.4C92.4,52.3,81.3,60.2,25,60.2z"></path></svg>
        </div>

        {/* Top Bar */}
        <header className="w-full px-6 pt-6 pb-4 flex justify-between items-start z-20 sticky top-0">
            {/* Level Badge */}
            <button 
                onClick={onChangeLevel}
                className="bg-white/20 backdrop-blur-md border border-white/40 rounded-2xl px-4 py-2 flex items-center gap-2 shadow-lg btn-3d"
            >
                <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center border-2 border-white shadow-sm">
                    <span className="material-symbols-rounded text-yellow-800 text-lg">flag</span>
                </div>
                <div className="text-left">
                    <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider leading-none mb-0.5">Seviye</div>
                    <div className="font-display font-bold text-lg leading-none">{user?.level || 'A1'}</div>
                </div>
            </button>
            
            {/* Profile Avatar */}
            <button 
                onClick={onProfileClick}
                className="w-12 h-12 rounded-2xl bg-white border-4 border-white/30 shadow-xl flex items-center justify-center btn-3d overflow-hidden"
            >
                <div className="w-full h-full bg-primary flex items-center justify-center text-white font-display font-bold text-xl">
                    {user?.username?.charAt(0).toUpperCase() || 'S'}
                </div>
            </button>
        </header>

        {/* Scrollable Map Area */}
        <div ref={scrollRef} className="w-full max-w-md flex-1 overflow-y-auto no-scrollbar relative z-10 pb-32">
            
            {/* Path Line */}
            <div className="absolute top-0 left-0 w-full pointer-events-none" style={{ height: `${totalHeight}px` }}>
                <svg 
                    className="w-full h-full" 
                    viewBox={`0 0 100 ${totalHeight}`} 
                    preserveAspectRatio="none"
                >
                    <path 
                        d={generatePathData()} 
                        className="dotted-path"
                        vectorEffect="non-scaling-stroke"
                    />
                </svg>
            </div>

            {/* Level Nodes */}
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
                                // Current Day (Active)
                                <div className="relative z-10">
                                    <div className="absolute -inset-4 bg-white/30 rounded-full animate-pulse blur-md"></div>
                                    <button 
                                        onClick={() => onSelectDay(day)}
                                        className="w-24 h-24 bg-primary hover:bg-primary-dark rounded-3xl flex flex-col items-center justify-center shadow-xl btn-3d border-b-8 border-primary-dark relative z-10 group transition-colors"
                                    >
                                        <div className="w-20 h-20 rounded-2xl border-2 border-white/20 flex flex-col items-center justify-center bg-white/10">
                                            <span className="text-xs font-bold text-white/80 uppercase mb-1">Gün</span>
                                            <span className="text-4xl font-display font-black text-white">{day}</span>
                                        </div>
                                        {/* "Start" Label */}
                                        <div className="absolute -top-10 bg-white text-primary font-bold px-3 py-1 rounded-full text-sm shadow-lg animate-bounce">
                                            BAŞLA
                                            <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45"></div>
                                        </div>
                                    </button>
                                </div>
                            ) : isLocked ? (
                                // Locked Day
                                <div className="w-20 h-20 bg-slate-200 rounded-3xl flex items-center justify-center shadow-sm border-b-4 border-slate-300 opacity-80">
                                    <span className="material-icons-round text-slate-400 text-3xl">lock</span>
                                </div>
                            ) : (
                                // Completed Day
                                <button 
                                    onClick={() => onSelectDay(day)}
                                    className="w-20 h-20 bg-yellow-400 hover:bg-yellow-500 rounded-3xl flex items-center justify-center shadow-lg btn-3d border-b-8 border-yellow-600 relative z-10"
                                >
                                    <span className="material-icons-round text-white text-4xl drop-shadow-md">star</span>
                                    <div className="absolute -bottom-8 flex gap-1">
                                        <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
                                        <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
                                        <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
                                    </div>
                                </button>
                            )}
                        </div>
                     );
                })}

                {/* Trophy at end */}
                <div 
                    className="absolute transform -translate-x-1/2 flex flex-col items-center"
                    style={{ 
                        left: '50%', 
                        top: `${days.length * NODE_HEIGHT + 180}px` 
                    }}
                >
                     <div className="w-40 h-40 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center shadow-2xl border-8 border-white animate-float">
                        <span className="text-7xl drop-shadow-md">🏆</span>
                     </div>
                     <div className="mt-6 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-black text-xl tracking-widest text-white border border-white/40">
                         FİNAL
                     </div>
                </div>
            </div>
        </div>

        {/* Bottom Nav */}
        <nav className="w-full bg-white border-t border-slate-100 pb-6 pt-3 px-6 flex justify-around items-end z-40 fixed bottom-0 rounded-t-[2rem] shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
            <button className="flex flex-col items-center gap-1 text-primary group">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                    <span className="material-icons-round text-3xl">map</span>
                </div>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-icons-round text-3xl">leaderboard</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-600 transition-colors">
                <span className="material-icons-round text-3xl">storefront</span>
            </button>
        </nav>
    </div>
  );
};

export default ProgressMap;
