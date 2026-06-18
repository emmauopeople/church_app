type CurvedLoginDividerProps = {
  className?: string;
};

export function CurvedLoginDivider({ className = '' }: CurvedLoginDividerProps) {
  return (
    <div
      className={`pointer-events-none absolute left-[56%] top-0 z-30 hidden h-full -translate-x-1/2 lg:block ${className}`}
      aria-hidden="true"
    >
      <div className="h-full w-[3px] bg-[#D4AF37]" />
      <div className="absolute left-[5px] top-0 h-full w-px bg-white/40" />
      <div className="absolute -left-[5px] top-0 h-full w-px bg-[#0F3D2E]/40" />
    </div>
  );
}
