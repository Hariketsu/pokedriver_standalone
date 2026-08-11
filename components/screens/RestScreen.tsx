"use client";

import { useRef } from "react";
import { useGameStore } from "@/lib/store";
import { AudioEngine } from "@/lib/audio";
import SceneBg from "@/components/ui/SceneBg";
import Icon from "@/components/ui/Icon";
import type { RestOptionId } from "@/lib/types";

const REST_OPTS: {
  id: RestOptionId;
  icon: string;
  name: string;
  desc: string;
  sfx: "heal" | "levelup" | "correct";
}[] = [
  {
    id: "campfire",
    icon: "item-campfire",
    name: "篝火休息",
    desc: "全队恢复 40% 最大 HP",
    sfx: "heal",
  },
  {
    id: "train",
    icon: "item-book",
    name: "考前特训",
    desc: "出战宝可梦获得 20 XP",
    sfx: "correct",
  },
  {
    id: "meditate",
    icon: "item-star",
    name: "冥想温习",
    desc: "随机清除 3 道错题记录",
    sfx: "heal",
  },
];

export default function RestScreen() {
  const applyRestOption = useGameStore((s) => s.applyRestOption);
  const setScreen = useGameStore((s) => s.setScreen);
  const locked = useRef(false);

  return (
    <section className="screen active has-scene" id="scr-rest">
      <SceneBg name="rest" />
      <div className="page-head">
        <h2>篝火休息点</h2>
        <p className="dim">选择一项恢复</p>
      </div>
      <div className="rest-list" id="rest-list">
        {REST_OPTS.map((o) => (
          <div
            key={o.id}
            className="rest-card"
            onClick={() => {
              if (locked.current) return;
              locked.current = true;
              applyRestOption(o.id);
              const toast = useGameStore.getState().toast?.message ?? "";
              if (o.id === "train" && toast.includes("升到了")) {
                AudioEngine.sfx("levelup");
              } else if (o.id === "train") {
                AudioEngine.sfx("correct");
              } else {
                AudioEngine.sfx(o.sfx);
              }
              setTimeout(() => {
                setScreen("map");
                AudioEngine.bgm("map");
              }, 600);
            }}
          >
            <div className="rc-icon">
              <Icon name={o.icon} size={44} alt={o.name} />
            </div>
            <div className="rc-name">{o.name}</div>
            <div className="rc-desc">{o.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
