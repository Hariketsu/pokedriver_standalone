import { afterEach, describe, expect, it, vi } from "vitest";
import { catchChance, grantXpTo, newInstance, xpNeed } from "./formulas";
import { genMap, MAP_ROWS } from "./map";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("capture and progression rules", () => {
  it("keeps capture odds bounded and master balls certain", () => {
    expect(catchChance("c", "ultra")).toBe(0.98);
    expect(catchChance("l", "normal")).toBe(0.22);
    expect(catchChance("l", "master")).toBe(1);
  });

  it("caps level and retained experience", () => {
    const member = newInstance(1);

    grantXpTo(member, 10_000, 0);

    expect(member.lv).toBe(10);
    expect(member.xp).toBeLessThanOrEqual(xpNeed(member.lv));
  });
});

describe("map generation", () => {
  it("creates a connected 15-floor route with required stops", () => {
    let seed = 42;
    vi.spyOn(Math, "random").mockImplementation(() => {
      seed = (seed * 48_271) % 2_147_483_647;
      return (seed - 1) / 2_147_483_646;
    });

    const rows = genMap();
    const regularNodes = rows
      .slice(1, -1)
      .filter((_row, floor) => floor + 1 !== 7)
      .flat();

    expect(rows).toHaveLength(MAP_ROWS);
    expect(rows[0]!.every((node) => node.type === "battle")).toBe(true);
    expect(rows[7]).toHaveLength(1);
    expect(rows[7]![0]!.type).toBe("boss2");
    expect(regularNodes.filter((node) => node.type === "rest").length).toBeGreaterThanOrEqual(2);
    expect(regularNodes.filter((node) => node.type === "shop").length).toBeGreaterThanOrEqual(2);
    expect(rows[MAP_ROWS - 1]![0]!.type).toBe("boss");

    for (let floor = 0; floor < rows.length - 1; floor++) {
      const current = rows[floor]!;
      const next = rows[floor + 1]!;
      expect(current.every((node) => node.edges.length > 0)).toBe(true);
      expect(current.flatMap((node) => node.edges).every((index) => index < next.length)).toBe(
        true,
      );
      expect(next.every((_node, index) => current.some((node) => node.edges.includes(index)))).toBe(
        true,
      );
    }
  });
});
