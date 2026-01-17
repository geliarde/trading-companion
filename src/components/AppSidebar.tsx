import { LayoutDashboard, LineChart, Newspaper, MessageSquare, Settings, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppView } from '@/types/trading';

interface AppSidebarProps {
  currentView: AppView;
  onViewChange: (view: AppView) => void;
}

const navItems: { view: AppView; icon: React.ElementType; label: string }[] = [
  { view: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { view: 'analysis', icon: LineChart, label: 'Análise' },
  { view: 'news', icon: Newspaper, label: 'Notícias' },
  { view: 'chat', icon: MessageSquare, label: 'IA Advisor' },
];

export function AppSidebar({ currentView, onViewChange }: AppSidebarProps) {
  return (
    <aside className="flex flex-col h-full w-16 bg-card border-r border-border py-4">
      {/* Logo */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative">
          <Activity className="h-7 w-7 text-primary" />
          <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-2">
        {navItems.map(({ view, icon: Icon, label }) => {
          const isActive = currentView === view;
          return (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all',
                'hover:bg-secondary/50',
                isActive && 'bg-primary/10'
              )}
              title={label}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-primary rounded-r-full" />
              )}
              <div className={cn(
                'p-2 rounded-lg transition-colors',
                isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              )}>
                <Icon className="h-5 w-5" />
              </div>
              <span className={cn(
                'text-[10px] font-mono transition-colors',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Settings */}
      <div className="px-2 mt-auto">
        <button
          className="flex flex-col items-center justify-center gap-1 py-3 rounded-lg transition-all hover:bg-secondary/50 w-full"
          title="Configurações"
        >
          <div className="p-2 rounded-lg text-muted-foreground hover:text-foreground">
            <Settings className="h-5 w-5" />
          </div>
          <span className="text-[10px] font-mono text-muted-foreground">Config</span>
        </button>
      </div>
    </aside>
  );
}
