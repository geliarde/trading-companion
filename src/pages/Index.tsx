import { Header } from '@/components/Header';
import { PortfolioManager } from '@/components/PortfolioManager';
import { AssetCard } from '@/components/AssetCard';
import { NewsAlerts } from '@/components/NewsAlerts';
import { SummaryTable } from '@/components/SummaryTable';
import { QuickStats } from '@/components/QuickStats';
import { usePortfolio } from '@/hooks/usePortfolio';

const Index = () => {
  const { portfolio, news, addTicker, removeTicker, updateQuantity } = usePortfolio();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Portfolio Manager */}
        <PortfolioManager
          portfolio={portfolio}
          onAdd={addTicker}
          onRemove={removeTicker}
          onUpdateQuantity={updateQuantity}
        />

        {/* Quick Stats */}
        <QuickStats portfolio={portfolio} news={news} />

        {/* Summary Table */}
        <SummaryTable portfolio={portfolio} news={news} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Asset Cards */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="font-semibold font-mono text-sm text-muted-foreground uppercase tracking-wider">
              Análise Detalhada
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {portfolio.map(asset => (
                <AssetCard key={asset.ticker} asset={asset} />
              ))}
            </div>
          </div>

          {/* News Sidebar */}
          <div className="space-y-4">
            <h2 className="font-semibold font-mono text-sm text-muted-foreground uppercase tracking-wider">
              Notícias em Tempo Real
            </h2>
            <NewsAlerts news={news} />
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
            <p>
              ⚠️ Regras de Ouro: RSI &gt; 70 = Não Comprar | Stop Loss = Suporte Anterior
            </p>
            <p>
              Dados simulados • Não constitui recomendação de investimento
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Index;
