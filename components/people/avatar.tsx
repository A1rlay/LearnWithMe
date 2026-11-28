/** Initials avatar; hue is stable per username so people are recognisable. */
export function Avatar({ name, username, size = 40 }: { name: string; username: string; size?: number }) {
  const initials =
    name
      .split(/\s+/)
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || username.slice(0, 2).toUpperCase();
  let h = 0;
  for (const ch of username) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return (
    <span
      aria-hidden="true"
      className="inline-flex shrink-0 items-center justify-center rounded-full font-semibold"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.38,
        background: `hsl(${h} 45% 24%)`,
        color: `hsl(${h} 80% 82%)`,
        boxShadow: `0 0 0 1px hsl(${h} 50% 40% / 0.5)`,
      }}
    >
      {initials}
    </span>
  );
}
