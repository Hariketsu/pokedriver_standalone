"use client";

import { GAME_CONST } from "@/data";
import { useGameStore } from "@/lib/store";
import { metaUpgradeCost } from "@/lib/formulas";
import { AudioEngine } from "@/lib/audio";
import Icon from "@/components/ui/Icon";
import SceneBg from "@/components/ui/SceneBg";

export default function TrainScreen() {
  const meta = useGameStore((s) => s.meta);
  const setScreen = useGameStore((s) => s.setScreen);
  const buyMetaAtk = useGameStore((s) => s.buyMetaAtk);
  const buyMetaHp = useGameStore((s) => s.buyMetaHp);

  const atkMax = meta.metaAtkLv >= GAME_CONST.MAX_META_ATK_LV;
  const hpMax = meta.metaHpLv >= GAME_CONST.MAX_META_HP_LV;
  const atkCost = metaUpgradeCost(meta.metaAtkLv);
  const hpCost = metaUpgradeCost(meta.metaHpLv);
  const atkBonus = meta.metaAtkLv * GAME_CONST.ATK_PER_META_LV;
  const hpBonus = meta.metaHpLv * GAME_CONST.HP_PER_META_LV;

  return (
    <section className="screen active has-scene" id="scr-train">
      <SceneBg name="battle" soft />
      <div className="page-head row">
        <button
          className="btn btn-mini"
          id="btn-train-back"
          onClick={() => {
            AudioEngine.sfx("click");
            setScreen("title");
          }}
        >
          返回
        </button>
        <h2>养成训练</h2>
        <span style={{ width: 52 }} />
      </div>

      <img
        className="train-flag px"
        src="/art/strip-checkers.png"
        alt=""
        draggable={false}
      />

      <div className="train-body">
        <div className="train-gold" id="train-meta-gold">
          <span className="tg-label">养成金币</span>
          <span className="tg-val gold">
            <Icon name="item-coin" size={18} alt="金币" /> {meta.metaGold}
          </span>
        </div>
        <p className="dim train-hint">
          冒险结束时会按金币的一半存入养成银行。升级效果在下次冒险开始时生效（攻击/生命加成）。
        </p>

        <div className="train-card">
          <div className="tc-head">
            <span className="tc-icon">
              <Icon name="item-sword" size={32} alt="攻击" />
            </span>
            <div>
              <div className="tc-name">攻击养成</div>
              <div className="tc-sub dim">
                Lv.{meta.metaAtkLv}/{GAME_CONST.MAX_META_ATK_LV} · 下局攻击 +
                {atkBonus}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            id="btn-train-atk"
            disabled={atkMax || meta.metaGold < atkCost}
            onClick={() => {
              if (buyMetaAtk()) AudioEngine.sfx("coin");
              else AudioEngine.sfx("click");
            }}
          >
            {atkMax ? (
              "已满级"
            ) : (
              <>
                升级 · <Icon name="item-coin" size={13} alt="金币" />
                {atkCost}
              </>
            )}
          </button>
        </div>

        <div className="train-card">
          <div className="tc-head">
            <span className="tc-icon">
              <Icon name="item-heart" size={32} alt="生命" />
            </span>
            <div>
              <div className="tc-name">生命养成</div>
              <div className="tc-sub dim">
                Lv.{meta.metaHpLv}/{GAME_CONST.MAX_META_HP_LV} · 下局 HP +
                {hpBonus}
              </div>
            </div>
          </div>
          <button
            className="btn btn-primary"
            id="btn-train-hp"
            disabled={hpMax || meta.metaGold < hpCost}
            onClick={() => {
              if (buyMetaHp()) AudioEngine.sfx("heal");
              else AudioEngine.sfx("click");
            }}
          >
            {hpMax ? (
              "已满级"
            ) : (
              <>
                升级 · <Icon name="item-coin" size={13} alt="金币" />
                {hpCost}
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  );
}
