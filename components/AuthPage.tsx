import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  
  // Login Fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Register Additional Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [targetExam, setTargetExam] = useState('YDS');
  
  const [loading, setLoading] = useState(false);
  
  const { login, register } = useAuth();
  const { addToast } = useToast();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
        if (!username || !password) {
            addToast('Lütfen tüm alanları doldurun', 'error');
            return;
        }

        setLoading(true);
        try {
            const success = await login(username, password);
            if (success) {
                addToast('Giriş başarılı, hoş geldin!', 'success');
            } else {
                addToast('Kullanıcı adı veya şifre hatalı', 'error');
            }
        } finally {
            setLoading(false);
        }
    } else {
        // Registration Logic
        if (!username || !password || !fullName || !email) {
            addToast('Lütfen tüm kayıt bilgilerini doldurun', 'error');
            return;
        }

        setLoading(true);
        try {
            const success = await register(username, password, fullName, email, targetExam);
            if (success) {
                addToast('Kayıt başarılı! Aramıza hoş geldin.', 'success');
            } else {
                addToast('Bu kullanıcı adı zaten alınmış', 'error');
            }
        } catch (error) {
            addToast('İşlem sırasında hata oluştu', 'error');
        } finally {
            setLoading(false);
        }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 md:p-6 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] border border-slate-100 relative">
        
        {/* Left Side - Hero / Visuals */}
        <div className="md:w-1/2 bg-slate-900 p-12 text-white relative overflow-hidden flex flex-col justify-between z-10">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-[100px] opacity-40 -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent rounded-full blur-[100px] opacity-30 -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center font-bold text-3xl mb-8 border border-white/10 shadow-lg">Z</div>
                <h1 className="text-5xl font-black tracking-tight leading-tight mb-6">Zero2Hero<br/>English AI</h1>
                <p className="text-slate-300 text-lg leading-relaxed">
                    Yapay zeka destekli kişisel İngilizce koçun ile 30 günde A1'den C1'e yolculuk başlasın. Tamamen ücretsiz.
                </p>
            </div>

            <div className="relative z-10 space-y-4 mt-12 md:mt-0">
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                        <span className="material-symbols-rounded">check_circle</span>
                    </div>
                    <div>
                        <div className="font-bold text-sm">Ücretsiz Erişim</div>
                        <div className="text-xs text-slate-400">Tüm seviyeler ve özellikler açık</div>
                    </div>
                </div>
                <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                        <span className="material-symbols-rounded">school</span>
                    </div>
                    <div>
                        <div className="font-bold text-sm">Sınav Odaklı</div>
                        <div className="text-xs text-slate-400">YDS, YÖKDİL, TOEFL hazırlık</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side - Forms */}
        <div className="md:w-1/2 relative bg-white overflow-hidden flex flex-col">
            
            <div className="p-8 md:p-12 flex-1 flex flex-col justify-center overflow-y-auto custom-scrollbar">
                <div className="max-w-sm mx-auto w-full">
                    <h2 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
                        {isLogin ? 'Tekrar Hoş Geldin!' : 'Ücretsiz Kayıt Ol'}
                    </h2>
                    <p className="text-slate-500 mb-8 font-medium">
                        {isLogin ? 'Kaldığın yerden devam etmek için giriş yap.' : 'Hedefine ulaşmak için profilini oluştur.'}
                    </p>

                    <form onSubmit={handleAuthSubmit} className="space-y-4">
                        
                        {!isLogin && (
                            <>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2">
                                        <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Ad Soyad</label>
                                        <div className="relative">
                                            <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">badge</span>
                                            <input 
                                                type="text" 
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                                placeholder="Adınız Soyadınız"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">E-posta</label>
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">mail</span>
                                        <input 
                                            type="email" 
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                            placeholder="ornek@email.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Hedef Sınav</label>
                                    <div className="relative">
                                        <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">target</span>
                                        <select 
                                            value={targetExam}
                                            onChange={(e) => setTargetExam(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none appearance-none"
                                        >
                                            <option value="YDS">YDS (Yabancı Dil Sınavı)</option>
                                            <option value="YÖKDİL">YÖKDİL</option>
                                            <option value="TOEFL">TOEFL iBT</option>
                                            <option value="IELTS">IELTS Academic</option>
                                            <option value="GENERAL">Genel İngilizce</option>
                                        </select>
                                        <span className="material-symbols-rounded absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">expand_more</span>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Kullanıcı Adı</label>
                            <div className="relative">
                                <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">person</span>
                                <input 
                                    type="text" 
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                    placeholder="kullanici_adi"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5 ml-1 uppercase tracking-wider">Şifre</label>
                            <div className="relative">
                                <span className="material-symbols-rounded absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-xl">lock</span>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl py-3 pl-12 pr-4 text-slate-900 font-bold focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-100 transition-all outline-none"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white rounded-2xl py-4 font-bold shadow-xl shadow-primary-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:scale-100 mt-2"
                        >
                            {loading && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
                            {isLogin ? 'Giriş Yap' : 'Hemen Kayıt Ol'}
                        </button>
                    </form>

                    <div className="mt-8 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-medium">
                            {isLogin ? "Hesabın yok mu?" : "Zaten bir hesabın var mı?"}{' '}
                            <button 
                                onClick={() => setIsLogin(!isLogin)}
                                className="text-primary-600 font-bold hover:underline decoration-2 underline-offset-4 ml-1"
                            >
                                {isLogin ? 'Ücretsiz Kayıt Ol' : 'Giriş Yap'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default AuthPage;