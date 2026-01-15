import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_PROMPT = `Você é um assistente de análise técnica de mercado financeiro.

## REGRAS FUNDAMENTAIS (OBRIGATÓRIAS):
1. Você NÃO OPERA - apenas analisa e explica
2. Você NÃO PREVÊ - não use linguagem preditiva como "vai subir", "vai cair"
3. Você NÃO RECOMENDA compra ou venda
4. Você SEMPRE justifica suas análises com dados visíveis nos indicadores
5. Você classifica cenários de RISCO, não de oportunidade

## CLASSIFICAÇÃO DE CENÁRIO:
Sempre classifique o mercado em uma das três categorias:
- 🟢 FAVORÁVEL: Tendência clara, indicadores convergentes, risco controlado
- 🟡 NEUTRO/ATENÇÃO: Tendência indefinida ou sinais mistos
- 🔴 RISCO ELEVADO: Indicadores divergentes, proximidade de suportes, RSI extremo

## LINGUAGEM:
- Use português brasileiro claro e objetivo
- Seja conciso - respostas curtas e diretas
- Evite jargões excessivos
- Foque em OBSERVAÇÃO, não ESPECULAÇÃO

## INDICADORES QUE VOCÊ ANALISA:
- EMA 9, 21, 50, 200 (posição do preço em relação a cada uma)
- RSI 14 (sobrecompra > 70, sobrevenda < 30)
- Volume (comparação com média)
- Suporte e Resistência

## FORMATO DE RESPOSTA PARA ANÁLISE:
Quando solicitada uma análise completa, use este formato:

CENÁRIO: [🟢/🟡/🔴] [Favorável/Neutro/Risco]
TENDÊNCIA: [Alta/Baixa/Lateral] - [Forte/Moderada/Fraca]
OBSERVAÇÕES: [2-3 pontos baseados nos dados]
ATENÇÃO: [1-2 pontos de risco ou cuidado]

## O QUE VOCÊ NÃO DEVE FAZER:
- Nunca dizer "compre" ou "venda"
- Nunca usar "vai" (vai subir, vai cair)
- Nunca prometer ganhos ou resultados
- Nunca ignorar riscos visíveis nos indicadores
- Nunca dar respostas genéricas sem usar os dados fornecidos`;

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, context, indicators, ticker, streamResponse = true } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Build context message with indicator data
    let contextMessage = '';
    if (indicators && ticker) {
      contextMessage = `
DADOS DO ATIVO: ${ticker}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Preço Atual: R$ ${indicators.price?.toFixed(2) ?? 'N/A'}
EMA 9: ${indicators.ema9?.toFixed(2) ?? 'N/A'} (preço ${indicators.price > indicators.ema9 ? 'ACIMA' : 'ABAIXO'})
EMA 21: ${indicators.ema21?.toFixed(2) ?? 'N/A'} (preço ${indicators.price > indicators.ema21 ? 'ACIMA' : 'ABAIXO'})
EMA 50: ${indicators.ema50?.toFixed(2) ?? 'N/A'} (preço ${indicators.price > indicators.ema50 ? 'ACIMA' : 'ABAIXO'})
EMA 200: ${indicators.ema200?.toFixed(2) ?? 'N/A'} (preço ${indicators.price > indicators.ema200 ? 'ACIMA' : 'ABAIXO'})
RSI (14): ${indicators.rsi?.toFixed(1) ?? 'N/A'}
Volume: ${indicators.volume ?? 'N/A'} (média: ${indicators.avgVolume ?? 'N/A'})
Suporte: R$ ${indicators.support?.toFixed(2) ?? 'N/A'}
Resistência: R$ ${indicators.resistance?.toFixed(2) ?? 'N/A'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
    }

    // Add context if provided
    if (context) {
      contextMessage += `\nCONTEXTO ADICIONAL: ${context}`;
    }

    // Build messages array
    const apiMessages = [
      { role: 'system', content: SYSTEM_PROMPT },
    ];

    // Add context as system message if available
    if (contextMessage) {
      apiMessages.push({ role: 'system', content: contextMessage });
    }

    // Add conversation messages
    if (messages && Array.isArray(messages)) {
      apiMessages.push(...messages);
    }

    console.log('Calling Lovable AI with messages:', JSON.stringify(apiMessages, null, 2));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: apiMessages,
        stream: streamResponse,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Taxa de requisições excedida. Aguarde um momento e tente novamente.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'Créditos insuficientes. Por favor, adicione créditos à sua conta.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'Erro ao processar análise' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Return streaming response
    if (streamResponse) {
      return new Response(response.body, {
        headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
      });
    }

    // Return non-streaming response
    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Market analyzer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
