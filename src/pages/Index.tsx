import { useEffect, useMemo, useRef, useState } from 'react';
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
import { RiskBanner } from '@/components/RiskBanner';
import { SummaryTable } from '@/components/SummaryTable';
import { NewsAlerts } from '@/components/NewsAlerts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

const Index = () => {
  const { portfolio, news, addTicker, removeTicker, updateQuantity, risk } = usePortfolio();
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
  const [insightsOpen, setInsightsOpen] = useState(false);
  const [insightsTab, setInsightsTab] = useState<'summary' | 'news' | 'risk'>('summary');

  const openSummary = () => {
    setInsightsTab('summary');
    setInsightsOpen(true);
  };

  const openNews = () => {
    setInsightsTab('news');
    setInsightsOpen(true);
  };

  const riskTabContent = useMemo(() => {
    const usd = risk.macro['USDT/BRL'];
    const btc = risk.macro.BTC;
    return (
      <div className="grid gap-3 text-sm">
        <div className="bg-secondary/40 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono">USDT/BRL</span>
            <span className="font-mono">
              {usd.price.toFixed(3)} ({usd.changePercent >= 0 ? '+' : ''}{usd.changePercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Se subir &gt; 1%: risco de saída de capital estrangeiro (B3).
          </p>
        </div>
        <div className="bg-secondary/40 border border-border rounded-lg p-3">
          <div className="flex items-center justify-between">
            <span className="font-mono">BTC</span>
            <span className="font-mono">
              {btc.price.toFixed(0)} ({btc.changePercent >= 0 ? '+' : ''}{btc.changePercent.toFixed(2)}%)
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Se cair &lt; -5%: ativa Modo de Proteção e sugere apertar stops.
          </p>
        </div>
        <div className="bg-card border border-border rounded-lg p-3">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-2">Status</p>
          <p className="text-sm">
            {risk.protectionMode ? (
              <span className="text-alert font-mono font-semibold">MODO DE PROTEÇÃO ATIVO</span>
            ) : (
              <span className="text-muted-foreground font-mono">Normal</span>
            )}
          </p>
        </div>
      </div>
    );
  }, [risk.macro, risk.protectionMode]);

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
            onOpenSummary={openSummary}
            onOpenNews={openNews}
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
              {!isFullscreen && (
                <div className="mb-2">
                  <RiskBanner macro={risk.macro} protectionMode={risk.protectionMode} />
                </div>
              )}
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
          onOpenSummary={openSummary}
          onOpenNews={openNews}
        />

        {/* Desktop fullscreen quick actions */}
        {isFullscreen && (
          <div className="hidden md:block h-12 shrink-0">
            <ChartToolbar orientation="horizontal" sections={['actions']} onFullscreen={handleToggleFullscreen} />
          </div>
        )}

        <Dialog open={insightsOpen} onOpenChange={setInsightsOpen}>
          <DialogContent className="w-[min(1100px,96vw)] max-h-[90dvh] p-0 overflow-hidden bg-card border-border">
            <DialogHeader className="p-4 border-b border-border">
              <DialogTitle className="font-mono text-sm uppercase tracking-wider">Painel</DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-3 h-[calc(90dvh-56px)] min-h-0 overflow-hidden">
              <Tabs value={insightsTab} onValueChange={(v) => setInsightsTab(v as typeof insightsTab)} className="h-full flex flex-col">
                <TabsList className="w-full justify-start">
                  <TabsTrigger value="summary" className="font-mono text-xs">Resumo</TabsTrigger>
                  <TabsTrigger value="news" className="font-mono text-xs">Notícias</TabsTrigger>
                  <TabsTrigger value="risk" className="font-mono text-xs">Risco</TabsTrigger>
                </TabsList>
                <div className="flex-1 min-h-0 overflow-hidden mt-3">
                  <TabsContent value="summary" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <SummaryTable portfolio={portfolio} news={news} protectionMode={risk.protectionMode} />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="news" className="h-full m-0">
                    <ScrollArea className="h-full">
                      <NewsAlerts news={news} />
                    </ScrollArea>
                  </TabsContent>
                  <TabsContent value="risk" className="h-full m-0">
                    <ScrollArea className="h-full">
                      {riskTabContent}
                    </ScrollArea>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Sheet>
  );
};

export default Index;
