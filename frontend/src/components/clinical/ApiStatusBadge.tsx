"use client";

import { useEffect, useState } from "react";
import { babelforgeApi } from "@/lib/api/client";

type ApiState = "checking" | "online" | "offline";

interface ApiStatusBadgeProps {
  compact?: boolean;
  /** Polling interval in ms. Defaults to 30s. */
  intervalMs?: number;
}

/**
 * Live readout of the babelForge API. Polls /api/health and reflects
 * status via the standard `status-dot` token so the navbar/docs page
 * always share the same indicator.
 */
export default function ApiStatusBadge({
  compact = false,
  intervalMs = 30_000,
}: ApiStatusBadgeProps) {
  const [state, setState] = useState<ApiState>("checking");
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      const t0 =
        typeof performance !== "undefined" ? performance.now() : Date.now();
      try {
        const r = await babelforgeApi.health();
        if (cancelled) return;
        const t1 =
          typeof performance !== "undefined" ? performance.now() : Date.now();
        setLatency(Math.round(t1 - t0));
        setState(r?.status === "healthy" ? "online" : "offline");
      } catch {
        if (cancelled) return;
        setLatency(null);
        setState("offline");
      }
    };
    ping();
    const id = setInterval(ping, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [intervalMs]);

  const dotClass =
    state === "online" ? "ok" : state === "offline" ? "crit" : "warn";
  const label =
    state === "checking" ? "API …" : state === "online" ? "API" : "API offline";

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5"
        title={`babelForge API · ${state}${
          latency !== null ? ` · ${latency}ms` : ""
        } · ${babelforgeApi.baseUrl}`}
      >
        <span className={`status-dot ${dotClass}`} />
        <span className="text-[10px] font-mono uppercase tracking-widest2 text-ink-muted">
          {label}
        </span>
      </span>
    );
  }

  return (
    <div
      className="inline-flex items-center gap-2 px-2 py-1 rounded-clinical border border-line bg-surface-50"
      title={babelforgeApi.baseUrl}
    >
      <span className={`status-dot ${dotClass}`} />
      <span className="text-[10px] font-mono uppercase tracking-widest2 text-ink-subtle">
        babelForge API
      </span>
      <span className="text-[10px] font-mono text-ink-muted">
        {state === "online" && latency !== null ? `${latency}ms` : state}
      </span>
    </div>
  );
}
