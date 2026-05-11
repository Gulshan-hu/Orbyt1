export function Logo({ height = 32, className = "" }: { height?: number; className?: string }) {
  return (
    <svg viewBox="0 0 120 32" fill="none" style={{ height }} className={className} aria-label="Orbyt">
      <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="2"/>
      <circle cx="16" cy="16" r="3" fill="currentColor"/>
      <ellipse cx="16" cy="16" rx="14" ry="5" stroke="currentColor" strokeWidth="1" transform="rotate(-25 16 16)" opacity="0.6"/>
      <text x="38" y="22" fontFamily="Unbounded, sans-serif" fontSize="18" fontWeight="700" fill="currentColor">Orbyt</text>
    </svg>
  );
}
