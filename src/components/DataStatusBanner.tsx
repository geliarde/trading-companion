import { CloudOff, Database, Wifi, WifiOff } from "lucide-react";

import { cn } from "@/lib/utils";
import type { MarketDataHealth } from "@/hooks/useMarketData";

type DataStatusBannerProps = {
  health: MarketDataHealth;
};

function pillClass(status: MarketDataHealth["overall"]) {
  if (status === "ok") return "bg-bull/15 text-bull border-bull/30";
  if (status === "stale") return "bg-warning/15 text-warning border-warning/30";
  if (status === "degraded") return "bg-alert/15 text-alert border-alert/30";
  return "bg-bear/15 text-bear border-bear/30";
}

export function DataStatusBanner({ health }: DataStatusBannerProps) {
  const label =
    health.overall === "ok"
      ? "Dados: OK"
      : health.overall === "stale"
        ? "Dados: Desatualizados"
        : health.overall === "degraded"
          ? "Dados: Degradado (cache)"
          : "Dados: Offline";

  const Icon =
    health.overall === "ok" ? Wifi : health.overall === "offline" ? WifiOff : health.overall === "degraded" ? CloudOff : Database;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 rounded-lg border px-3 py-2",
        pillClass(health.overall),
      )}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Icon className="h-4 w-4 shrink-0" />
        <span className="font-mono text-xs truncate">{label}</span>
      </div>
      <span className="font-mono text-[10px] opacity-80">
        Macro:{` `}
        {health.macro.status.toUpperCase()}
      </span>
    </div>
  );
}

