"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { babelforgeApi } from "@/lib/api/client";
import { routeForPath, KIND_LABEL } from "@/lib/palantir/registry";
import { useAI } from "@/context/AIContext";

/**
 * Bottom status bar — Palantir/Foundry-style: env, build hash, latency,
 * user/role, current route kind, UTC clock. Always rendered. Width
 * scrolls horizontally on narrow viewports so segments never wrap.
 */
export default function StatusBar() {
  const pathname = usePathname();
  const route = routeForPath(pathname);
  const { resetEngine } = useAI();
  const [clock, setClock] = useState("--:--:--Z");
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [apiState, setApiState] = useState<"ok" | "warn" | "crit" | "unknown">("unknown");

  useEffect(() => {
    const tick = () => setClock(new Date().toISOString().substring(11, 19) + "Z");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const ping = async () => {
      const t0 = performance.now();
      try {
        await babelforgeApi.health();
        if (cancelled) return;
        const dt = Math.round(performance.now() - t0);
        setLatencyMs(dt);
        setApiState(dt > 1500 ? "warn" : "ok");
      } catch {
        if (cancelled) return;
        setLatencyMs(null);
        setApiState("crit");
      }
    };
    ping();
    const id = setInterval(ping, 30_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const [env, setEnv] = useState<string>("PROD");

  useEffect(() => {
    setEnv(window.location.hostname === "localhost" ? "DEV" : "PROD");
  }, []);

  const build =
    process.env.NEXT_PUBLIC_BUILD_SHA?.substring(0, 7) || "preview";

  return (
    <footer className="status-bar" role="contentinfo">
      <span className="seg">
        <span className="k">env</span>
        <span className="v">{env}</span>
      </span>
      <span className="sep" />
      <span className="seg">
        <span className="k">build</span>
        <span className="v">{build}</span>
      </span>
      <span className="sep" />
      <span className={`seg ${apiState === "ok" ? "ok" : apiState === "warn" ? "warn" : apiState === "crit" ? "crit" : ""}`}>
        <span className="k">api</span>
        <span className="v">
          {apiState === "unknown" ? "…" : apiState.toUpperCase()}
          {latencyMs !== null ? ` ${latencyMs}ms` : ""}
        </span>
      </span>
      <span className="sep" />
      <span className="seg">
        <span className="k">module</span>
        <span className="v">{route ? KIND_LABEL[route.kind] + "/" + route.label.toLowerCase().replace(/\s+/g, "-") : "—"}</span>
      </span>
      <span className="sep" />
      <span className="seg">
        <span className="k">user</span>
        <span className="v">anon</span>
      </span>
      <span className="sep" />
      <span className="seg">
        <span className="k">role</span>
        <span className="v">viewer</span>
      </span>
      <span className="sep" />
      <span className="seg">
        <span className="k">utc</span>
        <span className="v">{clock}</span>
      </span>
      <span className="sep" />
      <span className="seg cursor-pointer hover:bg-surface-200 transition-colors" onClick={resetEngine}>
        <span className="k text-crit">reset</span>
        <span className="v">sys</span>
      </span>
      <span className="sep" />
      <span className="seg">
        <kbd>⌘K</kbd>
      </span>
      </footer>
  );
}
