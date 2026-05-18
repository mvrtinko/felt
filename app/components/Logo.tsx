export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "sm"
      ? "text-2xl"
      : size === "lg"
        ? "text-5xl"
        : "text-3xl";
  return (
    <span
      className={`font-display italic text-cream ${cls} leading-none select-none`}
    >
      felt.
    </span>
  );
}
