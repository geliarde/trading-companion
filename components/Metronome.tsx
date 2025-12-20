
import React, { useState, useEffect } from 'react';
import { AudioService } from '../services/audioService.ts';
import { Play, Square, Activity } from 'lucide-react';

const Metronome: React.FC = () => {
  const [bpm, setBpm] = useState(80);
  const [playing, setPlaying] = useState(false);
  const [tick, setTick] = useState(false);
  const audio = AudioService.getInstance();

  const toggle = () => {
    if (playing) { 
      audio.stopMetronome(); 
      setPlaying(false); 
      setTick(false);
    } else { 
      audio.startMetronome(() => {
        setTick(true);
        setTimeout(() => setTick(false), 100);
      }); 
      setPlaying(true); 
    }
  };

  useEffect(() => { 
    audio.setBpm(bpm); 
  }, [bpm]);

  return (
    <div className="flex flex-col items-center p-6 space-y-12 animate-fade-in max-w-sm mx-auto">
      <div className="relative flex items-center justify-center">
        {/* Anel de Pulsação */}
        <div className={`absolute inset-0 rounded-full border-4 transition-all duration-300 ${tick ? 'border-blue-500 scale-125 opacity-0' : 'border-transparent scale-100 opacity-0'}`}></div>
        
        {/* Círculo Central */}
        <div className={`w-56 h-56 rounded-full border-8 bg-slate-900 flex flex-col items-center justify-center transition-all duration-150 shadow-2xl ${tick ? 'border-blue-500 shadow-blue-500/30' : 'border-slate-800 shadow-black'}`}>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-1">Ritmo</span>
          <span className="text-7xl font-black tracking-tighter">{bpm}</span>
          <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mt-1">BPM</span>
        </div>
      </div>

      <div className="w-full space-y-6">
        <div className="flex justify-between items-center px-1">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Velocidade</span>
          <Activity size={14} className={playing ? "text-blue-500 animate-pulse" : "text-slate-700"} />
        </div>
        <input 
          type="range" 
          min="40" 
          max="240" 
          value={bpm} 
          onChange={e => setBpm(Number(e.target.value))} 
          className="w-full accent-blue-500 h-2 bg-slate-800 rounded-full appearance-none cursor-pointer" 
        />
        <div className="flex justify-between text-[10px] font-bold text-slate-700 uppercase tracking-tighter">
          <span>Largo (40)</span>
          <span>Moderato (120)</span>
          <span>Presto (240)</span>
        </div>
      </div>

      <button 
        onClick={toggle} 
        className={`w-24 h-24 rounded-[2.5rem] flex items-center justify-center transition-all duration-300 shadow-2xl active:scale-90 ${playing ? 'bg-red-500 shadow-red-500/30 rotate-180' : 'bg-blue-600 shadow-blue-500/30'}`}
      >
        {playing ? <Square size={32} fill="white" className="text-white" /> : <Play size={32} fill="white" className="text-white ml-2" />}
      </button>

      <div className="p-4 bg-slate-900/40 rounded-3xl border border-white/5 w-full text-center">
        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-relaxed">
          Ouvir o clique ajuda a manter o tempo firme.<br/>Pratique escalas em <span className="text-blue-400">60 BPM</span> para começar.
        </p>
      </div>
    </div>
  );
};

export default Metronome;
