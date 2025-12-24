import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  Scatter,
  LabelList,
} from 'recharts';
import { Asset } from '@/types/trading';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface TradingChartProps {
  asset: Asset | null;
  chartType?: 'candles' | 'line' | 'area' | 'bars';
  showSupport?: boolean;
  showResistance?: boolean;
  showEma20?: boolean;
  showEma200?: boolean;
  showRsi?: boolean;
  showSmartAnalysis?: boolean;
}

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  entrySignal?: number;
  takeProfitSignal?: number;
  stopLossSignal?: number;
  signalLabel?: string;
}

function generateCandleData(asset: Asset): CandleData[] {
  const data: CandleData[] = [];
  let currentPrice = asset.price * (0.85 + Math.random() * 0.1);
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const volatility = 0.03;
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    const open = currentPrice;
    const close = currentPrice + change;
    const high = Math.max(open, close) + Math.random() * volatility * currentPrice * 0.5;
    const low = Math.min(open, close) - Math.random() * volatility * currentPrice * 0.5;
    
    data.push({
      date: date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Math.floor(asset.avgVolume * (0.5 + Math.random())),
    });
    
    currentPrice = close;
  }
  
  return data;
}

type CandlestickShapeProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  payload?: CandleData;
};

const CustomCandlestick = ({ x, y, width, height, payload }: CandlestickShapeProps) => {
  if (x == null || y == null || width == null || height == null || !payload) return null;
  
  const { open, close, high, low } = payload;
  const isGreen = close >= open;
  const color = isGreen ? 'hsl(142, 76%, 45%)' : 'hsl(0, 72%, 51%)';
  
  const bodyBottom = Math.max(open, close);
  const priceRange = high - low;
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.1}
        y={y + (high - bodyBottom) / priceRange * height}
        width={width * 0.8}
        height={Math.max(2, Math.abs(close - open) / priceRange * height)}
        fill={color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

// Custom shape for entry signals (green circle)
const EntrySignalShape = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.entrySignal) return null;
  
  return (
    <g>
      <circle cx={cx} cy={cy} r={8} fill="hsl(142, 76%, 45%)" stroke="white" strokeWidth={2} />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(142, 76%, 45%)" fontSize={10} fontWeight="bold">
        ENTRY
      </text>
    </g>
  );
};

// Custom shape for take profit signals (blue diamond)
const TakeProfitShape = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.takeProfitSignal) return null;
  
  return (
    <g>
      <polygon 
        points={`${cx},${cy-8} ${cx+8},${cy} ${cx},${cy+8} ${cx-8},${cy}`} 
        fill="hsl(199, 89%, 48%)" 
        stroke="white" 
        strokeWidth={2} 
      />
      <text x={cx} y={cy - 14} textAnchor="middle" fill="hsl(199, 89%, 48%)" fontSize={10} fontWeight="bold">
        TP
      </text>
    </g>
  );
};

// Custom shape for stop loss signals (red X)
const StopLossShape = (props: any) => {
  const { cx, cy, payload } = props;
  if (!payload?.stopLossSignal) return null;
  
  return (
    <g>
      <line x1={cx-6} y1={cy-6} x2={cx+6} y2={cy+6} stroke="hsl(0, 72%, 51%)" strokeWidth={3} />
      <line x1={cx+6} y1={cy-6} x2={cx-6} y2={cy+6} stroke="hsl(0, 72%, 51%)" strokeWidth={3} />
      <text x={cx} y={cy - 12} textAnchor="middle" fill="hsl(0, 72%, 51%)" fontSize={10} fontWeight="bold">
        SL
      </text>
    </g>
  );
};

export function TradingChart({
  asset,
  chartType = 'candles',
  showSupport = true,
  showResistance = true,
  showEma20 = true,
  showEma200 = true,
  showRsi = true,
  showSmartAnalysis = false,
}: TradingChartProps) {
  
  // Generate candle data with smart analysis signals
  const candleData = useMemo(() => {
    if (!asset) return [];
    const data = generateCandleData(asset);
    
    if (!showSmartAnalysis) return data;
    
    // Calculate smart analysis signals
    const ema20 = asset.ema20;
    const support = asset.support;
    const resistance = asset.resistance;
    
    let hasEntrySignal = false;
    
    for (let i = 2; i < data.length; i++) {
      const curr = data[i];
      const prev = data[i - 1];
      const prev2 = data[i - 2];
      
      // Entry Signal: Price bounces off support or crosses above EMA20
      const nearSupport = Math.abs(curr.low - support) / support < 0.02;
      const bullishReversal = prev2.close < prev.close && prev.close < curr.close;
      const crossAboveEma = prev.close < ema20 && curr.close > ema20;
      
      if (!hasEntrySignal && ((nearSupport && bullishReversal) || crossAboveEma)) {
        data[i].entrySignal = curr.close;
        
        // Calculate Take Profit (next resistance or +5%)
        const takeProfit = Math.min(resistance, curr.close * 1.05);
        // Find a candle near the take profit to mark
        for (let j = i + 1; j < data.length; j++) {
          if (data[j].high >= takeProfit * 0.99) {
            data[j].takeProfitSignal = takeProfit;
            break;
          }
        }
        
        // Calculate Stop Loss (below support or -3%)
        const stopLoss = Math.max(support * 0.98, curr.close * 0.97);
        data[i].stopLossSignal = stopLoss;
        
        hasEntrySignal = true;
      }
      
      // Exit Signal: Price hits resistance or crosses below EMA20
      if (hasEntrySignal && i > data.length - 8) {
        const nearResistance = Math.abs(curr.high - resistance) / resistance < 0.015;
        const crossBelowEma = prev.close > ema20 && curr.close < ema20;
        
        if (nearResistance || crossBelowEma) {
          data[i].takeProfitSignal = curr.close;
          break;
        }
      }
    }
    
    return data;
  }, [asset, showSmartAnalysis]);

  if (!asset) {
    return (
      <div className="flex-1 flex items-center justify-center bg-card border border-border rounded-lg">
        <div className="text-center text-muted-foreground">
          <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-20" />
          <p className="font-mono text-sm">Selecione um ativo para ver o gráfico</p>
        </div>
      </div>
    );
  }

  const lastCandle = candleData[candleData.length - 1];
  const prevCandle = candleData[candleData.length - 2];
  const priceChange = lastCandle.close - prevCandle.close;
  const priceChangePercent = (priceChange / prevCandle.close) * 100;
  const isPositive = priceChange >= 0;

  const allPrices = candleData.flatMap(d => [d.low, d.high, d.stopLossSignal, d.takeProfitSignal].filter(Boolean) as number[]);
  const minPrice = Math.min(...allPrices) * 0.995;
  const maxPrice = Math.max(...allPrices) * 1.005;

  // Get signals for horizontal lines
  const entrySignal = candleData.find(d => d.entrySignal);
  const stopLossSignal = candleData.find(d => d.stopLossSignal);
  const takeProfitSignal = candleData.find(d => d.takeProfitSignal);

  return (
    <div className="flex-1 flex flex-col bg-card border border-border rounded-lg overflow-hidden">
      {/* Chart Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="font-mono font-bold text-lg">{asset.ticker}</h2>
            <p className="text-xs text-muted-foreground">{asset.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-2xl font-bold">
              R$ {lastCandle.close.toFixed(2)}
            </span>
            <div className={`flex items-center gap-1 px-2 py-1 rounded ${isPositive ? 'bg-bull/10 text-bull' : 'bg-bear/10 text-bear'}`}>
              {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
              <span className="font-mono text-sm font-semibold">
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
          {showSmartAnalysis && (
            <div className="flex items-center gap-1 px-2 py-1 rounded bg-primary/10 text-primary border border-primary/30">
              <span className="font-mono text-xs font-semibold animate-pulse">● ANÁLISE ATIVA</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-muted-foreground">
            <span className="opacity-60">O:</span> {lastCandle.open.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            <span className="opacity-60">H:</span> {lastCandle.high.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            <span className="opacity-60">L:</span> {lastCandle.low.toFixed(2)}
          </div>
          <div className="text-muted-foreground">
            <span className="opacity-60">C:</span> {lastCandle.close.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0 p-4">
        <ResponsiveContainer width="100%" height="100%" debounce={120}>
          <ComposedChart data={candleData} margin={{ top: 20, right: 60, left: 0, bottom: 0 }}>
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 55%)', fontSize: 10 }}
            />
            <YAxis 
              domain={[minPrice, maxPrice]}
              orientation="right"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(215, 16%, 55%)', fontSize: 10 }}
              tickFormatter={(value) => value.toFixed(2)}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 18%, 10%)',
                border: '1px solid hsl(220, 16%, 18%)',
                borderRadius: '8px',
                fontSize: '12px',
              }}
              labelStyle={{ color: 'hsl(210, 20%, 92%)', fontFamily: 'JetBrains Mono' }}
              formatter={(value: number, name: string) => [
                `R$ ${value.toFixed(2)}`,
                name.charAt(0).toUpperCase() + name.slice(1)
              ]}
            />
            
            {/* Support/Resistance lines */}
            {showSupport &&
              (asset.supportLevels?.length
                ? asset.supportLevels.slice(0, 2).map((lvl, idx) => (
                    <ReferenceLine
                      key={`support-${idx}`}
                      y={lvl}
                      stroke="hsl(0, 72%, 51%)"
                      strokeDasharray={idx === 0 ? '3 3' : '2 6'}
                    />
                  ))
                : (
                    <ReferenceLine y={asset.support} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" />
                  ))}

            {showResistance &&
              (asset.resistanceLevels?.length
                ? asset.resistanceLevels.slice(0, 2).map((lvl, idx) => (
                    <ReferenceLine
                      key={`resistance-${idx}`}
                      y={lvl}
                      stroke="hsl(142, 76%, 45%)"
                      strokeDasharray={idx === 0 ? '3 3' : '2 6'}
                    />
                  ))
                : (
                    <ReferenceLine y={asset.resistance} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" />
                  ))}
            
            {showEma20 && (
              <ReferenceLine y={asset.ema20} stroke="hsl(199, 89%, 48%)" strokeDasharray="5 5" />
            )}
            {showEma200 && (
              <ReferenceLine y={asset.ema200} stroke="hsl(215, 16%, 55%)" strokeDasharray="6 6" />
            )}
            
            {/* Smart Analysis Lines */}
            {showSmartAnalysis && entrySignal?.entrySignal && (
              <ReferenceLine 
                y={entrySignal.entrySignal} 
                stroke="hsl(142, 76%, 45%)" 
                strokeWidth={2}
                label={{ value: `ENTRY R$${entrySignal.entrySignal.toFixed(2)}`, position: 'left', fill: 'hsl(142, 76%, 45%)', fontSize: 10 }}
              />
            )}
            {showSmartAnalysis && stopLossSignal?.stopLossSignal && (
              <ReferenceLine 
                y={stopLossSignal.stopLossSignal} 
                stroke="hsl(0, 72%, 51%)" 
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{ value: `STOP R$${stopLossSignal.stopLossSignal.toFixed(2)}`, position: 'left', fill: 'hsl(0, 72%, 51%)', fontSize: 10 }}
              />
            )}
            {showSmartAnalysis && takeProfitSignal?.takeProfitSignal && (
              <ReferenceLine 
                y={takeProfitSignal.takeProfitSignal} 
                stroke="hsl(199, 89%, 48%)" 
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{ value: `TP R$${takeProfitSignal.takeProfitSignal.toFixed(2)}`, position: 'left', fill: 'hsl(199, 89%, 48%)', fontSize: 10 }}
              />
            )}
            
            {/* Chart types */}
            {chartType === 'candles' && (
              <Bar dataKey="high" shape={<CustomCandlestick />}>
                {candleData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.close >= entry.open ? 'hsl(142, 76%, 45%)' : 'hsl(0, 72%, 51%)'}
                  />
                ))}
              </Bar>
            )}
            {chartType === 'line' && (
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={false}
              />
            )}
            {chartType === 'area' && (
              <Area 
                type="monotone" 
                dataKey="close" 
                stroke="hsl(var(--primary))" 
                fill="hsl(var(--primary) / 0.2)"
                strokeWidth={2}
              />
            )}
            {chartType === 'bars' && (
              <Bar dataKey="close" fill="hsl(var(--primary))">
                {candleData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`}
                    fill={entry.close >= entry.open ? 'hsl(142, 76%, 45%)' : 'hsl(0, 72%, 51%)'}
                  />
                ))}
              </Bar>
            )}
            
            {/* Smart Analysis Signal Markers */}
            {showSmartAnalysis && (
              <>
                <Scatter dataKey="entrySignal" shape={<EntrySignalShape />} />
                <Scatter dataKey="takeProfitSignal" shape={<TakeProfitShape />} />
                <Scatter dataKey="stopLossSignal" shape={<StopLossShape />} />
              </>
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Chart Footer with indicators */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-secondary/30 text-xs font-mono">
        <div className="flex items-center gap-4">
          {showEma20 && (
            <span className="text-muted-foreground">
              <span className="text-accent">EMA20:</span> {asset.ema20.toFixed(2)}
            </span>
          )}
          {showEma200 && (
            <span className="text-muted-foreground">
              <span className="text-primary">EMA200:</span> {asset.ema200.toFixed(2)}
            </span>
          )}
          {showRsi && (
            <span className={`${asset.rsi > 70 ? 'text-bear' : asset.rsi < 30 ? 'text-bull' : 'text-muted-foreground'}`}>
              <span className="opacity-60">RSI:</span> {asset.rsi.toFixed(1)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {showSupport && (
            <span className="text-bear">
              <span className="opacity-60">Suporte:</span> {asset.support.toFixed(2)}
            </span>
          )}
          {showResistance && (
            <span className="text-bull">
              <span className="opacity-60">Resistência:</span> {asset.resistance.toFixed(2)}
            </span>
          )}
          {showSmartAnalysis && entrySignal?.entrySignal && (
            <span className="text-primary">
              <span className="opacity-60">Entry:</span> {entrySignal.entrySignal.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}