import { useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts';
import { Asset } from '@/types/trading';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface TradingChartProps {
  asset: Asset | null;
  showSupport?: boolean;
  showResistance?: boolean;
  showEma20?: boolean;
  showEma200?: boolean;
  showRsi?: boolean;
}

interface CandleData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
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
  
  const bodyTop = Math.min(open, close);
  const bodyBottom = Math.max(open, close);
  const priceRange = high - low;
  const chartHeight = 300;
  
  const scale = chartHeight / priceRange;
  const wickX = x + width / 2;
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={wickX}
        y1={y}
        x2={wickX}
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

export function TradingChart({
  asset,
  showSupport = true,
  showResistance = true,
  showEma20 = true,
  showEma200 = true,
  showRsi = true,
}: TradingChartProps) {
  const candleData = useMemo(() => {
    if (!asset) return [];
    return generateCandleData(asset);
  }, [asset]);

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

  const minPrice = Math.min(...candleData.map(d => d.low)) * 0.995;
  const maxPrice = Math.max(...candleData.map(d => d.high)) * 1.005;

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
      <div className="flex-1 p-4">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={candleData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            {showSupport && (
              <ReferenceLine y={asset.support} stroke="hsl(0, 72%, 51%)" strokeDasharray="3 3" />
            )}
            {showResistance && (
              <ReferenceLine y={asset.resistance} stroke="hsl(142, 76%, 45%)" strokeDasharray="3 3" />
            )}
            {showEma20 && (
              <ReferenceLine y={asset.ema20} stroke="hsl(199, 89%, 48%)" strokeDasharray="5 5" />
            )}
            {showEma200 && (
              <ReferenceLine y={asset.ema200} stroke="hsl(215, 16%, 55%)" strokeDasharray="6 6" />
            )}
            <Bar dataKey="high" shape={<CustomCandlestick />}>
              {candleData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`}
                  fill={entry.close >= entry.open ? 'hsl(142, 76%, 45%)' : 'hsl(0, 72%, 51%)'}
                />
              ))}
            </Bar>
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
        </div>
      </div>
    </div>
  );
}
