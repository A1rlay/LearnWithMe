"use client";

import { useEffect, useRef, useState } from "react";

type Day = { day: string; n: number };

const CELL = 11;
const GAP = 3;
const WEEKS = 53;
// Answers per day → 5 steps of one hue (sequential: never a rainbow).
const STEPS = [0, 1, 5, 10, 20];
const FILL = [
  "var(--color-surface-3)",
  "color-mix(in oklab, var(--color-series-now) 30%, var(--color-surface-3))",
  "color-mix(in oklab, var(--color-series-now) 55%, var(--color-surface-3))",
  "color-mix(in oklab, var(--color-series-now) 80%, var(--color-surface-3))",
  "var(--color-series-now)",
];
const level = (n: number) => STEPS.reduce((lv, s, i) => (n >= s ? i : lv), 0);

const addDays = (iso: string, d: number) => {
  const t = new Date(`${iso}T00:00:00Z`);
  t.setUTCDate(t.getUTCDate() + d);
  return t.toISOString().slice(0, 10);
};
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, { timeZone: "UTC", ...opts });

/**
 * GitHub-style practice calendar: one cell per day for the last 53 weeks,
 * columns are weeks starting Monday. Hover shows the day; a monthly table
 * follows for keyboard and screen-reader users.
 */
export function PracticeHeatmap({ days, today }: { days: Day[]; today: string }) {
  const counts = new Map(days.map((d) => [d.day, d.n]));
  const scroller = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);

  useEffect(() => {
    // Most recent weeks first on narrow screens.
    if (scroller.current) scroller.current.scrollLeft = scroller.current.scrollWidth;
  }, []);

  // Monday of the current week, then back 52 weeks.
  const dow = (new Date(`${today}T00:00:00Z`).getUTCDay() + 6) % 7; // 0 = Monday
  const start = addDays(today, -dow - (WEEKS - 1) * 7);

  const cells: { day: string; n: number; x: number; y: number }[] = [];
  const months: { x: number; label: string }[] = [];
  for (let w = 0; w < WEEKS; w++) {
    for (let d = 0; d < 7; d++) {
      const day = addDays(start, w * 7 + d);
      if (day > today) continue;
      cells.push({ day, n: counts.get(day) ?? 0, x: w * (CELL + GAP), y: d * (CELL + GAP) });
      if (d === 0 && day.slice(8) <= "07" && w > 0) months.push({ x: w * (CELL + GAP), label: fmt(day, { month: "short" }) });
    }
  }

  const total = days.reduce((s, d) => s + d.n, 0);
  const width = WEEKS * (CELL + GAP);
  const height = 7 * (CELL + GAP);
  const LEFT = 28;
  const TOP = 16;

  const byMonth = new Map<string, number>();
  for (const d of days) byMonth.set(d.day.slice(0, 7), (byMonth.get(d.day.slice(0, 7)) ?? 0) + d.n);

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="text-sm text-muted">
        <span className="font-semibold text-fg">{total.toLocaleString()}</span> {total === 1 ? "answer" : "answers"} in the last year
      </figcaption>
      <div ref={scroller} className="relative overflow-x-auto pb-1" onMouseLeave={() => setTip(null)}>
        <svg
          width={LEFT + width}
          height={TOP + height}
          role="img"
          aria-label={`Practice calendar: ${total} answers in the last year. A monthly table follows.`}
          className="block"
        >
          {months.map((m) => (
            <text key={m.x} x={LEFT + m.x} y={10} className="fill-subtle text-[10px]">{m.label}</text>
          ))}
          {[["Mon", 0], ["Wed", 2], ["Fri", 4]].map(([l, d]) => (
            <text key={l} x={0} y={TOP + (d as number) * (CELL + GAP) + 9} className="fill-subtle text-[10px]">{l}</text>
          ))}
          {cells.map((c) => (
            <rect
              key={c.day}
              x={LEFT + c.x}
              y={TOP + c.y}
              width={CELL}
              height={CELL}
              rx={2.5}
              fill={FILL[level(c.n)]}
              stroke={c.day === today ? "var(--color-fg)" : "none"}
              strokeOpacity={0.5}
              onMouseEnter={() =>
                setTip({
                  x: LEFT + c.x + CELL / 2,
                  y: TOP + c.y,
                  text: `${c.n === 0 ? "No" : c.n} ${c.n === 1 ? "answer" : "answers"} on ${fmt(c.day, { weekday: "short", month: "short", day: "numeric" })}`,
                })
              }
            />
          ))}
        </svg>
        {tip && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-line-strong bg-surface-3 px-2.5 py-1.5 text-xs text-fg shadow-[var(--shadow-card)]"
            style={{ left: tip.x - (scroller.current?.scrollLeft ?? 0), top: tip.y - 6 }}
          >
            {tip.text}
          </div>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <details className="text-xs">
          <summary className="cursor-pointer select-none text-muted hover:text-fg">Show as table</summary>
          <table className="mt-2 text-left">
            <thead className="text-subtle">
              <tr>
                <th scope="col" className="pr-6 font-medium">Month</th>
                <th scope="col" className="text-right font-medium">Answers</th>
              </tr>
            </thead>
            <tbody>
              {[...byMonth.entries()].map(([m, n]) => (
                <tr key={m}>
                  <th scope="row" className="pr-6 font-normal text-fg">{fmt(`${m}-15`, { month: "long", year: "numeric" })}</th>
                  <td className="text-right font-mono text-fg">{n}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
        <div className="flex items-center gap-1 text-[11px] text-subtle" aria-hidden="true">
          Less
          {FILL.map((f) => <span key={f} className="inline-block h-[11px] w-[11px] rounded-[2.5px]" style={{ background: f }} />)}
          More
        </div>
      </div>
    </figure>
  );
}
