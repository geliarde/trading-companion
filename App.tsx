
import React, { useState } from 'react';
import { AppTab } from './types.ts';
import Chords from './components/Chords.tsx';
import Tuner from './components/Tuner.tsx';
import Metronome from './components/Metronome.tsx';
import Sequencer from './components/Sequencer.tsx';
import Assistant from './components/Assistant.tsx';
import { LayoutGrid, Music, Timer, Sparkles, ListMusic } from 'lucide-react';

const App: React.FC = () => {
  const [tab, setTab] = useState<AppTab>(AppTab.CHORDS);

  return (
    <div className="min-h-screen flex flex-col bg-[#020617] text-white selection:bg-blue-500/30">
      <header className="p-4 flex items-center justify-between border-b border-white/5 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-[60]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Music size={18} className="text-white" />
          </div>
          <h1 className="text-sm font-black tracking-tighter uppercase">
            Ukulele Studio <span className="text-blue-500">Pro</span>
          </h1>
        </div>
        <div className="px-3 py-1 bg-white/5 rounded-full border border-white/5">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Estúdio Ativo</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto pb-32">
        <div className="p-4">
          {tab === AppTab.CHORDS && <Chords />}
          {tab === AppTab.TUNER && <Tuner />}
          {tab === AppTab.METRONOME && <Metronome />}
          {tab === AppTab.SEQUENCER && <Sequencer />}
          {tab === AppTab.ASSISTANT && <Assistant />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-2xl border-t border-white/10 px-4 pb-8 pt-4 z-[70]">
        <div className="flex justify-between items-center max-w-2xl mx-auto gap-2">
          {[
            { id: AppTab.CHORDS, label: 'Acordes', icon: <LayoutGrid size={22}/> },
            { id: AppTab.TUNER, label: 'Afinar', icon: <Music size={22}/> },
            { id: AppTab.METRONOME, label: 'Metrô', icon: <Timer size={22}/> },
            { id: AppTab.SEQUENCER, label: 'Ritmo', icon: <ListMusic size={22}/> },
            { id: AppTab.ASSISTANT, label: 'Coach', icon: <Sparkles size={22}/> }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={() => setTab(t.id)} 
              className={`flex flex-col items-center flex-1 py-3 rounded-2xl transition-all duration-300 ${tab === t.id ? 'text-blue-400 bg-blue-500/10 shadow-inner' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <div className={`transition-transform duration-300 ${tab === t.id ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
                {t.icon}
              </div>
              <span className={`text-[10px] font-black uppercase mt-1.5 tracking-tighter transition-opacity ${tab === t.id ? 'opacity-100' : 'opacity-40'}`}>
                {t.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default App;
