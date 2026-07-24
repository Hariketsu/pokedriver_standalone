import type { MapNode, NodeType, RunState } from "./types";
import { pick } from "./formulas";

export const NODE_ICON: Record<NodeType, string> = {
  battle: "⚔️",
  elite: "💀",
  shop: "🛒",
  rest: "🔥",
  event: "❓",
  treasure: "🎁",
  boss2: "👹",
  boss: "🐉",
};

export const NODE_LABEL: Record<NodeType, string> = {
  battle: "战斗",
  elite: "精英",
  shop: "商店",
  rest: "休息",
  event: "事件",
  treasure: "宝箱",
  boss2: "中层BOSS",
  boss: "BOSS",
};

export const MAP_ROWS = 15;

/** Generate a 15-row map with event/treasure mid-floor weights. */
export function genMap(): MapNode[][] {
  const ROWS = MAP_ROWS;
  const rows: MapNode[][] = [];

  for (let f = 0; f < ROWS; f++) {
    let cols: number[];
    if (f === ROWS - 1 || f === 7) {
      cols = [1];
    } else {
      const layouts: number[][] = [[0, 2], [0, 1], [1, 2], [0, 1, 2]];
      cols = pick(layouts);
    }
    const row: MapNode[] = cols.map((c) => {
      let type: NodeType = "battle";
      if (f === ROWS - 1) type = "boss";
      else if (f === 7) type = "boss2";
      else if (f === 0) type = "battle";
      else {
        // battle 0.48 / elite 0.12 / shop 0.12 / rest 0.12 / event 0.08 / treasure 0.08
        const roll = Math.random();
        if (roll < 0.48) type = "battle";
        else if (roll < 0.6) type = "elite";
        else if (roll < 0.72) type = "shop";
        else if (roll < 0.84) type = "rest";
        else if (roll < 0.92) type = "event";
        else type = "treasure";
      }
      return { c, type, edges: [], x: 0, y: 0, done: false };
    });
    rows.push(row);
  }

  // Ensure at least 2 rest + 2 shop
  type FlatNode = MapNode & { _in?: number };
  const flats: FlatNode[] = [];
  rows.forEach((row, f) => {
    row.forEach((n) => {
      if (f > 0 && f < ROWS - 1 && f !== 7) flats.push(n);
    });
  });

  const ensureType = (t: NodeType, cnt: number) => {
    let have = flats.filter((n) => n.type === t).length;
    while (have < cnt) {
      const n = pick(flats);
      if (n.type === "battle") {
        n.type = t;
        have++;
      }
    }
  };
  ensureType("rest", 2);
  ensureType("shop", 2);

  // Edges
  for (let f = 0; f < ROWS - 1; f++) {
    const cur = rows[f]! as FlatNode[];
    const nxt = rows[f + 1]! as FlatNode[];
    nxt.forEach((n) => {
      n._in = 0;
    });
    cur.forEach((n) => {
      const targets = nxt
        .map((m, j) => ({ j, d: Math.abs(m.c - n.c) }))
        .filter((t) => t.d <= 1)
        .sort((a, b) => a.d - b.d);
      const list =
        targets.length > 0
          ? targets
          : nxt.map((_m, j) => ({ j, d: 0 }));
      const first = list[0]!.j;
      n.edges.push(first);
      nxt[first]!._in = (nxt[first]!._in || 0) + 1;
      if (list.length > 1 && Math.random() < 0.45) {
        const second = list[1]!.j;
        if (!n.edges.includes(second)) {
          n.edges.push(second);
          nxt[second]!._in = (nxt[second]!._in || 0) + 1;
        }
      }
    });
    // Ensure every next-row node is reachable
    nxt.forEach((m, j) => {
      if ((m._in || 0) === 0) {
        const src = cur
          .map((n, i) => ({ i, d: Math.abs(n.c - m.c) }))
          .sort((a, b) => a.d - b.d)[0]!.i;
        cur[src]!.edges.push(j);
      }
    });
    nxt.forEach((n) => {
      delete n._in;
    });
  }

  return rows;
}

export function isCurrentNode(run: RunState, n: MapNode): boolean {
  if (run.pos.f < 0) return false;
  const cur = run.mapRows[run.pos.f]?.[run.pos.i];
  return cur === n;
}

export function isReachable(run: RunState, f: number, i: number): boolean {
  if (run.pos.f === -1) return f === 0;
  const cur = run.mapRows[run.pos.f]?.[run.pos.i];
  if (!cur) return false;
  return f === run.pos.f + 1 && cur.edges.includes(i);
}
