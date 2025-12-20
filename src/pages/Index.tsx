import { useEffect, useRef, useState } from 'react';
import { TopMenu } from '@/components/TopMenu';
import { AssetList } from '@/components/AssetList';
import { ChartToolbar } from '@/components/ChartToolbar';
import { TradingChart } from '@/components/TradingChart';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import type { Tool } from '@/components/ChartToolbar';
import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { MobileChartDock, type ChartIndicators } from '@/components/MobileChartDock';

const Index = () => {
  const { portfolio, addTicker, removeTicker, updateQuantity } = usePortfolio();
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<Tool>('cursor');
  const [indicators, setIndicators] = useState<ChartIndicators>({
    support: true,
    resistance: true,
    ema20: true,
    ema200: true,
    rsi: true,
  });
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    portfolio.length > 0 ? portfolio[0].ticker : null
  );
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candles');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const chartAreaRef = useRef<HTMLDivElement | null>(null);

  const selectedAsset = portfolio.find(a => a.ticker === selectedTicker) || null;

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await chartAreaRef.current?.requestFullscreen?.();
      }
    } catch {
      // Ignore (fullscreen may be blocked by browser / device policy)
    }
  };

  return (
    <Sheet open={watchlistOpen} onOpenChange={setWatchlistOpen}>
      <div className="h-[100dvh] w-full min-h-0 flex flex-col bg-background overflow-hidden">
        {/* Top Menu */}
        {!isFullscreen && (
          <TopMenu
            timeframe={timeframe}
            chartType={chartType}
            onTimeframeChange={setTimeframe}
            onChartTypeChange={setChartType}
            onOpenWatchlist={() => setWatchlistOpen(true)}
          />
        )}

        {/* Mobile Watchlist Drawer */}
        <SheetContent side="left" className="w-[min(22rem,100vw)] p-0">
          <AssetList
            portfolio={portfolio}
            selectedTicker={selectedTicker}
            onSelect={(ticker) => {
              setSelectedTicker(ticker);
              setWatchlistOpen(false);
            }}
            onAdd={addTicker}
            onRemove={removeTicker}
            onUpdateQuantity={updateQuantity}
          />
        </SheetContent>

        {/* Main Content */}
        <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
          {/* Left Sidebar - Asset List (desktop) */}
          {!isFullscreen && (
            <div className="hidden md:block w-56 flex-shrink-0 min-h-0">
              <AssetList
                portfolio={portfolio}
                selectedTicker={selectedTicker}
                onSelect={setSelectedTicker}
                onAdd={addTicker}
                onRemove={removeTicker}
                onUpdateQuantity={updateQuantity}
              />
            </div>
          )}

          {/* Chart Toolbar (desktop) */}
          {!isFullscreen && (
            <div className="hidden md:flex min-h-0 overflow-hidden">
              <ChartToolbar
                activeTool={activeTool}
                onActiveToolChange={setActiveTool}
                onFullscreen={handleToggleFullscreen}
              />
            </div>
          )}

          {/* Main Chart Area */}
          <div ref={chartAreaRef} className="relative flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
            {isFullscreen && (
              <div className="absolute right-2 top-2 z-50">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="h-9 w-9 bg-card/80 backdrop-blur border border-border"
                  onClick={handleToggleFullscreen}
                  aria-label="Sair da tela cheia"
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex-1 min-h-0 min-w-0 flex flex-col p-2 overflow-hidden">
              <TradingChart
                asset={selectedAsset}
                showSupport={indicators.support}
                showResistance={indicators.resistance}
                showEma20={indicators.ema20}
                showEma200={indicators.ema200}
                showRsi={indicators.rsi}
              />
            </div>
          </div>
        </div>

        {/* Mobile chart dock (tabs + panel) */}
        <MobileChartDock
          activeTool={activeTool}
          onActiveToolChange={setActiveTool}
          indicators={indicators}
          onIndicatorsChange={setIndicators}
          onFullscreen={handleToggleFullscreen}
          isFullscreen={isFullscreen}
        />

        {/* Desktop fullscreen quick actions */}
        {isFullscreen && (
          <div className="hidden md:block h-12 shrink-0">
            <ChartToolbar orientation="horizontal" sections={['actions']} onFullscreen={handleToggleFullscreen} />
          </div>
        )}
      </div>
    </Sheet>
  );
};

export default Index;
