// MarketAnalyzer - Cliente para comunicação com a IA de análise de mercado

import type { IndicatorValues, AnalysisResponse, ChatMessage, MarketClassification } from '@/types/analysis';

const MARKET_ANALYZER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/market-analyzer`;

interface StreamChatOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  ticker: string;
  indicators: IndicatorValues;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError?: (error: Error) => void;
}

/**
 * Streaming chat com a IA de análise de mercado
 */
export async function streamAnalysisChat(options: StreamChatOptions): Promise<void> {
  const { messages, ticker, indicators, onDelta, onDone, onError } = options;

  try {
    const response = await fetch(MARKET_ANALYZER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({
        messages,
        ticker,
        indicators,
        streamResponse: true,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    if (!response.body) {
      throw new Error('Resposta sem corpo');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = '';
    let streamDone = false;

    while (!streamDone) {
      const { done, value } = await reader.read();
      if (done) break;

      textBuffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
        let line = textBuffer.slice(0, newlineIndex);
        textBuffer = textBuffer.slice(newlineIndex + 1);

        if (line.endsWith('\r')) line = line.slice(0, -1);
        if (line.startsWith(':') || line.trim() === '') continue;
        if (!line.startsWith('data: ')) continue;

        const jsonStr = line.slice(6).trim();
        if (jsonStr === '[DONE]') {
          streamDone = true;
          break;
        }

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          // Incomplete JSON, put back and wait
          textBuffer = line + '\n' + textBuffer;
          break;
        }
      }
    }

    // Flush remaining buffer
    if (textBuffer.trim()) {
      for (let raw of textBuffer.split('\n')) {
        if (!raw) continue;
        if (raw.endsWith('\r')) raw = raw.slice(0, -1);
        if (raw.startsWith(':') || raw.trim() === '') continue;
        if (!raw.startsWith('data: ')) continue;
        const jsonStr = raw.slice(6).trim();
        if (jsonStr === '[DONE]') continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) onDelta(content);
        } catch {
          /* ignore */
        }
      }
    }

    onDone();
  } catch (error) {
    console.error('Stream analysis error:', error);
    if (onError) {
      onError(error instanceof Error ? error : new Error('Erro desconhecido'));
    }
  }
}

/**
 * Análise não-streaming (para relatórios)
 */
export async function analyzeMarket(
  ticker: string,
  indicators: IndicatorValues,
  question: string
): Promise<string> {
  const response = await fetch(MARKET_ANALYZER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({
      messages: [{ role: 'user', content: question }],
      ticker,
      indicators,
      streamResponse: false,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Erro ${response.status}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content ?? 'Sem resposta';
}

/**
 * Comandos pré-definidos para o chat
 */
export const CHAT_COMMANDS = {
  ANALYZE: 'Analise o cenário atual deste ativo com base nos indicadores fornecidos.',
  EXPLAIN_RSI: 'Explique o RSI atual e o que ele indica sobre o mercado.',
  TREND: 'O mercado está em tendência? Se sim, qual a direção e força?',
  REPORT: 'Gere um relatório completo com classificação de risco.',
  LAST_CANDLE: 'O que mudou desde o último candle? Houve alguma alteração significativa?',
  RISK: 'Qual o nível de risco atual baseado nos indicadores?',
  SUPPORT_RESISTANCE: 'Explique os níveis de suporte e resistência atuais.',
  EMAS: 'Analise a posição das EMAs e o que indicam sobre a tendência.',
  VOLUME: 'O volume atual está normal? O que isso indica?',
} as const;

/**
 * Detecta e processa comandos do usuário
 */
export function detectCommand(input: string): string | null {
  const normalizedInput = input.toLowerCase().trim();

  if (normalizedInput.includes('analise') && normalizedInput.includes('cenário')) {
    return CHAT_COMMANDS.ANALYZE;
  }
  if (normalizedInput.includes('explique') && normalizedInput.includes('rsi')) {
    return CHAT_COMMANDS.EXPLAIN_RSI;
  }
  if (normalizedInput.includes('tendência') || normalizedInput.includes('tendencia')) {
    return CHAT_COMMANDS.TREND;
  }
  if (normalizedInput.includes('relatório') || normalizedInput.includes('relatorio')) {
    return CHAT_COMMANDS.REPORT;
  }
  if (normalizedInput.includes('último candle') || normalizedInput.includes('mudou')) {
    return CHAT_COMMANDS.LAST_CANDLE;
  }
  if (normalizedInput.includes('risco')) {
    return CHAT_COMMANDS.RISK;
  }
  if (normalizedInput.includes('suporte') || normalizedInput.includes('resistência')) {
    return CHAT_COMMANDS.SUPPORT_RESISTANCE;
  }
  if (normalizedInput.includes('ema') || normalizedInput.includes('médias')) {
    return CHAT_COMMANDS.EMAS;
  }
  if (normalizedInput.includes('volume')) {
    return CHAT_COMMANDS.VOLUME;
  }

  return null; // No command detected, use original input
}

/**
 * Parse classification from AI response
 */
export function parseClassificationFromResponse(text: string): MarketClassification | null {
  if (text.includes('🟢') || text.toLowerCase().includes('favorável')) {
    return { status: 'favorable', emoji: '🟢', label: 'Favorável' };
  }
  if (text.includes('🔴') || text.toLowerCase().includes('risco')) {
    return { status: 'risk', emoji: '🔴', label: 'Risco elevado' };
  }
  if (text.includes('🟡') || text.toLowerCase().includes('neutro') || text.toLowerCase().includes('atenção')) {
    return { status: 'neutral', emoji: '🟡', label: 'Neutro / Atenção' };
  }
  return null;
}
