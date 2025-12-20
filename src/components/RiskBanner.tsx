import { AlertCircle, ShieldAlert } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MacroState } from "@/services/marketData";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

type RiskBannerProps = {
  macro: MacroState;
  protectionMode: boolean;
};

export function RiskBanner({ macro, protectionMode }: RiskBannerProps) {
  const usdUp = macro["USDT/BRL"].changePercent > 1;
  const btcDown = macro.BTC.changePercent < -5;

  if (!usdUp && !btcDown && !protectionMode) return null;

  return (
    <Alert variant={protectionMode ? "destructive" : "default"} className="p-3">
      {protectionMode ? <ShieldAlert className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
      <div>
        <AlertTitle className="text-sm font-mono">
          {protectionMode ? "Modo de Proteção" : "Alerta de Risco"}
        </AlertTitle>
        <AlertDescription className={cn("text-xs text-muted-foreground", protectionMode && "text-destructive/90")}>
          {usdUp && (
            <span className="mr-3">
              <span className="font-mono">USDT/BRL</span> +{macro["USDT/BRL"].changePercent.toFixed(2)}% (risco B3)
            </span>
          )}
          {btcDown && (
            <span>
              <span className="font-mono">BTC</span> {macro.BTC.changePercent.toFixed(2)}% (risk-off)
            </span>
          )}
          {protectionMode && !btcDown && <span>Ajuste stops e reduza risco.</span>}
        </AlertDescription>
      </div>
    </Alert>
  );
}

