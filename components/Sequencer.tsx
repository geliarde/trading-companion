
import React, { useState, useEffect, useRef } from 'react';
import { AudioService } from '../services/audioService.ts';
import { Play, Square, Trash2, FastForward } from 'lucide-react';

const Sequencer: React.FC = () => {
  const [bpm, setBpm] = useState(120);
  const [playing, setPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [volumes, setVolumes] = useState<number[]>([0.8, 0.6, 0.4, 0.5]);
  const [pattern, setPattern] = useState<boolean[][]>([
    new Array(16).fill(false), // Kick
    new Array(16).fill(false), // Snare
    new Array(16).fill(false), // HiHat
    new Array(16).fill(false), // Uke
  ]);

  const patternRef = useRef(pattern);
  const volumesRef = useRef(volumes);
  const audio = AudioService.getInstance();

  useEffect(() => { patternRef.current = pattern; }, [pattern]);
  useEffect(() => { volumesRef.current = volumes; }, [volumes]);
  useEffect(() => { audio.setBpm(bpm); }, [bpm]);

  const toggleStep = (row: number, col: number) => {
    const newPattern = pattern.map((r, rIdx) => 
      rIdx === row ? r.map((c, cIdx) => cIdx === col ? !c : c) : r
    );
    setPattern(newPattern);
  };

  const togglePlay = () => {
    if (playing) {
      audio.stopSequencer();
      setPlaying(false);
      setCurrentStep(-1);
    } else {
      setPlaying(true);
      audio.startSequencer(patternRef.current, volumesRef.current, (step) => {
        setCurrentStep(step);
      });
    }
  };

  const clear = () => {
    setPattern(new Array(4).fill(null).map(() => new Array(16).fill(false)));
  };

  const trackNames = ['BUMBO', 'CAIXA', 'PRATO', 'UKULELE'];
  const trackColors = ['bg-red-500', 'bg-yellow-500', 'bg-teal-500', 'bg-blue-500'];

  return (
    <div className="flex flex-col items-center p-4 space-y-6 animate-fade-in w-full max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/5 shadow-xl flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Velocidade</span>
            <span className="text-3xl font-black">{bpm} <span className="text-xs text-slate-500">BPM</span></span>
          </div>
          <button 
            onClick={togglePlay} 
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${playing ? 'bg-red-500 text-white' : 'bg-blue-600 text-white'}`}
          >
            {playing ? <Square size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
          </button>
        </div>

        <div className="bg-slate-900/80 p-5 rounded-3xl border border-white/5 shadow-xl flex items-center justify-between">
          <input 
            type="range" min="60" max="180" value={bpm} 
            onChange={e => setBpm(Number(e.target.value))} 
            className="flex-1 accent-blue-500 h-1" 
          />
          <button onClick={clear} className="ml-4 text-[10px] uppercase font-bold text-slate-500 hover:text-red-400">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto pb-4 scrollbar-hide">
        <div className="inline-flex flex-col gap-3 min-w-[600px]">
          {pattern.map((row, rIdx) => (
            <div key={rIdx} className="flex items-center gap-3">
              <span className="w-16 text-[9px] font-black text-slate-500 text-right uppercase tracking-tighter">{trackNames[rIdx]}</span>
              <div className="flex gap-1 flex-1">
                {row.map((active, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => toggleStep(rIdx, cIdx)}
                    className={`
                      w-8 h-12 rounded-lg transition-all
                      ${cIdx % 4 === 0 ? 'ml-2' : ''}
                      ${active ? trackColors[rIdx] : 'bg-slate-800/50'}
                      ${currentStep === cIdx ? 'ring-2 ring-white scale-105 z-10' : ''}
                    `}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Sequencer;
