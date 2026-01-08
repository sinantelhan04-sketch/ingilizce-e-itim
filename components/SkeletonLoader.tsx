import React from 'react';

export const SkeletonLoader: React.FC = () => {
  return (
    <div className="relative min-h-[600px] w-full">
        {/* Central Loading Indicator Overlay */}
        <div className="absolute inset-0 z-20 flex items-start pt-20 justify-center">
            <div className="bg-white/90 backdrop-blur-md border border-brand-100 shadow-2xl shadow-brand-500/10 rounded-2xl p-8 flex flex-col items-center gap-5 animate-in fade-in zoom-in-95 duration-300 max-w-sm mx-auto text-center">
                 <div className="relative w-16 h-16">
                    <div className="absolute inset-0 border-4 border-slate-100 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-brand-600 rounded-full border-t-transparent animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                         <span className="text-xl animate-pulse">✨</span>
                    </div>
                 </div>
                 <div>
                    <h3 className="text-xl font-bold text-slate-900 tracking-tight">İçerik Oluşturuluyor</h3>
                    <p className="text-sm text-slate-500 font-medium mt-2 leading-relaxed">
                        Yapay zeka, seçtiğin seviyeye uygun özel bir ders hazırlıyor. Lütfen bekleyin...
                    </p>
                 </div>
            </div>
        </div>

        {/* Background Visual Skeleton (Blurred & Faded) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start opacity-30 pointer-events-none filter blur-[2px] transition-all duration-500">
          {/* Left Sidebar Skeleton */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 order-2 lg:order-1">
            <div className="bg-slate-200 rounded-2xl border border-slate-300 p-5 h-48 animate-pulse"></div>
            <div className="bg-slate-200 rounded-2xl border border-slate-300 h-[400px] animate-pulse"></div>
          </div>

          {/* Main Content Skeleton */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <div className="bg-slate-200 rounded-3xl border border-slate-300 overflow-hidden h-72 animate-pulse"></div>
            
            <div className="space-y-4 p-4">
               <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
               <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
               <div className="h-4 bg-slate-200 rounded w-5/6 animate-pulse"></div>
               <div className="h-4 bg-slate-200 rounded w-full animate-pulse"></div>
               <div className="h-4 bg-slate-200 rounded w-4/5 animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                 <div className="h-64 bg-slate-200 rounded-3xl border border-slate-300 animate-pulse"></div>
                 <div className="h-64 bg-slate-200 rounded-3xl border border-slate-300 animate-pulse"></div>
            </div>
          </div>
        </div>
    </div>
  );
};