
import React, { useState, useEffect, useRef } from 'react';
import { AudioService } from '../services/audioService.ts';
import { TuningResult } from '../types.ts';
import { Mic, MicOff, Zap } from 'lucide-react';
import { NOTES } from '../constants.ts';

const Tuner: React.FC = () => {
  const [tuning, setTuning] = useState<TuningResult>({ freq: 0, note: '-', cents: 0, diff: 0, status: 'silent' });
  const [active, setActive] = useState(false);
  const audio = AudioService.getInstance();
  const raf = useRef<number>(0);
  const [jitter, setJitter] = useState(0);

  const toggle = async () => {
    if (active) {
      audio.stopMic();
      setActive(false);
      if (raf.current) cancelAnimationFrame(raf.current);
    } else {
      try {
        await audio.startMic();
        setActive(true);
        const loop = () => {
          const result = audio.getTuning();
          setTuning(result);
          if (result.status !== 'silent') {
            setJitter((Math.random() - 0.5) * 1.5); // Simulação de vibração realística
          }
          raf.current = requestAnimationFrame(loop);
        };
        loop();
      } catch (err) {
        alert("Erro ao acessar o microfone. Verifique se deu permissão no navegador.");
      }
    }
  };

  const getStatusColor = () => {
    if (tuning.status === 'in-tune') return 'text-green-400';
    if (tuning.status === 'silent') return 'text-slate-600';
    return 'text-blue-400';
  };

  return (
    <div className="flex flex-col items-center p-4 pt-6 space-y-6 animate-fade-in max-w-md mx-auto">
      {/* Escala de Notas Superior */}
      <div className="w-full flex justify-between px-2 mb-2">
        {NOTES.map((n) => (
          <span key={n} className={`text-[10px] font-black transition-all duration-300 ${tuning.note === n ? 'text-blue-400 scale-150 opacity-100' : 'text-slate-600 opacity-40'}`}>
            {n}
          </span>
        ))}
      </div>

      {/* Mostrador do Afinador */}
      <div className={`relative w-full aspect-[4/3] bg-slate-900/80 rounded-[3rem] border-2 transition-all duration-500 flex flex-col items-center justify-end pb-12 overflow-hidden backdrop-blur-xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] ${tuning.status === 'in-tune' ? 'border-green-500/50 shadow-[0_0_40px_rgba(74,222,128,0.1)]' : 'border-slate-800'}`}>
        
        {/* Info Central */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-10">
          <span className={`text-[130px] leading-none font-black tracking-tighter drop-shadow-2xl transition-all duration-75 ${getStatusColor()}`}>
            {tuning.note}
          </span>
          <div className="flex flex-col items-center -mt-2">
            <span className="text-[12px] font-mono font-bold text-slate-500 tracking-[0.4em] uppercase">
              {tuning.status === 'silent' ? 'STANDBY' : `${tuning.freq.toFixed(1)} HZ`}
            </span>
          </div>
        </div>

        {/* Ponteiro Analógico */}
        <div 
          className={`absolute bottom-[-10%] w-1.5 h-[80%] origin-bottom transition-transform duration-75 ease-out z-20 ${tuning.status === 'in-tune' ? 'bg-green-400' : 'bg-gradient-to-t from-blue-700 to-blue-400'}`}
          style={{ 
            transform: `rotate(${active && tuning.status !== 'silent' ? (tuning.cents * 0.9) + jitter : 0}deg)`,
            filter: tuning.status === 'in-tune' ? 'drop-shadow(0 0 10px #4ade80)' : 'none'
          }}
        >
          <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${tuning.status === 'in-tune' ? 'bg-green-400 shadow-[0_0_15px_#4ade80]' : 'bg-blue-400'} `}></div>
        </div>

        {/* Arco de Referência */}
        <div className="absolute inset-x-8 top-12 bottom-12 border-t-2 border-white/5 rounded-full pointer-events-none"></div>
      </div>

      {/* Régua de Precisão */}
      <div className="w-full space-y-3">
        <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase px-1 tracking-widest">
          <span>BAIXO</span>
          <span className={tuning.status === 'in-tune' ? 'text-green-400' : ''}>PERFEITO</span>
          <span>ALTO</span>
        </div>
        <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5 relative shadow-inner">
          <div 
            className={`absolute top-0 h-full transition-all duration-150 ${tuning.status === 'in-tune' ? 'bg-green-500 shadow-[0_0_20px_#4ade80]' : 'bg-blue-600'}`}
            style={{ 
              left: '50%', 
              width: `${Math.min(50, Math.abs(tuning.cents))}%`,
              transform: `translateX(${tuning.cents < 0 ? '-100%' : '0'})`
            }}
          ></div>
          <div className="absolute left-1/2 top-0 w-1 h-full bg-white/20 z-10 shadow-[0_0_10px_white]"></div>
        </div>
      </div>

      {/* Botão de Controle */}
      <button 
        onClick={toggle} 
        className={`w-full flex items-center justify-center gap-4 py-6 rounded-[2.5rem] font-black transition-all active:scale-95 ${active ? 'bg-red-500/10 text-red-500 border border-red-500/30' : 'bg-blue-600 text-white shadow-2xl shadow-blue-500/30'}`}
      >
        {active ? <MicOff size={28} /> : <Mic size={28} />}
        <span className="tracking-tight text-xl uppercase">{active ? 'DESATIVAR' : 'AFINAR AGORA'}</span>
      </button>

      <div className="flex items-center gap-3 bg-slate-900/40 p-5 rounded-3xl border border-white/5">
        <Zap size={18} className="text-yellow-500 shrink-0" />
        <p className="text-[11px] text-slate-400 leading-tight">
          Padrão G-C-E-A. Toque uma corda por vez. O ponteiro fica <span className="text-green-400 font-bold uppercase">Verde</span> quando estiver no tom certo.
        </p>
      </div>
    </div>
  );
};

export default Tuner;
