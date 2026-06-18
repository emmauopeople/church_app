type CurvedLoginDividerProps = {
  className?: string;
};

export function CurvedLoginDivider({ className = '' }: CurvedLoginDividerProps) {
  return (
    <div
      className={`pointer-events-none absolute left-[56%] top-0 z-20 hidden h-full -translate-x-1/2 lg:block ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 120 1000"
        preserveAspectRatio="none"
        className="h-full w-28 drop-shadow-[0_0_18px_rgba(15,61,46,0.18)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M46 0 C92 260 92 740 46 1000 L120 1000 L120 0 Z"
          fill="#FFF9EE"
        />
        <path
          d="M48 0 C94 260 94 740 48 1000"
          stroke="#D4AF37"
          strokeWidth="4"
          fill="none"
          opacity="0.75"
        />
        <path
          d="M36 0 C82 260 82 740 36 1000"
          stroke="#F1D98B"
          strokeWidth="1.5"
          fill="none"
          opacity="0.45"
        />
      </svg>
    </div>
  );
}
