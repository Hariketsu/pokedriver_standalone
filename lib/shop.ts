import { GAME_CONST } from "@/data";
import { pokeMaxHp } from "./formulas";
import type { RunState, ShopItemDef, ShopItemId } from "./types";

export const SHOP_POOL: ShopItemDef[] = [
  {
    id: "potion",
    icon: "🧪",
    name: "伤药",
    desc: "恢复当前出战宝可梦 50% HP",
    price: 30,
    can: () => true,
  },
  {
    id: "bigPotion",
    icon: "💊",
    name: "好伤药",
    desc: "完全恢复当前出战宝可梦 HP",
    price: 55,
    can: () => true,
  },
  {
    id: "teamSpray",
    icon: "🧴",
    name: "全队恢复喷雾",
    desc: "全队存活宝可梦恢复 50% HP",
    price: 85,
    can: () => true,
  },
  {
    id: "balls",
    icon: "🔴",
    name: "精灵球 ×3",
    desc: "用于捕获击败的宝可梦",
    price: 45,
    can: () => true,
  },
  {
    id: "superBalls",
    icon: "🔵",
    name: "超级球 ×2",
    desc: "捕获率 ×1.6 的高级精灵球",
    price: 70,
    can: () => true,
  },
  {
    id: "atkBadge",
    icon: "⚔️",
    name: "攻击之证",
    desc: "本次冒险全队攻击 +1",
    price: 80,
    can: () => true,
  },
  {
    id: "hpOrb",
    icon: "❤️",
    name: "生命宝珠",
    desc: "本次冒险全队最大 HP +3",
    price: 80,
    can: () => true,
  },
  {
    id: "revive",
    icon: "✨",
    name: "复活水晶",
    desc: "复活所有倒下宝可梦并恢复 50% HP",
    price: 100,
    can: (r) => r.team.some((p) => p.hp <= 0),
  },
  {
    id: "xpBook",
    icon: "📚",
    name: "考前秘籍",
    desc: "立即获得 25 XP（出战宝可梦）",
    price: 50,
    can: () => true,
  },
];

export function shopPrice(base: number, floor: number): number {
  return base + Math.floor(floor * 2.5);
}

/** Apply shop item effect. Mutates run. */
export function applyShopItem(run: RunState, id: ShopItemId): void {
  switch (id) {
    case "potion":
      run.potions++;
      break;
    case "bigPotion": {
      const a = run.team[run.activeIdx]!;
      a.hp = pokeMaxHp(a, run.hpBonus);
      break;
    }
    case "teamSpray":
      run.team.forEach((p) => {
        if (p.hp > 0) {
          const max = pokeMaxHp(p, run.hpBonus);
          p.hp = Math.min(max, p.hp + Math.ceil(max / 2));
        }
      });
      break;
    case "balls":
      run.balls += 3;
      break;
    case "superBalls":
      run.superBalls += 2;
      break;
    case "atkBadge":
      run.atkBonus++;
      break;
    case "hpOrb":
      run.hpBonus += 3;
      run.team.forEach((p) => {
        p.hp += 3;
      });
      break;
    case "revive":
      run.team.forEach((p) => {
        if (p.hp <= 0) p.hp = Math.ceil(pokeMaxHp(p, run.hpBonus) / 2);
      });
      break;
    case "xpBook": {
      // Original only adds XP; level-up happens later via battle/rest grant
      const a = run.team[run.activeIdx]!;
      a.xp += 25;
      break;
    }
    default:
      break;
  }
}

/** Pick up to 5 unique shop items (same shuffle as original). */
export function rollShopStock(): ShopItemDef[] {
  const pool = SHOP_POOL.slice();
  const stock: ShopItemDef[] = [];
  while (stock.length < 5 && pool.length) {
    const i = Math.floor(Math.random() * pool.length);
    stock.push(pool.splice(i, 1)[0]!);
  }
  return stock;
}

export { GAME_CONST };
