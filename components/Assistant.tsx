
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Message } from '../types.ts';
import { Send, Loader2, Sparkles } from 'lucide-react';

const Assistant: React.FC = () => {
  const [msgs, setMsgs] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou seu Coach de Ukulele. Precisa de ajuda com alguma batida, acorde ou teoria musical?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    const newMsg: Message = { role: 'user', content: userMsg };
    setMsgs(p => [...p, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: userMsg,
        config: { 
          systemInstruction: 'Você é um professor de Ukulele experiente, didático e motivador. Responda em Português do Brasil. Suas respostas devem ser curtas (máximo 3 parágrafos) e focadas na prática. Se o usuário perguntar sobre acordes, use notação de cifras (ex: C, G7, Am).' 
        }
      });
      setMsgs(p => [...p, { role: 'assistant', content: response.text || 'Ops, não consegui processar sua dúvida.' }]);
    } catch (err) {
      console.error(err);
      setMsgs(p => [...p, { role: 'assistant', content: 'Desculpe, estou com dificuldades de conexão no momento.' }]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="flex flex-col h-[70vh] animate-fade-in bg-slate-900/20 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-white/5 bg-white/5 flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Sparkles size={20} className="text-white" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest">Coach AI</h3>
          <p className="text-[10px] text-green-400 font-bold uppercase tracking-tighter">Online & Pronto</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {msgs.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed shadow-sm ${
              m.role === 'user' 
                ? 'bg-blue-600 text-white rounded-br-none' 
                : 'bg-slate-800 text-slate-200 rounded-bl-none border border-white/5'
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 p-4 rounded-3xl rounded-bl-none border border-white/5 flex items-center gap-3">
              <Loader2 className="animate-spin text-blue-500" size={16} />
              <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-950/50 backdrop-blur-md">
        <div className="flex gap-2 bg-slate-900 border border-white/10 rounded-2xl p-2 focus-within:ring-2 ring-blue-500/50 transition-all">
          <input 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && send()} 
            placeholder="Ex: Como faço o ritmo de Pop?" 
            className="flex-1 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-slate-600" 
          />
          <button 
            onClick={send} 
            disabled={loading || !input.trim()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
              loading || !input.trim() ? 'bg-slate-800 text-slate-600' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 hover:scale-105 active:scale-95'
            }`}
          >
            <Send size={20}/>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Assistant;
