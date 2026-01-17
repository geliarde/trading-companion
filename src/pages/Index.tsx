import { useEffect, useMemo, useRef, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { ChartControls } from '@/components/ChartControls';
import { InstitutionalIndicator } from '@/components/InstitutionalIndicator';
import { TradingChart } from '@/components/TradingChart';
import { ChatAssistant } from '@/components/ChatAssistant';
import { AssetList } from '@/components/AssetList';
import { RiskBanner } from '@/components/RiskBanner';
import { DataStatusBanner } from '@/components/DataStatusBanner';
import { SummaryTable } from '@/components/SummaryTable';
import { NewsAlerts } from '@/components/NewsAlerts';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useMarketData } from '@/hooks/useMarketData';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppView, ChartConfig } from '@/types/trading';

const Index = () => {
  const { portfolio, news, addTicker, removeTicker, updateQuantity } = usePortfolio();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    portfolio.length > 0 ? portfolio[0].ticker : null
  );
  
  const [chartConfig, setChartConfig] = useState<ChartConfig>({
    chartType: 'candle',
    showSMA: false,
    showEMA: true,
    showBollinger: true,
    showVolume: true,
    showGrid: true,
    showAxes: true,
    highLowMarkers: true,
    showImbalances: true,
  });

  const { liveByTicker, macro, protectionMode, health } = useMarketData(portfolio, selectedTicker);

  const portfolioLive = useMemo(
    () => portfolio.map((a) => ({ 
      ...a, 
      ...(liveByTicker[a.ticker] ?? {}),
      buyPressure: Math.floor(Math.random() * 40) + 30 + (a.changePercent > 0 ? 20 : 0),
      institutionalFlow: (a.changePercent > 1 ? 'net_long' : a.changePercent < -1 ? 'net_short' : 'neutral') as 'net_long' | 'net_short' | 'neutral',
    })),
    [liveByTicker, portfolio],
  );

  const selectedAsset = portfolioLive.find(a => a.ticker === selectedTicker) || null;

  useEffect(() => {
    if (!selectedTicker && portfolio.length > 0) {
      setSelectedTicker(portfolio[0].ticker);
    }
  }, [portfolio, selectedTicker]);

  const renderMainContent = () => {
    switch (currentView) {
      case 'news':
        return (
          <ScrollArea className="h-full p-4">
            <NewsAlerts news={news} />
          </ScrollArea>
        );
      case 'chat':
        return (
          <div className="h-full p-4">
            <ChatAssistant 
              ticker={selectedTicker} 
              indicators={selectedAsset ? {
                ema9: selectedAsset.ema20 * 0.98,
                ema21: selectedAsset.ema20,
                ema50: (selectedAsset.ema20 + selectedAsset.ema200) / 2,
                ema200: selectedAsset.ema200,
                rsi: selectedAsset.rsi,
                volume: selectedAsset.volume,
                avgVolume: selectedAsset.avgVolume,
                support: selectedAsset.support,
                resistance: selectedAsset.resistance,
                price: selectedAsset.price,
              } : null}
              timeframe="1D"
            />
          </div>
        );
      case 'analysis':
      case 'dashboard':
      default:
        return (
          <div className="flex-1 min-h-0 min-w-0 flex flex-col p-3 gap-3">
            {/* Status Banners */}
            <div className="flex flex-wrap gap-2">
              <DataStatusBanner health={health} />
              <RiskBanner macro={macro} protectionMode={protectionMode} />
            </div>

            {/* Chart Controls Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <ChartControls config={chartConfig} onConfigChange={setChartConfig} />
              {selectedAsset && (
                <InstitutionalIndicator
                  buyPressure={selectedAsset.buyPressure}
                  institutionalFlow={selectedAsset.institutionalFlow}
                />
              )}
            </div>

            {/* Chart */}
            <div className="flex-1 min-h-0">
              <TradingChart
                asset={selectedAsset}
                chartType={chartConfig.chartType === 'candle' ? 'candles' : chartConfig.chartType === 'bar' ? 'bars' : chartConfig.chartType}
                showSupport={true}
                showResistance={true}
                showEma20={chartConfig.showEMA}
                showEma200={chartConfig.showEMA}
                showRsi={true}
                showSmartAnalysis={false}
              />
            </div>
          </div>
        );
    }
  };

  return (
    <Sheet open={watchlistOpen} onOpenChange={setWatchlistOpen}>
      <div className="h-[100dvh] w-full min-h-0 flex bg-background overflow-hidden">
        {/* Left Sidebar - Navigation */}
        <AppSidebar currentView={currentView} onViewChange={setCurrentView} />

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
          {/* Header */}
          <AppHeader
            portfolio={portfolioLive}
            selectedAsset={selectedAsset}
            onSelectAsset={setSelectedTicker}
            privacyMode={privacyMode}
            onTogglePrivacy={() => setPrivacyMode(!privacyMode)}
          />

          {/* Content */}
          <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
            {/* Main View */}
            <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
              {renderMainContent()}
            </div>

            {/* Right Sidebar - Chat (visible on dashboard/analysis) */}
            {(currentView === 'dashboard' || currentView === 'analysis') && (
              <div className="hidden lg:block w-80 flex-shrink-0 min-h-0 p-2 border-l border-border">
                <ChatAssistant 
                  ticker={selectedTicker} 
                  indicators={selectedAsset ? {
                    ema9: selectedAsset.ema20 * 0.98,
                    ema21: selectedAsset.ema20,
                    ema50: (selectedAsset.ema20 + selectedAsset.ema200) / 2,
                    ema200: selectedAsset.ema200,
                    rsi: selectedAsset.rsi,
                    volume: selectedAsset.volume,
                    avgVolume: selectedAsset.avgVolume,
                    support: selectedAsset.support,
                    resistance: selectedAsset.resistance,
                    price: selectedAsset.price,
                  } : null}
                  timeframe="1D"
                />
              </div>
            )}
          </div>
        </div>

        {/* Mobile Watchlist Drawer */}
        <SheetContent side="left" className="w-[min(22rem,100vw)] p-0">
          <AssetList
            portfolio={portfolioLive}
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
      </div>
    </Sheet>
  );
};

export default Index;
