/**
 * Pixel-art UI icon from the split sheets in /art/ui/.
 * Replaces emoji glyphs. Height is fixed; width follows the asset ratio.
 */
export default function Icon({
  name,
  size = 24,
  alt = "",
  className,
}: {
  /** cell name without extension, e.g. "item-ball-red" */
  name: string;
  /** rendered height in px */
  size?: number;
  alt?: string;
  className?: string;
}) {
  return (
    <img
      className={className ? `px-icon ${className}` : "px-icon"}
      src={`/art/ui/${name}.png`}
      alt={alt}
      style={{ height: size, width: "auto" }}
      draggable={false}
    />
  );
}
