
import React, { useState, useEffect } from 'react';
import { NOTES, CHORDS_MAP, SCALES_MAP, NOTE_FREQS } from '../constants.ts';
import { AudioService } from '../services/audioService.ts';
import { Play, Square, Volume2, Gauge, Music2, Settings2 } from 'lucide-react';

const Chords: React.FC = () => {
  const [mode, setMode] = useState<'chord' | 'scale'>('chord');
  const [root, setRoot] = useState("C");
  const [type, setType] = useState("Maior");
  const [playing, setPlaying] = useState(false);
  const [activeNoteIdx, setActiveNoteIdx] = useState<number | null>(null);
  const [bpm, setBpm] = useState(120);
  const [volume, setVolume] = useState(0.5);
  const [showControls, setShowControls] = useState(false);
  
  const tunings = ["G", "C", "E", "A"];
  const audio = AudioService.getInstance();

  const getTargetNotes = () => {
    const rootIdx = NOTES.indexOf(root);
    const intervals = mode === 'chord' ? CHORDS_MAP[type] : SCALES_MAP[type];
    if (!intervals) return [];
    return intervals.map(interval => NOTES[(rootIdx + interval) % 12]);
  };

  const getFretData = () => {
    const targetNotes = getTargetNotes();
    return tunings.map(string => {
      const stringBaseIdx = NOTES.indexOf(string);
      const foundFrets: number[] = [];
      for (let fret = 0; fret <= 5; fret++) {
        const currentNote = NOTES[(stringBaseIdx + fret) % 12];
        if (targetNotes.includes(currentNote)) {
          foundFrets.push(fret);
          if (mode === 'chord') break;
        }
      }
      return foundFrets;
    });
  };

  const targetNotes = getTargetNotes();
  const fretData = getFretData();

  useEffect(() => { audio.setBpm(bpm); }, [bpm]);

  const togglePlay = () => {
    if (playing) {
      audio.stopArpeggio();
      setPlaying(false);
      setActiveNoteIdx(null);
    } else {
      setPlaying(true);
      const freqs = targetNotes.map(n => NOTE_FREQS[`${n}4`] || 440);
      audio.startArpeggio(freqs, volume, (idx) => setActiveNoteIdx(idx));
    }
  };

  useEffect(() => {
    if (playing) { audio.stopArpeggio(); setPlaying(false); setActiveNoteIdx(null); }
  }, [root, type, mode]);

  return (
    <div className="flex flex-col items-center animate-fade-in w-full max-w-lg mx-auto space-y-6">
      
      {/* Seletores de Topo */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <div className="bg-slate-900 p-4 rounded-3xl border border-white/5 shadow-xl">
          <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest">Tônica</label>
          <select value={root} onChange={e => setRoot(e.target.value)} className="w-full bg-transparent text-xl font-black outline-none cursor-pointer">
            {NOTES.map(n => <option key={n} value={n} className="bg-slate-900">{n}</option>)}
          </select>
        </div>
        <div className="bg-slate-900 p-4 rounded-3xl border border-white/5 shadow-xl">
          <label className="text-[10px] uppercase font-black text-slate-500 mb-2 block tracking-widest">Tipo</label>
          <select value={type} onChange={e => setType(e.target.value)} className="w-full bg-transparent text-xl font-black outline-none cursor-pointer">
            {Object.keys(mode === 'chord' ? CHORDS_MAP : SCALES_MAP).map(t => <option key={t} value={t} className="bg-slate-900">{t}</option>)}
          </select>
        </div>
      </div>

      {/* Braço Visual */}
      <div className="w-full bg-slate-900/40 rounded-[4rem] p-10 border border-white/5 flex flex-col items-center shadow-inner backdrop-blur-md">
        <h2 className="text-7xl font-black text-white mb-10 tracking-tighter">
          {root}<span className="text-blue-500 text-3xl ml-1">{mode === 'chord' && type === 'Maior' ? '' : type.charAt(0)}</span>
        </h2>
        
        <svg width="180" height="260" viewBox="0 0 160 240">
          {[0, 1, 2, 3].map(i => <line key={i} x1={30 + i * 33} y1={40} x2={30 + i * 33} y2={220} stroke="#334155" strokeWidth="3" />)}
          {[0, 1, 2, 3, 4, 5].map(i => <line key={i} x1={30} y1={40 + i * 36} x2={130} y2={40 + i * 36} stroke="#334155" strokeWidth="2" />)}
          <line x1={30} y1={40} x2={130} y2={40} stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" />
          {fretData.map((frets, stringIdx) => frets.map(fret => {
            const x = 30 + stringIdx * 33;
            const cy = fret === 0 ? 18 : 40 + fret * 36 - 18;
            const noteName = NOTES[(NOTES.indexOf(tunings[stringIdx]) + fret) % 12];
            const active = activeNoteIdx !== null && targetNotes[activeNoteIdx] === noteName;
            return (
              <g key={`${stringIdx}-${fret}`}>
                <circle cx={x} cy={cy} r={fret === 0 ? 8 : 14} fill={active ? "#4ade80" : fret === 0 ? "none" : "#3b82f6"} stroke={fret === 0 ? (active ? "#4ade80" : "#3b82f6") : "none"} strokeWidth={fret === 0 ? 3 : 0} />
                {fret !== 0 && <text x={x} y={cy + 4} fontSize="10" fontWeight="900" textAnchor="middle" fill={active ? "#052e16" : "white"}>{noteName}</text>}
              </g>
            );
          }))}
        </svg>
      </div>

      {/* Player de Som */}
      <div className="w-full bg-slate-900 rounded-[3rem] p-6 border border-white/5 shadow-2xl">
        <div className="flex items-center justify-between">
          <button onClick={togglePlay} className={`w-16 h-16 rounded-3xl flex items-center justify-center transition-all shadow-xl active:scale-90 ${playing ? 'bg-red-500 shadow-red-500/20' : 'bg-blue-600 shadow-blue-500/30'}`}>
            {playing ? <Square size={26} fill="white" /> : <Play size={26} fill="white" className="ml-1" />}
          </button>
          
          <div className="flex-1 px-8">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Andamento</span>
              <span className="text-xs font-bold text-blue-400">{bpm} BPM</span>
            </div>
            <input type="range" min="40" max="220" value={bpm} onChange={e => setBpm(Number(e.target.value))} className="w-full h-1 bg-slate-800 accent-blue-500 rounded-full appearance-none" />
          </div>

          <button onClick={() => setShowControls(!showControls)} className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${showControls ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
            <Settings2 size={22} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chords;
