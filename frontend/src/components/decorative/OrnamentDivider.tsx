type OrnamentDividerProps = {
  className?: string;
};

export function OrnamentDivider({ className = '' }: OrnamentDividerProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`} aria-hidden="true">
      <span className="h-px w-20 bg-current opacity-70" />
      <svg
        viewBox="0 0 32 32"
        className="h-5 w-5 shrink-0"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M16 3c2.8 4.2 4.1 7.7 4.1 10.4 0 2.5-1.4 4.4-4.1 5.8-2.7-1.4-4.1-3.3-4.1-5.8C11.9 10.7 13.2 7.2 16 3Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 19.2V29M7 16c3.5.6 6.5 2.8 9 6.6M25 16c-3.5.6-6.5 2.8-9 6.6"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <span className="h-px w-20 bg-current opacity-70" />
    </div>
  );
}
