type CurvedLoginDividerProps = {
  className?: string;
};

export function CurvedLoginDivider({ className = '' }: CurvedLoginDividerProps) {
  return (
    <div
      className={`pointer-events-none absolute left-[56%] top-0 z-30 hidden h-full -translate-x-1/2 lg:block ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 80 1000"
        preserveAspectRatio="none"
        className="h-full w-16"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M40 0 C72 250 72 750 40 1000"
          stroke="rgba(15,61,46,0.32)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M40 0 C72 250 72 750 40 1000"
          stroke="#D4AF37"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M31 0 C63 250 63 750 31 1000"
          stroke="#F1D98B"
          strokeWidth="1.3"
          fill="none"
          opacity="0.72"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
