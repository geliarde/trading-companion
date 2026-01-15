// useChatAssistant - Hook para gerenciar o chat com a IA

import { useState, useCallback, useRef } from 'react';
import type { ChatMessage, IndicatorValues, MarketClassification } from '@/types/analysis';
import { streamAnalysisChat, detectCommand, parseClassificationFromResponse } from '@/engines/MarketAnalyzer';
import { generateReport, generateShortSummary } from '@/engines/ReportGenerator';

interface UseChatAssistantOptions {
  ticker: string | null;
  indicators: IndicatorValues | null;
  timeframe?: string;
}

interface UseChatAssistantReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
  generateFullReport: () => Promise<void>;
  quickAnalysis: () => Promise<void>;
}

export function useChatAssistant(options: UseChatAssistantOptions): UseChatAssistantReturn {
  const { ticker, indicators, timeframe = '1D' } = options;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const createMessage = (role: 'user' | 'assistant', content: string, metadata?: ChatMessage['metadata']): ChatMessage => ({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    role,
    content,
    timestamp: new Date(),
    metadata,
  });

  const sendMessage = useCallback(async (content: string) => {
    if (!ticker || !indicators) {
      setError('Selecione um ativo para começar a análise.');
      return;
    }

    setError(null);
    setIsLoading(true);

    // Add user message
    const userMessage = createMessage('user', content);
    setMessages((prev) => [...prev, userMessage]);

    // Check for commands and transform if needed
    const command = detectCommand(content);
    const actualPrompt = command ?? content;

    // Prepare message history for context
    const messageHistory = messages.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));
    messageHistory.push({ role: 'user', content: actualPrompt });

    // Create assistant message placeholder
    let assistantContent = '';
    const updateAssistant = (chunk: string) => {
      assistantContent += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === 'assistant') {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantContent } : m
          );
        }
        return [...prev, createMessage('assistant', assistantContent)];
      });
    };

    try {
      await streamAnalysisChat({
        messages: messageHistory,
        ticker,
        indicators,
        onDelta: updateAssistant,
        onDone: () => {
          // Parse classification from response
          const classification = parseClassificationFromResponse(assistantContent);
          if (classification) {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === 'assistant') {
                updated[lastIdx] = {
                  ...updated[lastIdx],
                  metadata: { ...updated[lastIdx].metadata, classification },
                };
              }
              return updated;
            });
          }
          setIsLoading(false);
        },
        onError: (err) => {
          setError(err.message);
          setIsLoading(false);
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      setIsLoading(false);
    }
  }, [ticker, indicators, messages]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const generateFullReport = useCallback(async () => {
    if (!ticker || !indicators) {
      setError('Selecione um ativo para gerar o relatório.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const report = generateReport(ticker, timeframe, indicators);
    
    const reportMessage = createMessage('assistant', report.formattedText, {
      classification: report.classification,
      indicators,
      isReport: true,
    });

    setMessages((prev) => [...prev, reportMessage]);
    setIsLoading(false);
  }, [ticker, indicators, timeframe]);

  const quickAnalysis = useCallback(async () => {
    if (!ticker || !indicators) {
      setError('Selecione um ativo para análise rápida.');
      return;
    }

    const summary = generateShortSummary(indicators);
    const message = createMessage('assistant', summary);
    setMessages((prev) => [...prev, message]);
  }, [ticker, indicators]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    generateFullReport,
    quickAnalysis,
  };
}
