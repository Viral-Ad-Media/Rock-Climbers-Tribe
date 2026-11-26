/**
 * Decorative topographic contour lines, the visual signature of the blog.
 * Pure SVG, no image request. Colour comes from `currentColor`.
 */
const RINGS = [1, 0.86, 0.72, 0.58, 0.45, 0.33, 0.22, 0.12];

function Peak({ cx, cy, r, rotate = 0 }: { cx: number; cy: number; r: number; rotate?: number }) {
  return (
    <g transform={`translate(${cx} ${cy}) rotate(${rotate})`}>
      {RINGS.map((s, i) => (
        <path
          key={i}
          transform={`scale(${s * r})`}
          vectorEffect="non-scaling-stroke"
          d="M-1 0 C-1 -0.55 -0.62 -0.98 -0.08 -0.94 C0.42 -0.9 0.66 -0.62 0.9 -0.36 C1.12 -0.1 1.02 0.38 0.7 0.62 C0.36 0.88 -0.12 0.98 -0.5 0.8 C-0.86 0.62 -1 0.34 -1 0 Z"
        />
      ))}
    </g>
  );
}

export function Topo({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none ${className}`}
      viewBox="0 0 1200 600"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
    >
      <Peak cx={980} cy={120} r={360} rotate={-12} />
      <Peak cx={160} cy={560} r={300} rotate={28} />
      <Peak cx={620} cy={420} r={150} rotate={70} />
    </svg>
  );
}

/** A small carabiner-ish arrow used on "read" links. */
export function ArrowRight({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M4 10h11m-4-4 4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ClockIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 20 20" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2" strokeLinecap="round" />
    </svg>
  );
}
