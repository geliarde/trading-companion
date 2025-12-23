import { useMemo } from 'react';
import { Asset } from '@/types/trading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Shield, 
  Zap,
  BarChart3,
  Activity,
  ArrowUpCircle,
  ArrowDownCircle,
  MinusCircle
} from 'lucide-react';
import { getTrendStatus, getActionSuggestion, getSuggestedStopLoss, formatCurrency } from '@/utils/tradingUtils';
import { generateSyntheticOHLC, findSupportResistance, ema, rsi } from '@/utils/indicators';

interface TechnicalAnalysisBotProps {
  asset: Asset | null;
  protectionMode?: boolean;
}

type SignalStrength = 'strong' | 'moderate' | 'weak';
type SignalType = 'bullish' | 'bearish' | 'neutral';

interface AnalysisPoint {
  title: string;
  description: string;
  type: SignalType;
  strength: SignalStrength;
  icon: React.ReactNode;
}

export function TechnicalAnalysisBot({ asset, protectionMode = false }: TechnicalAnalysisBotProps) {
  const analysis = useMemo(() => {
    if (!asset) return null;

    const ohlc = generateSyntheticOHLC(asset.ticker, 260);
    const closes = ohlc.map(c => c.close);
    const { supports, resistances } = findSupportResistance(ohlc);
    
    const ema20Values = ema(closes, 20);
    const ema200Values = ema(closes, 200);
    const rsiValues = rsi(closes, 14);
    
    const currentEMA20 = ema20Values[ema20Values.length - 1];
    const currentEMA200 = ema200Values[ema200Values.length - 1];
    const currentRSI = rsiValues[rsiValues.length - 1];
    const prevRSI = rsiValues[rsiValues.length - 2];
    
    const points: AnalysisPoint[] = [];
    
    // 1. Trend Analysis
    const trend = getTrendStatus(asset);
    if (trend === 'bullish') {
      points.push({
        title: 'Tendência de Alta',
        description: `Preço (${formatCurrency(asset.price)}) acima das EMAs 20 e 200. Estrutura altista confirmada.`,
        type: 'bullish',
        strength: asset.price > currentEMA20 * 1.02 ? 'strong' : 'moderate',
        icon: <TrendingUp className="h-4 w-4" />
      });
    } else if (trend === 'bearish') {
      points.push({
        title: 'Tendência de Baixa',
        description: `Preço (${formatCurrency(asset.price)}) abaixo das EMAs 20 e 200. Estrutura baixista dominante.`,
        type: 'bearish',
        strength: asset.price < currentEMA200 * 0.98 ? 'strong' : 'moderate',
        icon: <TrendingDown className="h-4 w-4" />
      });
    } else {
      points.push({
        title: 'Tendência Lateral',
        description: 'Preço oscilando entre as médias móveis. Aguarde definição de direção.',
        type: 'neutral',
        strength: 'weak',
        icon: <Activity className="h-4 w-4" />
      });
    }

    // 2. EMA Crossover Analysis
    const emaDiff = ((currentEMA20 - currentEMA200) / currentEMA200) * 100;
    if (Math.abs(emaDiff) < 2) {
      points.push({
        title: 'Cruzamento de Médias Iminente',
        description: `EMA20 e EMA200 convergindo (${emaDiff.toFixed(2)}% de distância). Possível reversão.`,
        type: emaDiff > 0 ? 'bullish' : 'bearish',
        strength: 'moderate',
        icon: <Zap className="h-4 w-4" />
      });
    }

    // 3. RSI Analysis
    if (currentRSI > 70) {
      points.push({
        title: 'RSI em Sobrecompra',
        description: `RSI em ${currentRSI.toFixed(1)}. Ativo sobrecomprado, possível correção iminente.`,
        type: 'bearish',
        strength: currentRSI > 80 ? 'strong' : 'moderate',
        icon: <AlertTriangle className="h-4 w-4" />
      });
    } else if (currentRSI < 30) {
      points.push({
        title: 'RSI em Sobrevenda',
        description: `RSI em ${currentRSI.toFixed(1)}. Ativo sobrevendido, oportunidade de compra.`,
        type: 'bullish',
        strength: currentRSI < 20 ? 'strong' : 'moderate',
        icon: <ArrowUpCircle className="h-4 w-4" />
      });
    } else if (currentRSI > 50 && prevRSI < 50) {
      points.push({
        title: 'RSI Cruzou 50 para Cima',
        description: 'Momentum positivo. Força compradora ganhando controle.',
        type: 'bullish',
        strength: 'moderate',
        icon: <TrendingUp className="h-4 w-4" />
      });
    } else if (currentRSI < 50 && prevRSI > 50) {
      points.push({
        title: 'RSI Cruzou 50 para Baixo',
        description: 'Momentum negativo. Força vendedora ganhando controle.',
        type: 'bearish',
        strength: 'moderate',
        icon: <TrendingDown className="h-4 w-4" />
      });
    }

    // 4. Support/Resistance Analysis
    const nearestSupport = supports[0] || asset.price * 0.95;
    const nearestResistance = resistances[0] || asset.price * 1.05;
    const distToSupport = ((asset.price - nearestSupport) / asset.price) * 100;
    const distToResistance = ((nearestResistance - asset.price) / asset.price) * 100;

    if (distToSupport < 2) {
      points.push({
        title: 'Próximo ao Suporte',
        description: `Preço a ${distToSupport.toFixed(1)}% do suporte em ${formatCurrency(nearestSupport)}. Zona de defesa.`,
        type: 'bullish',
        strength: distToSupport < 1 ? 'strong' : 'moderate',
        icon: <Shield className="h-4 w-4" />
      });
    }

    if (distToResistance < 2) {
      points.push({
        title: 'Próximo à Resistência',
        description: `Preço a ${distToResistance.toFixed(1)}% da resistência em ${formatCurrency(nearestResistance)}. Possível rejeição.`,
        type: 'bearish',
        strength: distToResistance < 1 ? 'strong' : 'moderate',
        icon: <Target className="h-4 w-4" />
      });
    }

    // 5. Price Action Patterns
    const recentCandles = ohlc.slice(-5);
    const lastCandle = recentCandles[recentCandles.length - 1];
    const prevCandle = recentCandles[recentCandles.length - 2];
    
    const lastBody = Math.abs(lastCandle.close - lastCandle.open);
    const lastWick = lastCandle.high - lastCandle.low;
    const isDojiLike = lastBody < lastWick * 0.1;
    
    if (isDojiLike) {
      points.push({
        title: 'Padrão Doji Detectado',
        description: 'Indecisão no mercado. Aguarde confirmação do próximo candle.',
        type: 'neutral',
        strength: 'moderate',
        icon: <MinusCircle className="h-4 w-4" />
      });
    }

    // Engulfing pattern
    const prevBody = Math.abs(prevCandle.close - prevCandle.open);
    const isBullishEngulfing = lastCandle.close > lastCandle.open && 
                               prevCandle.close < prevCandle.open &&
                               lastBody > prevBody * 1.5;
    const isBearishEngulfing = lastCandle.close < lastCandle.open && 
                               prevCandle.close > prevCandle.open &&
                               lastBody > prevBody * 1.5;

    if (isBullishEngulfing) {
      points.push({
        title: 'Engolfo de Alta',
        description: 'Padrão de reversão bullish. Compradores absorveram vendedores.',
        type: 'bullish',
        strength: 'strong',
        icon: <ArrowUpCircle className="h-4 w-4" />
      });
    } else if (isBearishEngulfing) {
      points.push({
        title: 'Engolfo de Baixa',
        description: 'Padrão de reversão bearish. Vendedores absorveram compradores.',
        type: 'bearish',
        strength: 'strong',
        icon: <ArrowDownCircle className="h-4 w-4" />
      });
    }

    // 6. Action Suggestion
    const { action, reason } = getActionSuggestion(asset, { protectionMode });
    const stopLoss = getSuggestedStopLoss(asset, { protectionMode });

    return {
      points,
      action,
      reason,
      stopLoss,
      rsi: currentRSI,
      ema20: currentEMA20,
      ema200: currentEMA200,
      support: nearestSupport,
      resistance: nearestResistance,
      riskReward: ((nearestResistance - asset.price) / (asset.price - stopLoss)).toFixed(2)
    };
  }, [asset, protectionMode]);

  if (!asset || !analysis) {
    return (
      <Card className="h-full bg-card/50 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Análise Técnica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Selecione um ativo para análise.</p>
        </CardContent>
      </Card>
    );
  }

  const getTypeColor = (type: SignalType) => {
    switch (type) {
      case 'bullish': return 'text-emerald-500';
      case 'bearish': return 'text-red-500';
      default: return 'text-yellow-500';
    }
  };

  const getStrengthBadge = (strength: SignalStrength, type: SignalType) => {
    const variant = type === 'bullish' ? 'default' : type === 'bearish' ? 'destructive' : 'secondary';
    return (
      <Badge variant={variant} className="text-[10px] px-1.5 py-0">
        {strength === 'strong' ? 'Forte' : strength === 'moderate' ? 'Moderado' : 'Fraco'}
      </Badge>
    );
  };

  const getActionColor = (action: string) => {
    if (action === 'COMPRAR') return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
    if (action === 'ALERTA VENDA') return 'bg-red-500/20 text-red-400 border-red-500/50';
    if (action === 'STOP LOSS') return 'bg-red-600/20 text-red-500 border-red-600/50';
    if (action === 'PROTEGER') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
    return 'bg-muted text-muted-foreground border-border';
  };

  return (
    <Card className="h-full bg-card/50 backdrop-blur border-border/50 flex flex-col">
      <CardHeader className="pb-2 flex-shrink-0">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Análise: {asset.ticker}
          </span>
          <Badge variant="outline" className="text-[10px]">
            Quant Bot
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0">
        <ScrollArea className="h-full px-4 pb-4">
          {/* Action Recommendation */}
          <div className={`rounded-lg border p-3 mb-4 ${getActionColor(analysis.action)}`}>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4" />
              <span className="font-bold text-sm">{analysis.action}</span>
            </div>
            <p className="text-xs opacity-90">{analysis.reason}</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="bg-muted/30 rounded p-2">
              <p className="text-[10px] text-muted-foreground">RSI (14)</p>
              <p className={`text-sm font-mono font-bold ${
                analysis.rsi > 70 ? 'text-red-500' : 
                analysis.rsi < 30 ? 'text-emerald-500' : 'text-foreground'
              }`}>
                {analysis.rsi.toFixed(1)}
              </p>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <p className="text-[10px] text-muted-foreground">Risco/Retorno</p>
              <p className={`text-sm font-mono font-bold ${
                parseFloat(analysis.riskReward) >= 2 ? 'text-emerald-500' : 
                parseFloat(analysis.riskReward) >= 1 ? 'text-yellow-500' : 'text-red-500'
              }`}>
                1:{analysis.riskReward}
              </p>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <p className="text-[10px] text-muted-foreground">Suporte</p>
              <p className="text-sm font-mono text-emerald-500">{formatCurrency(analysis.support)}</p>
            </div>
            <div className="bg-muted/30 rounded p-2">
              <p className="text-[10px] text-muted-foreground">Resistência</p>
              <p className="text-sm font-mono text-red-500">{formatCurrency(analysis.resistance)}</p>
            </div>
          </div>

          <Separator className="my-3" />

          {/* Analysis Points */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Pontos de Análise
            </p>
            {analysis.points.map((point, idx) => (
              <div 
                key={idx} 
                className="bg-muted/20 rounded-lg p-3 border border-border/30"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`flex items-center gap-2 ${getTypeColor(point.type)}`}>
                    {point.icon}
                    <span className="text-xs font-semibold">{point.title}</span>
                  </div>
                  {getStrengthBadge(point.strength, point.type)}
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  {point.description}
                </p>
              </div>
            ))}
          </div>

          <Separator className="my-3" />

          {/* Stop Loss Suggestion */}
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <Shield className="h-4 w-4" />
              <span className="text-xs font-semibold">Stop Loss Sugerido</span>
            </div>
            <p className="text-lg font-mono font-bold text-red-400">
              {formatCurrency(analysis.stopLoss)}
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Baseado no suporte primário com margem de segurança
            </p>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
