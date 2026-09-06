import React from 'react';

export type IconWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700;

export interface IconProps {
  /** Material Symbols (Outlined) glyph name, e.g. "flight_takeoff". */
  name: string;
  /** Pixel box + optical size. Defaults to 20. */
  size?: number;
  /** Solid fill variant (uses the font's FILL axis). */
  fill?: boolean;
  weight?: IconWeight;
  grade?: number;
  className?: string;
  /** When provided the icon is exposed to AT; otherwise it is aria-hidden. */
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Thin wrapper over the Material Symbols Outlined variable font.
 * Replaces lucide-react across the console — one coherent family with
 * FILL / weight / grade / optical-size axes and currentColor theming.
 */
export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  fill = false,
  weight = 400,
  grade = 0,
  className = '',
  title,
  style,
}) => (
  <span
    className={`material-symbols-outlined ${className}`}
    data-fill={fill ? '1' : '0'}
    aria-hidden={title ? undefined : true}
    role={title ? 'img' : undefined}
    aria-label={title}
    style={{
      fontSize: size,
      width: size,
      height: size,
      fontVariationSettings: `'FILL' ${fill ? 1 : 0}, 'wght' ${weight}, 'GRAD' ${grade}, 'opsz' ${Math.min(48, Math.max(20, size))}`,
      ...style,
    }}
  >
    {name}
  </span>
);
