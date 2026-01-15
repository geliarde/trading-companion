// ReportGenerator - Gerador de relatórios estruturados
// Gera relatórios claros e objetivos para leitura rápida

import type {
  MarketReport,
  MarketClassification,
  IndicatorValues,
  TrendDirection,
  TrendStrength,
  AnalysisResponse,
} from '@/types/analysis';
import { analyzeTrend, classifyRSI, classifyVolume } from './IndicatorsEngine';

/**
 * Determina classificação de mercado baseada nos indicadores
 */
export function classifyMarket(
  indicators: IndicatorValues,
  trend: TrendDirection,
  trendStrength: TrendStrength
): MarketClassification {
  const { rsi, price, support, resistance, volume, avgVolume } = indicators;
  const rsiZone = classifyRSI(rsi);
  const volumeStatus = classifyVolume(volume, avgVolume);

  // Pontuação para classificação
  let score = 0;

  // Tendência
  if (trend === 'alta') score += trendStrength === 'forte' ? 3 : trendStrength === 'moderada' ? 2 : 1;
  else if (trend === 'baixa') score -= trendStrength === 'forte' ? 3 : trendStrength === 'moderada' ? 2 : 1;

  // RSI
  if (rsiZone === 'sobrevenda') score += 1; // Possível reversão
  else if (rsiZone === 'sobrecompra') score -= 1; // Possível correção

  // Proximidade com suporte/resistência
  const distToSupport = ((price - support) / price) * 100;
  const distToResistance = ((resistance - price) / price) * 100;

  if (distToSupport < 2) score -= 1; // Próximo ao suporte = atenção
  if (distToResistance < 2) score += 1; // Próximo à resistência = possível breakout

  // Volume
  if (volumeStatus === 'alto') {
    if (trend === 'alta') score += 1;
    else if (trend === 'baixa') score -= 1;
  }

  // Classificação final
  if (score >= 2) {
    return { status: 'favorable', emoji: '🟢', label: 'Favorável' };
  } else if (score <= -2) {
    return { status: 'risk', emoji: '🔴', label: 'Risco elevado' };
  } else {
    return { status: 'neutral', emoji: '🟡', label: 'Neutro / Atenção' };
  }
}

/**
 * Gera pontos de atenção baseados nos indicadores
 */
export function generateAttentionPoints(indicators: IndicatorValues, trend: TrendDirection): string[] {
  const points: string[] = [];
  const { rsi, price, support, resistance, volume, avgVolume, ema9, ema21, ema50, ema200 } = indicators;

  const distToSupport = ((price - support) / price) * 100;
  const distToResistance = ((resistance - price) / price) * 100;

  // RSI extremos
  if (rsi >= 70) {
    points.push(`RSI em ${rsi.toFixed(1)} indica sobrecompra - possível correção`);
  } else if (rsi <= 30) {
    points.push(`RSI em ${rsi.toFixed(1)} indica sobrevenda - possível reversão`);
  }

  // Proximidade com níveis
  if (distToSupport < 3) {
    points.push(`Preço próximo ao suporte (${distToSupport.toFixed(1)}% acima)`);
  }
  if (distToResistance < 3) {
    points.push(`Preço próximo à resistência (${distToResistance.toFixed(1)}% abaixo)`);
  }

  // Cruzamentos de EMA
  if (Math.abs(ema9 - ema21) / ema21 < 0.01) {
    points.push('EMA 9 e 21 próximas - possível cruzamento');
  }
  if (Math.abs(ema50 - ema200) / ema200 < 0.02) {
    points.push('EMA 50 e 200 próximas - atenção ao golden/death cross');
  }

  // Volume
  const volumeRatio = volume / avgVolume;
  if (volumeRatio >= 2) {
    points.push(`Volume ${volumeRatio.toFixed(1)}x acima da média - movimento significativo`);
  } else if (volumeRatio <= 0.3) {
    points.push('Volume muito baixo - falta de participação');
  }

  // Preço vs EMAs longas
  if (price < ema200 && trend === 'baixa') {
    points.push('Preço abaixo da EMA 200 - tendência de baixa de longo prazo');
  } else if (price > ema200 && trend === 'alta') {
    points.push('Preço acima da EMA 200 - tendência de alta de longo prazo');
  }

  return points;
}

/**
 * Gera relatório completo de mercado
 */
export function generateReport(
  ticker: string,
  timeframe: string,
  indicators: IndicatorValues,
  aiAnalysis?: AnalysisResponse
): MarketReport {
  const trendAnalysis = analyzeTrend(indicators);
  const trend = aiAnalysis?.trend ?? trendAnalysis.direction;
  const trendStrength = aiAnalysis?.trendStrength ?? trendAnalysis.strength;
  const classification = aiAnalysis?.classification ?? classifyMarket(indicators, trend, trendStrength);

  const { price, support, resistance, volume, avgVolume, rsi } = indicators;

  const distanceToSupport = ((price - support) / price) * 100;
  const distanceToResistance = ((resistance - price) / price) * 100;

  const attentionPoints = aiAnalysis?.attentionPoints ?? generateAttentionPoints(indicators, trend);

  // Formata texto do relatório
  const formattedText = formatReportText({
    ticker,
    timeframe,
    trend,
    trendStrength,
    classification,
    indicators,
    distanceToSupport,
    distanceToResistance,
    attentionPoints,
  });

  return {
    ticker,
    timeframe,
    generatedAt: new Date(),
    trend,
    trendStrength,
    classification,
    indicators: {
      ema9: {
        value: indicators.ema9,
        position: price > indicators.ema9 ? 'acima' : 'abaixo',
      },
      ema21: {
        value: indicators.ema21,
        position: price > indicators.ema21 ? 'acima' : 'abaixo',
      },
      ema50: {
        value: indicators.ema50,
        position: price > indicators.ema50 ? 'acima' : 'abaixo',
      },
      ema200: {
        value: indicators.ema200,
        position: price > indicators.ema200 ? 'acima' : 'abaixo',
      },
      rsi: {
        value: rsi,
        zone: classifyRSI(rsi),
      },
      volume: {
        current: volume,
        average: avgVolume,
        status: classifyVolume(volume, avgVolume),
      },
    },
    support,
    resistance,
    distanceToSupport,
    distanceToResistance,
    attentionPoints,
    formattedText,
  };
}

interface FormatReportParams {
  ticker: string;
  timeframe: string;
  trend: TrendDirection;
  trendStrength: TrendStrength;
  classification: MarketClassification;
  indicators: IndicatorValues;
  distanceToSupport: number;
  distanceToResistance: number;
  attentionPoints: string[];
}

/**
 * Formata o texto do relatório para exibição
 */
function formatReportText(params: FormatReportParams): string {
  const {
    ticker,
    timeframe,
    trend,
    trendStrength,
    classification,
    indicators,
    distanceToSupport,
    distanceToResistance,
    attentionPoints,
  } = params;

  const lines: string[] = [];

  lines.push(`📊 RELATÓRIO DE MERCADO`);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(``);
  lines.push(`🎯 Ativo: ${ticker}`);
  lines.push(`⏱️ Timeframe: ${timeframe}`);
  lines.push(`💰 Preço atual: R$ ${indicators.price.toFixed(2)}`);
  lines.push(``);
  lines.push(`📈 TENDÊNCIA`);
  lines.push(`   Direção: ${trend.toUpperCase()}`);
  lines.push(`   Força: ${trendStrength}`);
  lines.push(`   Classificação: ${classification.emoji} ${classification.label}`);
  lines.push(``);
  lines.push(`📊 INDICADORES`);
  lines.push(`   EMA 9: ${indicators.ema9.toFixed(2)} (preço ${indicators.price > indicators.ema9 ? 'acima' : 'abaixo'})`);
  lines.push(`   EMA 21: ${indicators.ema21.toFixed(2)} (preço ${indicators.price > indicators.ema21 ? 'acima' : 'abaixo'})`);
  lines.push(`   EMA 50: ${indicators.ema50.toFixed(2)} (preço ${indicators.price > indicators.ema50 ? 'acima' : 'abaixo'})`);
  lines.push(`   EMA 200: ${indicators.ema200.toFixed(2)} (preço ${indicators.price > indicators.ema200 ? 'acima' : 'abaixo'})`);
  lines.push(`   RSI (14): ${indicators.rsi.toFixed(1)} (${classifyRSI(indicators.rsi)})`);
  lines.push(`   Volume: ${formatVolume(indicators.volume)} (${classifyVolume(indicators.volume, indicators.avgVolume)})`);
  lines.push(``);
  lines.push(`🎯 NÍVEIS CHAVE`);
  lines.push(`   Suporte: R$ ${indicators.support.toFixed(2)} (${distanceToSupport.toFixed(1)}% abaixo)`);
  lines.push(`   Resistência: R$ ${indicators.resistance.toFixed(2)} (${distanceToResistance.toFixed(1)}% acima)`);

  if (attentionPoints.length > 0) {
    lines.push(``);
    lines.push(`⚠️ PONTOS DE ATENÇÃO`);
    attentionPoints.forEach((point, i) => {
      lines.push(`   ${i + 1}. ${point}`);
    });
  }

  lines.push(``);
  lines.push(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  lines.push(`Gerado em: ${new Date().toLocaleString('pt-BR')}`);

  return lines.join('\n');
}

/**
 * Formata volume para exibição
 */
function formatVolume(volume: number): string {
  if (volume >= 1_000_000_000) {
    return `${(volume / 1_000_000_000).toFixed(2)}B`;
  } else if (volume >= 1_000_000) {
    return `${(volume / 1_000_000).toFixed(2)}M`;
  } else if (volume >= 1_000) {
    return `${(volume / 1_000).toFixed(2)}K`;
  }
  return volume.toFixed(0);
}

/**
 * Gera resumo curto para o chat
 */
export function generateShortSummary(indicators: IndicatorValues): string {
  const trendAnalysis = analyzeTrend(indicators);
  const classification = classifyMarket(indicators, trendAnalysis.direction, trendAnalysis.strength);
  const rsiZone = classifyRSI(indicators.rsi);

  return `${classification.emoji} Tendência de ${trendAnalysis.direction} (${trendAnalysis.strength}). RSI: ${indicators.rsi.toFixed(1)} (${rsiZone}). Preço: R$ ${indicators.price.toFixed(2)}.`;
}
