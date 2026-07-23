"use client";

import { useMemo, useState } from "react";
import { POKEMON } from "@/data";
import { useGameStore } from "@/lib/store";
import { ICON } from "@/lib/icon";
import { AudioEngine } from "@/lib/audio";

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
          {caughtTotal}/721
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
          return (
            <div
              key={p.id}
              className={"dex-cell r-" + p.r + (seen ? "" : " unknown")}
              onClick={() => {
                if (!seen) return;
                AudioEngine.sfx("click");
                openModal({ kind: "dexDetail", id: p.id });
              }}
            >
              <img src={ICON(p.id)} loading="lazy" alt="" />
              <div className="dc-name">{seen ? p.c : "？？？"}</div>
              <div className="dc-id">
                No.{String(p.id).padStart(3, "0")}
                {caught ? " ✅" : ""}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
