import React, { useState } from 'react';

interface TipsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const strategies = [
  {
    id: 'reading',
    title: 'Okuma Stratejileri',
    icon: 'menu_book',
    color: 'text-blue-600 bg-blue-50 border border-blue-100',
    items: [
      { title: 'Soruları Önce Oku', desc: 'Parçaya başlamadan önce soru köklerini okuyarak ne aradığını bil. "What can be inferred...", "According to the passage..." gibi ifadeler cevabın yerini işaret eder.' },
      { title: 'İlk ve Son Cümle Kuralı', desc: 'Akademik metinlerde paragrafın ana fikri (Main Idea) genellikle ilk veya son cümlede gizlidir. Bu cümleleri ekstra dikkatli oku.' },
      { title: 'Bağlaçları Takip Et', desc: '"However", "Although", "Therefore", "But" gibi bağlaçlar düşüncenin yönünü değiştirir. Sınav soruları genellikle bu "kırılma noktalarından" gelir.' },
      { title: 'Bilinmeyen Kelimeler', desc: 'Bilmediğin bir kelimeye takılıp kalma. Cümlenin genelinden veya bağlamdan (context) anlamı tahmin etmeye çalış. YDS\'de her kelimeyi bilmek zorunda değilsin.' }
    ]
  },
  {
    id: 'grammar',
    title: 'Dilbilgisi Taktikleri',
    icon: 'rule',
    color: 'text-purple-600 bg-purple-50 border border-purple-100',
    items: [
      { title: 'Zaman Uyumu (Tense Agreement)', desc: 'Cümlenin bir tarafı Past ise diğer tarafı da genellikle Past uyumlu olmalıdır. Özellikle "when", "while", "after" bağlaçlarında zaman uyumuna bak.' },
      { title: 'Aktif / Pasif Ayrımı', desc: 'Özne işi yapıyor mu (Active) yoksa işten etkileniyor mu (Passive)? Boşluktan sonra "by" varsa veya nesne yoksa pasif olma ihtimali %90\'dır.' },
      { title: 'Relative Clauses (Who/Which)', desc: 'İnsanlar için "who", nesneler için "which/that", yer için "where". Boşluktan önceki kelime (antecedent) ne ise ona uygun olanı seç.' },
      { title: 'If Clauses (Koşul Cümleleri)', desc: 'Type 1 (Present-Future), Type 2 (Past-Would), Type 3 (Past Perfect-Would have V3). Bu kalıpları ezbere bilmek şarttır.' }
    ]
  },
  {
    id: 'vocab',
    title: 'Kelime & Çeviri',
    icon: 'translate',
    color: 'text-emerald-600 bg-emerald-50 border border-emerald-100',
    items: [
      { title: 'Yüklem Odaklı Çözüm', desc: 'Çeviri sorularında önce Türkçe cümlenin yüklemini bul ve İngilizce şıklardaki ana fiille eşleştir. Bu yöntemle genellikle 2-3 şıkkı saniyeler içinde elersin.' },
      { title: 'Kök ve Ek Analizi', desc: 'Kelimenin anlamını bilmiyorsan köküne ve eklerine bak. "Un-", "Dis-", "-less" olumsuzluk; "-tion", "-ment" isim; "-ize", "-fy" fiil yapar.' },
      { title: 'Collocations (Eşdizimler)', desc: 'Kelimeleri tek başına değil, yanındaki kelimelerle öğren. "Make a mistake", "Do homework", "Rely on", "Interested in" gibi kalıplar sınavda sıkça sorulur.' }
    ]
  }
];

const TipsModal: React.FC<TipsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('reading');

  if (!isOpen) return null;

  const activeStrategy = strategies.find(s => s.id === activeTab);

  return (
    <div className="fixed inset-0 z-[120] flex items-end md:items-center justify-center md:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full h-[90vh] md:max-w-5xl md:h-[650px] rounded-t-[2.5rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300 ring-1 ring-white/20" 
        onClick={e => e.stopPropagation()}
      >
        {/* Sidebar / Top Bar on Mobile */}
        <div className="md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-100 p-4 md:p-6 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto flex-shrink-0 no-scrollbar items-center md:items-stretch">
            <div className="mb-0 md:mb-8 px-2 hidden md:block">
                <div className="flex items-center gap-2 mb-2">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sınav Rehberi</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Taktikler &<br/>Stratejiler</h2>
            </div>
            
            {/* Mobile Header Title */}
            <div className="md:hidden font-bold text-lg text-slate-900 mr-4 whitespace-nowrap">Taktikler</div>

            {strategies.map(s => (
                <button
                    key={s.id}
                    onClick={() => setActiveTab(s.id)}
                    className={`p-3 md:p-4 rounded-2xl flex items-center gap-2 md:gap-3 font-bold transition-all text-left group flex-shrink-0 whitespace-nowrap ${activeTab === s.id ? 'bg-white shadow-lg shadow-slate-200 text-slate-900 ring-1 ring-slate-100' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                >
                    <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex items-center justify-center transition-colors ${activeTab === s.id ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-400 group-hover:bg-slate-300 group-hover:text-slate-600'}`}>
                        <span className="material-symbols-rounded text-lg md:text-xl">{s.icon}</span>
                    </div>
                    <span className="text-sm md:text-base">{s.title}</span>
                </button>
            ))}
            
            <div className="mt-auto pt-6 hidden md:block">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border border-yellow-100 p-5 rounded-3xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-yellow-200 rounded-full blur-2xl -mr-8 -mt-8 opacity-50"></div>
                    <div className="flex items-center gap-2 text-yellow-700 font-bold mb-2 relative z-10">
                        <span className="material-symbols-rounded bg-white rounded-full p-1 shadow-sm text-sm">lightbulb</span>
                        <span>Günün İpucu</span>
                    </div>
                    <p className="text-xs text-yellow-800 leading-relaxed font-medium relative z-10">
                        Her gün en az 1 tane okuma parçası çözmek, sınav puanını 1 ayda %20 artırabilir. Süreklilik anahtardır!
                    </p>
                </div>
            </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 md:p-12 overflow-y-auto bg-white relative custom-scrollbar">
            <button onClick={onClose} className="absolute top-4 right-4 md:top-6 md:right-6 w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-900 z-10">
                <span className="material-symbols-rounded">close</span>
            </button>

            {activeStrategy && (
                <div className="animate-in slide-in-from-right-4 duration-300 max-w-3xl mx-auto pb-12">
                    <div className="flex items-center gap-4 md:gap-5 mb-6 md:mb-10 pb-4 md:pb-6 border-b border-slate-50 mt-8 md:mt-0">
                         <div className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-card ${activeStrategy.color}`}>
                             <span className="material-symbols-rounded text-3xl md:text-4xl">{activeStrategy.icon}</span>
                         </div>
                         <div>
                             <h3 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-1">{activeStrategy.title}</h3>
                             <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                <p className="text-slate-400 font-bold text-xs md:text-sm uppercase tracking-wider">Uzmanlardan Altın Kurallar</p>
                             </div>
                         </div>
                    </div>

                    <div className="grid gap-4 md:gap-6">
                        {activeStrategy.items.map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-2xl md:rounded-[2rem] p-5 md:p-6 hover:shadow-float hover:border-primary-100 transition-all duration-300 group">
                                <h4 className="font-bold text-base md:text-lg text-slate-800 mb-2 md:mb-3 flex items-center gap-3 group-hover:text-primary-600 transition-colors">
                                    <span className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary-600 group-hover:text-white flex items-center justify-center text-xs md:text-sm font-black transition-all flex-shrink-0">
                                        {idx + 1}
                                    </span>
                                    {item.title}
                                </h4>
                                <p className="text-slate-500 leading-relaxed pl-10 md:pl-11 text-sm md:text-base font-medium">
                                    {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TipsModal;