import type { AvatarColor } from "@/lib/types";

const COLOR_BG: Record<AvatarColor, string> = {
  coral: "bg-coral text-ink",
  gold: "bg-gold text-ink",
  green: "bg-chip-green text-cream",
  blue: "bg-chip-blue text-cream",
  purple: "bg-[#7d5fbf] text-cream",
};

const SIZE_MAP = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
};

export function PlayerAvatar({
  name,
  color,
  size = "md",
  dim = false,
}: {
  name: string;
  color: AvatarColor;
  size?: keyof typeof SIZE_MAP;
  dim?: boolean;
}) {
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className={`${COLOR_BG[color]} ${SIZE_MAP[size]} ${dim ? "opacity-50" : ""} rounded-full grid place-items-center font-mono font-semibold tracking-tight shrink-0`}
      aria-hidden
    >
      {initials || "?"}
    </div>
  );
}
