"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { buildCommands, Command } from "@/lib/palantir/registry";

/**
 * ⌘K / Ctrl+K command palette. Mounted once at the layout root and
 * listens globally. Fuzzy-ish substring match keeps the dependency
 * surface zero.
 */
export default function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo(() => buildCommands(), []);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return commands;
    return commands.filter((c) =>
      (c.title + " " + (c.hint ?? "") + " " + c.group)
        .toLowerCase()
        .includes(needle)
    );
  }, [commands, q]);

  // Open / close + arrow key + enter
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setCursor((c) => Math.min(filtered.length - 1, c + 1)); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setCursor((c) => Math.max(0, c - 1)); return; }
      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[cursor];
        if (cmd) {
          setOpen(false);
          cmd.run({ push: (href) => router.push(href) });
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, cursor, router]);

  useEffect(() => {
    if (open) {
      setQ("");
      setCursor(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const runCommand = (cmd: Command) => {
    setOpen(false);
    cmd.run({ push: (href) => router.push(href) });
  };

  if (!open) return null;

  // Group entries by section.
  const grouped = filtered.reduce<Record<string, Command[]>>((acc, c) => {
    (acc[c.group] = acc[c.group] || []).push(c);
    return acc;
  }, {});

  let flatIndex = -1;

  return (
    <div className="cmd-overlay" onClick={() => setOpen(false)}>
      <div className="cmd-panel" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          className="cmd-input"
          placeholder="Type a command or search modules…"
          value={q}
          onChange={(e) => { setQ(e.target.value); setCursor(0); }}
          aria-label="Command palette"
        />
        <div className="cmd-list custom-scrollbar">
          {filtered.length === 0 && (
            <div className="cmd-item" style={{ color: "var(--ink-muted)" }}>
              No matches.
            </div>
          )}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group}>
              <div className="cmd-section">{group}</div>
              {items.map((c) => {
                flatIndex += 1;
                const isActive = flatIndex === cursor;
                return (
                  <div
                    key={c.id}
                    className={`cmd-item ${isActive ? "active" : ""}`}
                    onMouseEnter={() => setCursor(filtered.indexOf(c))}
                    onClick={() => runCommand(c)}
                  >
                    <span className="label">{c.title}</span>
                    {c.hint && <span className="hint">{c.hint}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div
          className="cmd-section"
          style={{ display: "flex", justifyContent: "space-between" }}
        >
          <span>↑↓ navigate · ↵ select · esc close</span>
          <span>{filtered.length} result{filtered.length === 1 ? "" : "s"}</span>
        </div>
      </div>
    </div>
  );
}
