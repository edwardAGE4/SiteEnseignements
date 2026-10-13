import type { ResourceType } from "@/generated/prisma/enums";

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export function HeadphonesIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </svg>
  );
}

export function VideoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <rect x="2.5" y="5" width="14" height="14" rx="2.5" />
      <path d="m16.5 10 5-3v10l-5-3" />
    </svg>
  );
}

export function BookIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M4 19.5V5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2Zm0 0A2 2 0 0 0 6 22h13" />
      <path d="M8 7h7M8 11h5" />
    </svg>
  );
}

export function FileIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 2.5H7a2 2 0 0 0-2 2v15a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7.5Z" />
      <path d="M14 2.5v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M8 5.14v13.72a1 1 0 0 0 1.52.85l11-6.86a1 1 0 0 0 0-1.7l-11-6.86A1 1 0 0 0 8 5.14Z" />
    </svg>
  );
}

export function PauseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
    </svg>
  );
}

export function VolumeIcon({ className, muted }: IconProps & { muted?: boolean }) {
  return (
    <svg {...base} className={className}>
      <path d="M11 5 6 9H3v6h3l5 4z" />
      {muted ? <path d="m22 9-6 6M16 9l6 6" /> : <path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" />}
    </svg>
  );
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3v12m0 0-5-5m5 5 5-5M4 20h16" />
    </svg>
  );
}

export function ExternalIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
  );
}

export function SpotifyIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm4.59 14.4a.62.62 0 0 1-.86.2c-2.36-1.44-5.32-1.77-8.82-.97a.62.62 0 1 1-.28-1.21c3.83-.87 7.12-.5 9.76 1.12.3.18.4.57.2.86Zm1.22-2.71a.78.78 0 0 1-1.07.26c-2.7-1.66-6.82-2.14-10.02-1.17a.78.78 0 1 1-.45-1.49c3.66-1.1 8.2-.57 11.28 1.32.37.23.49.72.26 1.08Zm.11-2.83C14.9 9 8.94 8.8 5.5 9.86a.93.93 0 1 1-.55-1.78c3.95-1.2 10.5-.97 14.14 1.2a.93.93 0 0 1-.97 1.58Z" />
    </svg>
  );
}

const TYPE_ICONS: Record<ResourceType, (props: IconProps) => React.JSX.Element> = {
  AUDIO: HeadphonesIcon,
  VIDEO: VideoIcon,
  BOOK: BookIcon,
  FILE: FileIcon,
};

export function TypeIcon({ type, className }: IconProps & { type: ResourceType }) {
  const Icon = TYPE_ICONS[type];
  return <Icon className={className} />;
}
