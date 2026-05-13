interface DoclityLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

const ICON_SIZE = { sm: 28, md: 36, lg: 64 } as const;
const TEXT_SIZE = { sm: 15, md: 20, lg: 32 } as const;
const GAP      = { sm: 7,  md: 9,  lg: 14 } as const;

export default function DoclityLogo({ size = 'md', showText = true }: DoclityLogoProps) {
  const px = ICON_SIZE[size];

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: GAP[size] }}>
      <svg width={px} height={px} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Fondo redondeado */}
        <rect width="24" height="24" rx="5.5" fill="#2563EB" />
        {/* Cuerpo del documento */}
        <path d="M5.5 4 L5.5 19 L14.5 19 L14.5 8.5 L10.5 4 Z" fill="white" />
        {/* Esquina doblada */}
        <path d="M10.5 4 L10.5 8.5 L14.5 8.5 Z" fill="#DBEAFE" />
        {/* Líneas de texto */}
        <line x1="7" y1="11"   x2="13"   y2="11"   stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
        <line x1="7" y1="13.5" x2="13"   y2="13.5" stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
        <line x1="7" y1="16"   x2="10.5" y2="16"   stroke="#94A3B8" strokeWidth="1" strokeLinecap="round" />
        {/* Círculo check */}
        <circle cx="16.5" cy="17.5" r="4" fill="#10B981" stroke="#2563EB" strokeWidth="1" />
        <path d="M14.5 17.5 L16 19 L18.5 15.5" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {showText && (
        <span style={{ fontSize: TEXT_SIZE[size], fontWeight: 700, letterSpacing: -0.3, color: 'inherit' }}>
          Doclity
        </span>
      )}
    </div>
  );
}
