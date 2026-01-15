import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, FileText, Zap, Trash2, Bot, User } from 'lucide-react';
import { useChatAssistant } from '@/hooks/useChatAssistant';
import type { IndicatorValues, MarketClassification } from '@/types/analysis';
import { cn } from '@/lib/utils';

interface ChatAssistantProps {
  ticker: string | null;
  indicators: IndicatorValues | null;
  timeframe?: string;
}

export function ChatAssistant({ ticker, indicators, timeframe = '1D' }: ChatAssistantProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    generateFullReport,
    quickAnalysis,
  } = useChatAssistant({ ticker, indicators, timeframe });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');
    await sendMessage(message);
  };

  const quickCommands = [
    { label: 'Analisar', icon: Zap, action: () => sendMessage('Analise o cenário atual') },
    { label: 'Relatório', icon: FileText, action: generateFullReport },
  ];

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-border bg-secondary/30">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider">
            Assistente IA
          </span>
          {ticker && (
            <span className="text-xs text-muted-foreground">• {ticker}</span>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={clearMessages}
          disabled={messages.length === 0}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-10 w-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              {ticker ? `Pronto para analisar ${ticker}` : 'Selecione um ativo'}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Pergunte sobre tendência, risco ou indicadores
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'flex gap-2',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary/50 border border-border'
                  )}
                >
                  {msg.metadata?.classification && (
                    <div className="flex items-center gap-1 mb-1 text-xs font-mono">
                      <span>{msg.metadata.classification.emoji}</span>
                      <span className="opacity-70">{msg.metadata.classification.label}</span>
                    </div>
                  )}
                  <div className={cn(
                    msg.metadata?.isReport && 'font-mono text-xs whitespace-pre-wrap'
                  )}>
                    {msg.content}
                  </div>
                </div>
                {msg.role === 'user' && (
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-3.5 w-3.5 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex gap-2">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-primary animate-pulse" />
                </div>
                <div className="bg-secondary/50 border border-border rounded-lg px-3 py-2">
                  <span className="text-xs text-muted-foreground animate-pulse">Analisando...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Error */}
      {error && (
        <div className="px-3 py-2 bg-destructive/10 border-t border-destructive/20">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex gap-1.5 px-3 py-2 border-t border-border">
        {quickCommands.map((cmd) => (
          <Button
            key={cmd.label}
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={cmd.action}
            disabled={isLoading || !ticker}
          >
            <cmd.icon className="h-3 w-3" />
            {cmd.label}
          </Button>
        ))}
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 pt-0">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={ticker ? "Pergunte sobre o mercado..." : "Selecione um ativo"}
            className="flex-1 h-9 text-sm"
            disabled={isLoading || !ticker}
          />
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9"
            disabled={isLoading || !input.trim() || !ticker}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
