import { useEffect, useMemo, useState } from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { AppHeader } from '@/components/AppHeader';
import { ChartControls } from '@/components/ChartControls';
import { InstitutionalIndicator } from '@/components/InstitutionalIndicator';
import { TradingChart } from '@/components/TradingChart';
import { ChatAssistant } from '@/components/ChatAssistant';
import { AssetList } from '@/components/AssetList';
import { RiskBanner } from '@/components/RiskBanner';
import { DataStatusBanner } from '@/components/DataStatusBanner';
import { NewsAlerts } from '@/components/NewsAlerts';
import { usePortfolio } from '@/hooks/usePortfolio';
import { useMarketData } from '@/hooks/useMarketData';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { AppView, ChartConfig, Asset } from '@/types/trading';

const Index = () => {
  const { portfolio, news, addTicker, removeTicker, updateQuantity } = usePortfolio();
  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [privacyMode, setPrivacyMode] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  
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

  const portfolioLive = useMemo<Asset[]>(
    () => portfolio.map((a) => ({ 
      ...a, 
      ...(liveByTicker[a.ticker] ?? {}),
      buyPressure: Math.floor(Math.random() * 40) + 30 + (a.changePercent > 0 ? 20 : 0),
      institutionalFlow: (a.changePercent > 1 ? 'net_long' : a.changePercent < -1 ? 'net_short' : 'neutral') as 'net_long' | 'net_short' | 'neutral',
    })),
    [liveByTicker, portfolio],
  );

  const selectedAsset = portfolioLive.find(a => a.ticker === selectedTicker) || null;

  // Set initial selected ticker when portfolio loads
  useEffect(() => {
    if (!selectedTicker && portfolioLive.length > 0) {
      setSelectedTicker(portfolioLive[0].ticker);
    }
  }, [portfolioLive, selectedTicker]);

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
          <div className="flex-1 min-h-0 min-w-0 flex flex-col p-3 gap-3 overflow-hidden">
            {/* Status Banners */}
            <div className="flex flex-wrap gap-2 shrink-0">
              <DataStatusBanner health={health} />
              <RiskBanner macro={macro} protectionMode={protectionMode} />
            </div>

            {/* Chart Controls Row */}
            <div className="flex items-center justify-between gap-4 flex-wrap shrink-0">
              <ChartControls config={chartConfig} onConfigChange={setChartConfig} />
              {selectedAsset && (
                <InstitutionalIndicator
                  buyPressure={selectedAsset.buyPressure}
                  institutionalFlow={selectedAsset.institutionalFlow}
                />
              )}
            </div>

            {/* Chart - with explicit height to ensure it renders */}
            <div className="flex-1 min-h-[300px] overflow-hidden">
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
    <div className="h-[100dvh] w-full min-h-0 flex bg-background overflow-hidden">
      {/* Left Sidebar - Navigation */}
      <AppSidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Left Panel - Asset List */}
      <div className="hidden md:block w-56 flex-shrink-0 min-h-0 border-r border-border">
        <AssetList
          portfolio={portfolioLive}
          selectedTicker={selectedTicker}
          onSelect={setSelectedTicker}
          onAdd={addTicker}
          onRemove={removeTicker}
          onUpdateQuantity={updateQuantity}
        />
      </div>

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
    </div>
  );
};

export default Index;
