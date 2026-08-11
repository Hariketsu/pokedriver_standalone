"use client";

import { useEffect, useMemo, useRef, useState, type ReactElement } from "react";
import { useGameStore, selectScore } from "@/lib/store";
import { NODE_ICON, isReachable } from "@/lib/map";
import { clamp } from "@/lib/formulas";
import { AudioEngine } from "@/lib/audio";
import SceneBg from "@/components/ui/SceneBg";
import Icon from "@/components/ui/Icon";
import type { MapNode, RunState } from "@/lib/types";

function stableJitter(f: number, i: number, c: number): number {
  return ((f * 17 + i * 31 + c * 13) % 17) - 8;
}

function ballHud(run: RunState): ReactElement[] {
  const item = (key: string, icon: string, count: number) => (
    <span key={key} className="ball-hud-item">
      <Icon name={icon} size={14} alt={key} />
      {count}
    </span>
  );
  const parts: ReactElement[] = [item("ball", "item-ball-red", run.balls)];
  const great = run.greatBalls ?? run.superBalls ?? 0;
  if (great > 0) parts.push(item("great", "item-ball-blue", great));
  if ((run.ultraBalls ?? 0) > 0)
    parts.push(item("ultra", "item-ball-yellow", run.ultraBalls!));
  if ((run.masterBalls ?? 0) > 0)
    parts.push(item("master", "item-ball-master", run.masterBalls!));
  return parts;
}

export default function MapScreen() {
  const run = useGameStore((s) => s.run);
  const moveTo = useGameStore((s) => s.moveTo);
  const openModal = useGameStore((s) => s.openModal);
  const quitToTitle = useGameStore((s) => s.quitToTitle);
  const score = useGameStore(selectScore);
  const scrollRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(360);

  useEffect(() => {
    const measure = () => {
      const w =
        innerRef.current?.clientWidth ||
        scrollRef.current?.clientWidth ||
        window.innerWidth;
      setWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const layout = useMemo(() => {
    if (!run) return null;
    const rowH = 78;
    const topPad = 60;
    const botPad = 70;
    const H = topPad + botPad + rowH * 14 + 40;
    const colX = (c: number) => width * (0.2 + c * 0.3);
    const pos: { x: number; y: number }[][] = run.mapRows.map((row, f) =>
      row.map((n, i) => ({
        x: colX(n.c) + (row.length > 1 ? stableJitter(f, i, n.c) : 0),
        y: H - botPad - f * rowH,
      })),
    );
    return { H, pos };
  }, [run, width]);

  useEffect(() => {
    if (!run || !layout || !scrollRef.current) return;
    const curY =
      run.pos.f < 0
        ? layout.H
        : (layout.pos[run.pos.f]?.[run.pos.i]?.y ?? layout.H);
    const scroll = scrollRef.current;
    scroll.scrollTop = clamp(
      curY - scroll.clientHeight * 0.6,
      0,
      layout.H,
    );
  }, [run?.pos.f, run?.pos.i, layout, run]);

  if (!run || !layout) return null;

  const isCurrent = (f: number, i: number) =>
    run.pos.f >= 0 && run.pos.f === f && run.pos.i === i;

  const lines: { x1: number; y1: number; x2: number; y2: number; cls: string }[] =
    [];
  run.mapRows.forEach((row, f) =>
    row.forEach((n, i) =>
      n.edges.forEach((j) => {
        const m = run.mapRows[f + 1]?.[j];
        const p1 = layout.pos[f]?.[i];
        const p2 = layout.pos[f + 1]?.[j];
        if (!m || !p1 || !p2) return;
        let cls = "";
        if (n.done && m.done) cls = "done";
        else if (isCurrent(f, i)) cls = "open";
        lines.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y, cls });
      }),
    ),
  );

  return (
    <section className="screen active has-scene" id="scr-map">
      <SceneBg name="map" soft />
      <div className="hud-bar">
        <div className="hud-item" id="hud-floor">
          第 {clamp(run.pos.f + 1, 1, 15)} 层
        </div>
        <div className="hud-item gold" id="hud-gold">
          {run.gold} 金币
        </div>
        <div className="hud-item" id="hud-balls" title="精灵球库存">
          {ballHud(run)}
        </div>
        <div className="hud-item" id="hud-score">
          分数 {score}
        </div>
        <button
          className="btn btn-mini"
          id="btn-map-team"
          onClick={() => {
            AudioEngine.sfx("click");
            openModal({ kind: "team" });
          }}
        >
          队伍
        </button>
        <button
          className="btn btn-mini"
          id="btn-map-quit"
          onClick={() => {
            AudioEngine.sfx("click");
            quitToTitle();
            AudioEngine.bgm("title");
          }}
        >
          存档退出
        </button>
      </div>
      <div className="map-scroll" id="map-scroll" ref={scrollRef}>
        <div
          className="map-inner"
          id="map-inner"
          ref={innerRef}
          style={{ height: layout.H }}
        >
          <svg
            id="map-svg"
            viewBox={`0 0 ${width} ${layout.H}`}
            style={{ height: layout.H }}
          >
            {lines.map((l, idx) => (
              <line
                key={idx}
                className={l.cls}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
              />
            ))}
          </svg>
          <div id="map-nodes">
            {run.mapRows.map((row, f) =>
              row.map((n: MapNode, i: number) => {
                const p = layout.pos[f]![i]!;
                const boss = n.type === "boss" || n.type === "boss2";
                let cls = "map-node" + (boss ? " boss" : "");
                if (n.type === "event") cls += " event";
                if (n.type === "treasure") cls += " treasure";
                let clickable = false;
                if (n.done) cls += " done";
                else if (isCurrent(f, i)) cls += " current";
                else if (isReachable(run, f, i)) {
                  cls += " reachable";
                  clickable = true;
                } else cls += " locked";
                return (
                  <div
                    key={`${f}-${i}`}
                    className={cls}
                    title={n.type}
                    style={{ left: p.x, top: p.y }}
                    onClick={() => {
                      if (!clickable) return;
                      AudioEngine.sfx("click");
                      moveTo(f, i);
                    }}
                  >
                    <Icon name={NODE_ICON[n.type]} size={boss ? 34 : 28} alt={n.type} />
                  </div>
                );
              }),
            )}
          </div>
        </div>
      </div>
      <div className="map-legend">
        <span>
          <i className="lg lg-battle" />
          战斗
        </span>
        <span>
          <i className="lg lg-elite" />
          精英
        </span>
        <span>
          <i className="lg lg-shop" />
          商店
        </span>
        <span>
          <i className="lg lg-rest" />
          休息
        </span>
        <span>
          <i className="lg lg-event" />
          事件
        </span>
        <span>
          <i className="lg lg-treasure" />
          宝箱
        </span>
        <span>
          <i className="lg lg-boss" />
          BOSS
        </span>
      </div>
    </section>
  );
}
