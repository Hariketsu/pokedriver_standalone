export type SceneName =
  | "battle"
  | "map"
  | "shop"
  | "rest"
  | "over-win"
  | "over-lose";

/**
 * Full-bleed pixel-art scene background: portrait asset on mobile,
 * 16:9 asset on desktop (>=768px), plus a darkening shade for legibility.
 * Render as the FIRST child of a `.screen.has-scene` section.
 */
export default function SceneBg({
  name,
  soft = false,
  position,
}: {
  name: SceneName;
  /** lighter shade — use where more of the art should show through */
  soft?: boolean;
  /** object-position override, e.g. "center 20%" */
  position?: string;
}) {
  return (
    <div className="scene-bg" aria-hidden="true">
      <picture>
        <source media="(min-width:768px)" srcSet={`/art/bg-${name}-16-9.webp`} />
        <img
          src={`/art/bg-${name}.webp`}
          alt=""
          style={position ? { objectPosition: position } : undefined}
        />
      </picture>
      <div className={soft ? "scene-shade soft" : "scene-shade"} />
    </div>
  );
}
