"use client";

import { useMemo, useState } from "react";
import { POKEMON } from "@/data";
import { useGameStore } from "@/lib/store";
import { ICON } from "@/lib/icon";
import Icon from "@/components/ui/Icon";
import { AudioEngine } from "@/lib/audio";
import { RARITY_LABEL } from "@/lib/formulas";

type Filter = "all" | "caught" | "c" | "u" | "r" | "l";

export default function DexScreen() {
  const meta = useGameStore((s) => s.meta);
  const setScreen = useGameStore((s) => s.setScreen);
  const openModal = useGameStore((s) => s.openModal);
  const [filter, setFilter] = useState<Filter>("all");

  const dexCaught = (id: number) => {
    const d = meta.dex[String(id)];
    return !!(d && d.caught > 0);
  };
  const dexSeen = (id: number) => {
    const d = meta.dex[String(id)];
    return !!(d && d.seen > 0);
  };

  const caughtTotal = useMemo(
    () => POKEMON.filter((p) => dexCaught(p.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta.dex],
  );

  const seenTotal = useMemo(
    () => POKEMON.filter((p) => dexSeen(p.id)).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [meta.dex],
  );

  const list = useMemo(() => {
    return POKEMON.filter((p) => {
      if (filter === "caught" && !dexCaught(p.id)) return false;
      if (["c", "u", "r", "l"].includes(filter) && p.r !== filter) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, meta.dex]);

  const chips: { f: Filter; label: string }[] = [
    { f: "all", label: "全部" },
    { f: "caught", label: "已捕获" },
    { f: "c", label: "普通" },
    { f: "u", label: "稀有" },
    { f: "r", label: "珍贵" },
    { f: "l", label: "传说" },
  ];

  return (
    <section className="screen active" id="scr-dex">
      <div className="page-head row">
        <button
          className="btn btn-mini back"
          data-back
          onClick={() => {
            AudioEngine.sfx("click");
            setScreen("title");
          }}
        >
          ‹ 返回
        </button>
        <h2>宝可梦图鉴</h2>
        <div className="dex-progress" id="dex-progress">
          <span className="dex-progress-caught">{caughtTotal}</span>
          <span className="dex-progress-sep">/</span>
          <span className="dex-progress-total">721</span>
          <span className="dex-progress-seen">见{seenTotal}</span>
        </div>
      </div>
      <div className="dex-filter" id="dex-filter">
        {chips.map((ch) => (
          <button
            key={ch.f}
            className={"chip" + (filter === ch.f ? " active" : "")}
            data-f={ch.f}
            onClick={() => {
              AudioEngine.sfx("click");
              setFilter(ch.f);
            }}
          >
            {ch.label}
          </button>
        ))}
      </div>
      <div className="dex-grid" id="dex-grid">
        {list.map((p) => {
          const caught = dexCaught(p.id);
          const seen = dexSeen(p.id);
          const state = !seen ? "unknown" : caught ? "caught" : "seen";
          return (
            <button
              key={p.id}
              type="button"
              className={`dex-card r-${p.r} ${state}`}
              disabled={!seen}
              aria-label={
                seen
                  ? `No.${String(p.id).padStart(3, "0")} ${p.c}`
                  : `No.${String(p.id).padStart(3, "0")} 未遇见`
              }
              onClick={() => {
                if (!seen) return;
                AudioEngine.sfx("click");
                openModal({ kind: "dexDetail", id: p.id });
              }}
            >
              <span className="dex-card-foil" aria-hidden />
              <span className="dex-card-frame" aria-hidden />
              <span className="dex-card-rarity">{RARITY_LABEL[p.r]}</span>
              <span className="dex-card-art">
                <img src={ICON(p.id)} loading="lazy" alt="" draggable={false} />
              </span>
              <span className="dex-card-body">
                <span className="dc-id">No.{String(p.id).padStart(3, "0")}</span>
                <span className="dc-name">{seen ? p.c : "？？？"}</span>
              </span>
              {caught && (
                <span className="dex-card-badge caught" aria-label="已捕获">
                  <Icon name="badge-caught" size={18} alt="已捕获" />
                </span>
              )}
              {seen && !caught && (
                <span className="dex-card-badge seen" aria-label="遇见">
                  <Icon name="badge-seen" size={18} alt="遇见" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
