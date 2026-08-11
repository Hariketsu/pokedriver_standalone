"use client";

import { useGameStore } from "@/lib/store";
import { shopPrice } from "@/lib/shop";
import { AudioEngine } from "@/lib/audio";
import SceneBg from "@/components/ui/SceneBg";
import Icon from "@/components/ui/Icon";

const SHOP_ICONS: Record<string, string> = {
  potion: "item-potion",
  bigPotion: "item-potion-super",
  teamSpray: "item-spray",
  balls: "item-ball-red",
  greatBalls: "item-ball-blue",
  ultraBalls: "item-ball-yellow",
  masterBall: "item-ball-master",
  atkBadge: "item-sword",
  hpOrb: "item-heart",
  revive: "item-revive",
  xpBook: "item-book",
};

export default function ShopScreen() {
  const run = useGameStore((s) => s.run);
  const shopStock = useGameStore((s) => s.shopStock);
  const buyShopItem = useGameStore((s) => s.buyShopItem);
  const leaveShop = useGameStore((s) => s.leaveShop);

  if (!run) return null;
  const floor = run.pos.f + 1;

  return (
    <section className="screen active has-scene" id="scr-shop">
      <SceneBg name="shop" />
      <div className="page-head">
        <h2>神秘商店</h2>
        <p className="dim" id="shop-gold">
          金币：{run.gold}
        </p>
      </div>
      <div className="shop-list" id="shop-list">
        {shopStock.map((item, i) => {
          const price = shopPrice(item.price, floor);
          const disabled = run.gold < price || !item.can(run);
          return (
            <div className="shop-item" key={`${item.id}-${i}`}>
              <div className="si-icon">
                {SHOP_ICONS[item.id] ? (
                  <Icon name={SHOP_ICONS[item.id]} size={36} alt={item.name} />
                ) : (
                  item.icon
                )}
              </div>
              <div className="si-body">
                <div className="si-name">{item.name}</div>
                <div className="si-desc">{item.desc}</div>
              </div>
              <button
                className="btn btn-mini si-buy"
                disabled={disabled}
                onClick={() => {
                  if (buyShopItem(i)) AudioEngine.sfx("coin");
                }}
              >
                <Icon name="item-coin" size={14} alt="金币" />
                {price}
              </button>
            </div>
          );
        })}
      </div>
      <div className="page-foot">
        <button
          className="btn btn-primary"
          id="btn-shop-leave"
          onClick={() => {
            AudioEngine.sfx("click");
            leaveShop();
            AudioEngine.bgm("map");
          }}
        >
          离开商店
        </button>
      </div>
    </section>
  );
}
