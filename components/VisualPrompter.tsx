
import React, { useState } from 'react';
import { useToast } from './Toast';

interface VisualPrompterProps {
  prompt: string;
}

const VisualPrompter: React.FC<VisualPrompterProps> = ({ prompt }) => {
  const { addToast } = useToast();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(prompt);
    setIsCopied(true);
    addToast("Prompt kopyalandı!", "success");
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-[2.5rem] p-8 md:p-10 shadow-xl shadow-indigo-600/20 text-white relative overflow-hidden group">
      {/* Abstract Artistic Background */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-500 rounded-full blur-[80px] opacity-30 -mr-20 -mt-20 group-hover:opacity-40 transition-opacity"></div>
      <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400 rounded-full blur-[60px] opacity-20 -ml-10 -mb-10"></div>
      
      <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/10">
                <span className="material-symbols-rounded text-xl">palette</span>
             </div>
             <h3 className="font-bold text-xl tracking-tight">AI Art Studio</h3>
             <span className="px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest border border-white/10">Betimleme Pratiği</span>
          </div>
          
          <p className="text-indigo-100 text-sm mb-4 font-medium opacity-80">
            Aşağıdaki metin, bu temanın İngilizce görsel tasviridir. Sıfatları öğrenmek için harika bir yöntem!
          </p>

          <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-5 border border-white/10 font-mono text-sm leading-relaxed text-indigo-50 relative group/code">
             "{prompt}"
             <button 
                onClick={handleCopy}
                className="absolute top-2 right-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors opacity-0 group-hover/code:opacity-100"
                title="Kopyala"
             >
                <span className="material-symbols-rounded text-sm">{isCopied ? 'check' : 'content_copy'}</span>
             </button>
          </div>
        </div>

        <div className="w-full md:w-auto flex md:flex-col gap-3">
             <button 
                onClick={handleCopy}
                className="flex-1 md:flex-none px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2 shadow-lg"
             >
                <span className="material-symbols-rounded text-lg">content_copy</span>
                {isCopied ? 'Kopyalandı' : 'Promptu Kopyala'}
             </button>
             <div className="hidden md:flex flex-col gap-2 mt-auto">
                <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest text-center">Tasarım Araçları</span>
                <div className="flex gap-2 justify-center opacity-60">
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};

export default VisualPrompter;
