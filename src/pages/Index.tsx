import { useState } from 'react';
import { TopMenu } from '@/components/TopMenu';
import { AssetList } from '@/components/AssetList';
import { ChartToolbar } from '@/components/ChartToolbar';
import { TradingChart } from '@/components/TradingChart';
import { usePortfolio } from '@/hooks/usePortfolio';
import { Sheet, SheetContent } from '@/components/ui/sheet';

const Index = () => {
  const { portfolio, addTicker, removeTicker, updateQuantity } = usePortfolio();
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    portfolio.length > 0 ? portfolio[0].ticker : null
  );
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candles');

  const selectedAsset = portfolio.find(a => a.ticker === selectedTicker) || null;

  return (
    <Sheet open={watchlistOpen} onOpenChange={setWatchlistOpen}>
      <div className="h-[100dvh] w-full min-h-0 flex flex-col bg-background overflow-hidden">
        {/* Top Menu */}
        <TopMenu
          timeframe={timeframe}
          chartType={chartType}
          onTimeframeChange={setTimeframe}
          onChartTypeChange={setChartType}
          onOpenWatchlist={() => setWatchlistOpen(true)}
        />

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

          {/* Chart Toolbar (desktop) */}
          <div className="hidden md:flex min-h-0 overflow-hidden">
            <ChartToolbar />
          </div>

          {/* Main Chart Area */}
          <div className="flex-1 min-w-0 min-h-0 flex flex-col p-2 overflow-hidden">
            <TradingChart asset={selectedAsset} />
          </div>
        </div>
      </div>
    </Sheet>
  );
};

export default Index;
