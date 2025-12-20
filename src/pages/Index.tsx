import { useState } from 'react';
import { TopMenu } from '@/components/TopMenu';
import { AssetList } from '@/components/AssetList';
import { ChartToolbar } from '@/components/ChartToolbar';
import { TradingChart } from '@/components/TradingChart';
import { usePortfolio } from '@/hooks/usePortfolio';

const Index = () => {
  const { portfolio, addTicker, removeTicker, updateQuantity } = usePortfolio();
  const [selectedTicker, setSelectedTicker] = useState<string | null>(
    portfolio.length > 0 ? portfolio[0].ticker : null
  );
  const [timeframe, setTimeframe] = useState('1D');
  const [chartType, setChartType] = useState('candles');

  const selectedAsset = portfolio.find(a => a.ticker === selectedTicker) || null;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Top Menu */}
      <TopMenu
        timeframe={timeframe}
        chartType={chartType}
        onTimeframeChange={setTimeframe}
        onChartTypeChange={setChartType}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Asset List */}
        <div className="w-56 flex-shrink-0">
          <AssetList
            portfolio={portfolio}
            selectedTicker={selectedTicker}
            onSelect={setSelectedTicker}
            onAdd={addTicker}
            onRemove={removeTicker}
            onUpdateQuantity={updateQuantity}
          />
        </div>

        {/* Chart Toolbar */}
        <ChartToolbar />

        {/* Main Chart Area */}
        <div className="flex-1 flex flex-col p-2 overflow-hidden">
          <TradingChart asset={selectedAsset} />
        </div>
      </div>
    </div>
  );
};

export default Index;
