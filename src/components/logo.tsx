export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-granite-900" />
      <path d="M5 25 L13 11 L17 17 L20 13 L27 25 Z" className="fill-moss-500" />
      <path d="M13 11 L15.5 15.2 L13.6 14 L11.4 15.6 Z" className="fill-chalk" />
    </svg>
  );
}
