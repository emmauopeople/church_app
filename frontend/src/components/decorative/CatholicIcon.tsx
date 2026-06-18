export type CatholicIconName =
  | 'church'
  | 'cross'
  | 'chalice'
  | 'book'
  | 'certificate'
  | 'people'
  | 'water'
  | 'rings'
  | 'dove'
  | 'document'
  | 'settings'
  | 'dashboard'
  | 'search'
  | 'save'
  | 'print'
  | 'download'
  | 'plus';

type CatholicIconProps = {
  name: CatholicIconName;
  className?: string;
};

const sharedProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function CatholicIcon({ name, className = 'h-5 w-5' }: CatholicIconProps) {
  switch (name) {
    case 'church':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M12 2v4" />
          <path d="M10 4h4" />
          <path d="M4 21V10l8-6 8 6v11" />
          <path d="M9 21v-7h6v7" />
          <path d="M8 10h8" />
        </svg>
      );
    case 'cross':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M12 3v18" />
          <path d="M6 9h12" />
        </svg>
      );
    case 'chalice':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
          <path d="M12 14v5" />
          <path d="M8 20h8" />
          <path d="M12 6v4" />
          <path d="M10 8h4" />
        </svg>
      );
    case 'book':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M5 4h7a4 4 0 0 1 4 4v12a4 4 0 0 0-4-4H5V4Z" />
          <path d="M19 4h-3a4 4 0 0 0-4 4" />
          <path d="M12 8v12" />
        </svg>
      );
    case 'certificate':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M6 3h10l4 4v14H6V3Z" />
          <path d="M16 3v4h4" />
          <path d="M12 10v6" />
          <path d="M9 13h6" />
          <path d="M9 18h6" />
        </svg>
      );
    case 'people':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M16 11a4 4 0 1 0-8 0" />
          <path d="M4 21a8 8 0 0 1 16 0" />
          <path d="M19 8a3 3 0 0 1 2 5" />
          <path d="M3 13a3 3 0 0 1 2-5" />
        </svg>
      );
    case 'water':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z" />
          <path d="M9.5 15.5A3 3 0 0 0 12 17" />
        </svg>
      );
    case 'rings':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <circle cx="9" cy="14" r="5" />
          <circle cx="15" cy="14" r="5" />
          <path d="M12 5l2 3h-4l2-3Z" />
        </svg>
      );
    case 'dove':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M4 12c4-1 6-4 8-8 2 5 5 7 9 8-5 2-8 5-9 9-1-4-4-7-8-9Z" />
          <path d="M12 4v17" />
        </svg>
      );
    case 'document':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M7 3h7l4 4v14H7V3Z" />
          <path d="M14 3v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
        </svg>
      );
    case 'settings':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M12 2v3M12 19v3M4.9 4.9 7 7M17 17l2.1 2.1M2 12h3M19 12h3M4.9 19.1 7 17M17 7l2.1-2.1" />
        </svg>
      );
    case 'dashboard':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M4 13a8 8 0 0 1 16 0" />
          <path d="M12 13l4-5" />
          <path d="M5 20h14" />
          <path d="M12 3v3" />
        </svg>
      );
    case 'search':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
      );
    case 'save':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M5 3h12l2 2v16H5V3Z" />
          <path d="M8 3v6h8" />
          <path d="M8 21v-7h8v7" />
        </svg>
      );
    case 'print':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M7 8V3h10v5" />
          <path d="M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" />
          <path d="M7 14h10v7H7z" />
        </svg>
      );
    case 'download':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M12 3v12" />
          <path d="m8 11 4 4 4-4" />
          <path d="M5 21h14" />
        </svg>
      );
    case 'plus':
      return (
        <svg viewBox="0 0 24 24" className={className} aria-hidden="true" {...sharedProps}>
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      );
    default:
      return null;
  }
}
