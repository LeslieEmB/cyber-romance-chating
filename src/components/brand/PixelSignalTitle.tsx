import type { CSSProperties } from "react";

type PixelSignalTitleProps = {
  as?: "h1" | "span";
  compact?: boolean;
  className?: string;
};

const brandCharacters = ["赛", "博", "之", "恋"];
const mosaicBlocks = [
  [-2, -1],
  [0, -2],
  [2, -1],
  [-1, 0],
  [1, 0],
  [-2, 1],
  [0, 1],
  [2, 1],
  [-1, 2],
  [1, 2],
  [-2, 3],
  [0, 3],
  [2, 3],
  [-1, 4],
  [1, 4],
  [0, 5]
] as const;

export function PixelSignalTitle({ as = "span", compact = false, className = "" }: PixelSignalTitleProps) {
  const Element = as;

  return (
    <Element
      aria-label="赛博之恋"
      className={`pixel-signal-title ${compact ? "is-compact" : ""} ${className}`.trim()}
    >
      {brandCharacters.map((character, index) => (
        <span
          aria-hidden="true"
          className="signal-glyph"
          key={character}
          style={{ "--signal-index": index } as CSSProperties}
        >
          <span className="signal-character">{character}</span>
          {!compact ? (
            <span className="signal-mosaic">
              {mosaicBlocks.map(([x, y], blockIndex) => (
                <i
                  key={`${character}-${blockIndex}`}
                  style={{ "--block-index": blockIndex, "--block-x": x, "--block-y": y } as CSSProperties}
                />
              ))}
            </span>
          ) : null}
        </span>
      ))}
    </Element>
  );
}
