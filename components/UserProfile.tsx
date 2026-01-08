
import React from 'react';
import { User } from '../types';
import { useAuth } from '../context/AuthContext';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
  onChangeLevel: () => void; // New prop
  user: User | null;
  savedWordsCount: number;
  currentDay: number;
}

const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose, onChangeLevel, user, savedWordsCount, currentDay }) => {
  const { logout } = useAuth();
  
  if (!isOpen || !user) return null;

  // Calculate Progress Percentage (based on 30 days)
  const progressPercentage = Math.round((currentDay / 30) * 100);

  return (
    <div className="fixed inset-0 z-[130] flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full md:max-w-4xl max-h-[90vh] md:max-h-none rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 ring-1 ring-white/20" 
        onClick={e => e.stopPropagation()}
      >
        {/* Left Side: Identity Card */}
        <div className="md:w-1/3 bg-slate-50 border-r border-slate-100 p-6 md:p-8 flex flex-col items-center text-center relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 left-0 w-full h-24 md:h-32 bg-gradient-to-br from-slate-900 to-slate-800"></div>
            
            <button onClick={onClose} className="absolute top-4 right-4 text-white/50 md:hidden z-20">
                <span className="material-symbols-rounded">close</span>
            </button>

            <div className="relative z-10 mt-8 md:mt-12 mb-4">
                <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white p-1 shadow-xl mx-auto">
                    <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl md:text-3xl font-black border-4 border-white">
                        {user.username.charAt(0).toUpperCase()}
                    </div>
                </div>
                {user.isPremium && (
                    <div className="absolute bottom-0 right-0 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white shadow-sm flex items-center gap-1 translate-x-1/4">
                        <span className="material-symbols-rounded text-xs">verified</span>
                        PRO
                    </div>
                )}
            </div>

            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">{user.fullName || user.username}</h2>
            <p className="text-sm text-slate-500 font-medium mb-4 md:mb-6">@{user.username}</p>

            <div className="w-full space-y-2 md:space-y-3 mb-6 md:mb-8">
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-rounded text-slate-400">mail</span>
                        <span className="text-xs font-bold text-slate-500 uppercase">E-posta</span>
                    </div>
                </div>
                <div className="text-xs font-medium text-slate-600 break-all px-2">{user.email || 'Belirtilmemiş'}</div>
            </div>

            <div className="mt-auto w-full hidden md:block">
                <button 
                    onClick={() => { logout(); onClose(); }}
                    className="w-full py-3 bg-red-50 text-red-500 rounded-2xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-rounded">logout</span>
                    Çıkış Yap
                </button>
            </div>
        </div>

        {/* Right Side: Stats & Details */}
        <div className="flex-1 p-6 md:p-10 bg-white overflow-y-auto relative custom-scrollbar">
            <button onClick={onClose} className="hidden md:flex absolute top-6 right-6 w-10 h-10 items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900 z-10">
                <span className="material-symbols-rounded">close</span>
            </button>

            <h3 className="text-xl md:text-2xl font-bold text-slate-900 mb-6 md:mb-8 flex items-center gap-2">
                <span className="material-symbols-rounded text-primary-600">bar_chart</span>
                İlerleme Durumu
            </h3>

            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
                <div className="relative group p-4 md:p-5 rounded-3xl md:rounded-[2rem] bg-indigo-50 border border-indigo-100 flex flex-col items-start gap-2">
                    <button 
                        onClick={() => { onClose(); onChangeLevel(); }}
                        className="absolute top-2 right-2 w-8 h-8 rounded-full bg-white text-indigo-500 flex items-center justify-center shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-indigo-500 hover:text-white"
                        title="Seviyeyi Değiştir"
                    >
                        <span className="material-symbols-rounded text-sm">edit</span>
                    </button>
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white text-indigo-600 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-rounded text-lg md:text-xl">school</span>
                    </div>
                    <div>
                        <div className="text-2xl md:text-3xl font-black text-slate-900">{user.level || 'A1'}</div>
                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Seviye</div>
                    </div>
                </div>

                <div className="p-4 md:p-5 rounded-3xl md:rounded-[2rem] bg-emerald-50 border border-emerald-100 flex flex-col items-start gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-rounded text-lg md:text-xl">target</span>
                    </div>
                    <div>
                        <div className="text-2xl md:text-3xl font-black text-slate-900">{user.targetExam || 'Genel'}</div>
                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Hedef</div>
                    </div>
                </div>

                <div className="p-4 md:p-5 rounded-3xl md:rounded-[2rem] bg-amber-50 border border-amber-100 flex flex-col items-start gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white text-amber-600 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-rounded text-lg md:text-xl">bookmark</span>
                    </div>
                    <div>
                        <div className="text-2xl md:text-3xl font-black text-slate-900">{savedWordsCount}</div>
                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Kelime</div>
                    </div>
                </div>

                <div className="p-4 md:p-5 rounded-3xl md:rounded-[2rem] bg-rose-50 border border-rose-100 flex flex-col items-start gap-2">
                    <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-white text-rose-600 flex items-center justify-center shadow-sm">
                        <span className="material-symbols-rounded text-lg md:text-xl">local_fire_department</span>
                    </div>
                    <div>
                        <div className="text-2xl md:text-3xl font-black text-slate-900">3</div>
                        <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Seri</div>
                    </div>
                </div>
            </div>

            {/* Progress Bar Section */}
            <div className="bg-slate-900 rounded-3xl md:rounded-[2rem] p-5 md:p-6 text-white relative overflow-hidden shadow-xl shadow-slate-900/20 mb-6 md:mb-0">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[80px] opacity-30 -mr-16 -mt-16"></div>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-end mb-4">
                        <div>
                            <div className="text-[10px] font-bold text-primary-300 uppercase tracking-widest mb-1">Genel Başarı</div>
                            <div className="text-lg md:text-2xl font-bold">Zirveye Yolculuk</div>
                        </div>
                        <div className="text-3xl md:text-4xl font-black text-primary-400">{progressPercentage}%</div>
                    </div>

                    <div className="w-full h-2 md:h-3 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-gradient-to-r from-primary-500 to-accent rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${progressPercentage}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 flex justify-between text-[10px] md:text-xs font-bold text-slate-400">
                        <span>Başlangıç</span>
                        <span>Hedef: C1</span>
                    </div>
                </div>
            </div>

            {/* Mobile Logout Button (Visible only on mobile inside content area) */}
            <div className="mt-6 md:hidden">
                <button 
                    onClick={() => { logout(); onClose(); }}
                    className="w-full py-4 bg-red-50 text-red-500 rounded-2xl font-bold active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <span className="material-symbols-rounded">logout</span>
                    Çıkış Yap
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
