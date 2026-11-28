"use client";

import { useId, useState } from "react";

export type RadarSkill = {
  name: string;
  /** % correct now; null = not enough practice yet. */
  pct: number | null;
  /** % correct 30 days ago; null = no data then. */
  pctThen: number | null;
  total: number;
};

const SIZE = 340; // viewBox square
const C = SIZE / 2;
const R = 112; // radius of the 100% ring
const RINGS = [25, 50, 75, 100];
// Side labels ("Pronunciation", "not enough practice") reach past the circle.
const PAD = 56;

function point(i: number, n: number, pct: number) {
  // Start at 12 o'clock, go clockwise.
  const a = (Math.PI * 2 * i) / n - Math.PI / 2;
  const r = (R * pct) / 100;
  return { x: C + r * Math.cos(a), y: C + r * Math.sin(a), a };
}

function path(values: (number | null)[]) {
  const n = values.length;
  const pts = values
    .map((v, i) => (v === null ? null : point(i, n, v)))
    .filter((p): p is NonNullable<typeof p> => p !== null);
  if (pts.length < 2) return null;
  return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ") + " Z";
}

/**
 * Spider chart of a learner's skills in one subject: "now" (filled violet)
 * vs "30 days ago" (dashed teal outline). Skills without enough practice are
 * skipped in the shape and labelled, never drawn as 0%.
 * Falls back to bars for fewer than 3 skills (a radar needs 3 axes).
 */
export function SkillRadar({ skills, title }: { skills: RadarSkill[]; title: string }) {
  const [active, setActive] = useState<number | null>(null);
  const id = useId();
  const n = skills.length;
  const hasThen = skills.some((s) => s.pctThen !== null);

  if (n < 3) return <SkillBars skills={skills} title={title} />;

  const nowPath = path(skills.map((s) => s.pct));
  const thenPath = hasThen ? path(skills.map((s) => s.pctThen)) : null;
  const tip = active !== null ? skills[active] : null;
  const tipPt = active !== null ? point(active, n, 100) : null;

  return (
    <figure className="flex flex-col gap-3" aria-labelledby={`${id}-cap`}>
      <figcaption id={`${id}-cap`} className="sr-only">
        {title}: skill scores now{hasThen ? " compared with 30 days ago" : ""}. A table follows.
      </figcaption>

      <Legend hasThen={hasThen} />

      <div className="relative mx-auto w-full max-w-[440px]">
        <svg viewBox={`${-PAD} 0 ${SIZE + PAD * 2} ${SIZE}`} className="h-auto w-full overflow-visible" role="img" aria-label={`${title} skill chart`}>
          {/* Recessive grid */}
          {RINGS.map((r) => (
            <polygon
              key={r}
              points={skills.map((_, i) => { const p = point(i, n, r); return `${p.x},${p.y}`; }).join(" ")}
              fill="none"
              stroke="var(--color-line)"
              strokeWidth={1}
            />
          ))}
          {skills.map((_, i) => {
            const p = point(i, n, 100);
            return <line key={i} x1={C} y1={C} x2={p.x} y2={p.y} stroke="var(--color-line)" strokeWidth={1} />;
          })}
          {/* Ring labels sit on the bisector between the first two spokes, clear of axis labels */}
          {[50, 100].map((r) => {
            const a = Math.PI / n - Math.PI / 2;
            const rr = (R * r) / 100;
            return (
              <text key={r} x={C + rr * Math.cos(a) + 3} y={C + rr * Math.sin(a) - 3} className="fill-subtle font-mono text-[8px]">
                {r}%
              </text>
            );
          })}

          {/* Then: dashed outline, no fill (identity by colour AND dash) */}
          {thenPath && (
            <path d={thenPath} className="animate-fade" fill="none" stroke="var(--color-series-then)" strokeWidth={2} strokeDasharray="5 4" strokeLinejoin="round" />
          )}

          {/* Now: soft fill + 2px line + ringed markers */}
          <g className="radar-draw">
            {nowPath && (
              <path d={nowPath} fill="var(--color-series-now)" fillOpacity={0.18} stroke="var(--color-series-now)" strokeWidth={2} strokeLinejoin="round" />
            )}
            {skills.map((s, i) => {
              if (s.pct === null) return null;
              const p = point(i, n, s.pct);
              return (
                <circle key={i} cx={p.x} cy={p.y} r={active === i ? 5.5 : 4} fill="var(--color-series-now)" stroke="var(--color-surface)" strokeWidth={2} className="transition-[r] duration-150" />
              );
            })}
          </g>

          {/* Axis labels with the "now" value as a selective direct label */}
          {skills.map((s, i) => {
            const p = point(i, n, 100);
            const lx = C + (R + 22) * Math.cos(p.a);
            const ly = C + (R + 22) * Math.sin(p.a);
            const anchor = Math.abs(Math.cos(p.a)) < 0.3 ? "middle" : Math.cos(p.a) > 0 ? "start" : "end";
            return (
              <g key={i}>
                <text x={lx} y={ly - 2} textAnchor={anchor} className={`text-[11px] font-medium ${active === i ? "fill-fg" : "fill-muted"}`}>
                  {s.name}
                </text>
                <text x={lx} y={ly + 11} textAnchor={anchor} className="fill-subtle font-mono text-[10px]">
                  {s.pct === null ? "not enough practice" : `${s.pct}%`}
                </text>
              </g>
            );
          })}

          {/* Hit targets: one generous wedge per axis, keyboard-focusable */}
          {skills.map((s, i) => {
            const a0 = (Math.PI * 2 * (i - 0.5)) / n - Math.PI / 2;
            const a1 = (Math.PI * 2 * (i + 0.5)) / n - Math.PI / 2;
            const rr = R + 40;
            const d = `M${C},${C} L${C + rr * Math.cos(a0)},${C + rr * Math.sin(a0)} A${rr},${rr} 0 0 1 ${C + rr * Math.cos(a1)},${C + rr * Math.sin(a1)} Z`;
            return (
              <path
                key={i}
                d={d}
                fill="transparent"
                tabIndex={0}
                role="button"
                aria-label={`${s.name}: ${s.pct === null ? "not enough practice yet" : `${s.pct}% now`}${s.pctThen !== null ? `, ${s.pctThen}% 30 days ago` : ""}, ${s.total} answers`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-crosshair outline-none"
              />
            );
          })}
        </svg>

        {tip && tipPt && (
          <div
            role="tooltip"
            className="pointer-events-none absolute z-10 w-44 -translate-x-1/2 rounded-xl border border-line-strong bg-surface-3/95 p-3 text-xs shadow-[var(--shadow-card)] backdrop-blur"
            style={{ left: `${((tipPt.x + PAD) / (SIZE + PAD * 2)) * 100}%`, top: `${(Math.min(tipPt.y, C) / SIZE) * 100}%` }}
          >
            <p className="font-semibold text-fg">{tip.name}</p>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-muted">
              <dt className="flex items-center gap-1.5"><Swatch kind="now" />Now</dt>
              <dd className="text-right font-mono text-fg">{tip.pct === null ? "-" : `${tip.pct}%`}</dd>
              {hasThen && (
                <>
                  <dt className="flex items-center gap-1.5"><Swatch kind="then" />30 days ago</dt>
                  <dd className="text-right font-mono text-fg">{tip.pctThen === null ? "-" : `${tip.pctThen}%`}</dd>
                </>
              )}
              <dt>Answers</dt>
              <dd className="text-right font-mono text-fg">{tip.total}</dd>
            </dl>
          </div>
        )}
      </div>

      <SkillTable skills={skills} hasThen={hasThen} />
    </figure>
  );
}

function Swatch({ kind }: { kind: "now" | "then" }) {
  return kind === "now" ? (
    <span aria-hidden="true" className="inline-block h-2.5 w-2.5 rounded-full bg-series-now" />
  ) : (
    <svg aria-hidden="true" width="16" height="4" className="inline-block">
      <line x1="0" y1="2" x2="16" y2="2" stroke="var(--color-series-then)" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

function Legend({ hasThen }: { hasThen: boolean }) {
  return (
    <ul className="flex flex-wrap items-center gap-4 text-xs text-muted" aria-label="Legend">
      <li className="flex items-center gap-1.5"><Swatch kind="now" />Now</li>
      {hasThen ? (
        <li className="flex items-center gap-1.5"><Swatch kind="then" />30 days ago</li>
      ) : (
        <li className="text-subtle">Keep practising. Your 30-day comparison appears after a month.</li>
      )}
    </ul>
  );
}

function SkillTable({ skills, hasThen }: { skills: RadarSkill[]; hasThen: boolean }) {
  return (
    <details className="group text-sm">
      <summary className="cursor-pointer select-none text-xs text-muted hover:text-fg">Show as table</summary>
      <table className="mt-3 w-full text-left text-xs">
        <thead className="text-subtle">
          <tr>
            <th scope="col" className="py-1.5 font-medium">Skill</th>
            <th scope="col" className="py-1.5 text-right font-medium">Now</th>
            {hasThen && <th scope="col" className="py-1.5 text-right font-medium">30 days ago</th>}
            <th scope="col" className="py-1.5 text-right font-medium">Answers</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {skills.map((s) => (
            <tr key={s.name}>
              <th scope="row" className="py-1.5 font-medium text-fg">{s.name}</th>
              <td className="py-1.5 text-right font-mono text-fg">{s.pct === null ? "-" : `${s.pct}%`}</td>
              {hasThen && <td className="py-1.5 text-right font-mono text-muted">{s.pctThen === null ? "-" : `${s.pctThen}%`}</td>}
              <td className="py-1.5 text-right font-mono text-muted">{s.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}

/** < 3 skills: bars (a radar needs at least three axes to form a shape). */
function SkillBars({ skills, title }: { skills: RadarSkill[]; title: string }) {
  const hasThen = skills.some((s) => s.pctThen !== null);
  return (
    <figure className="flex flex-col gap-4">
      <figcaption className="sr-only">{title}: skill scores</figcaption>
      <Legend hasThen={hasThen} />
      <ul className="flex flex-col gap-4">
        {skills.map((s) => (
          <li key={s.name} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-fg">{s.name}</span>
              <span className="font-mono text-xs text-muted">
                {s.pct === null ? "not enough practice" : `${s.pct}%`}
                {s.pctThen !== null && <span className="text-subtle"> · was {s.pctThen}%</span>}
              </span>
            </div>
            <div className="relative h-2 rounded-full bg-surface-3">
              {s.pct !== null && <div className="h-full rounded-full bg-series-now" style={{ width: `${s.pct}%` }} />}
              {s.pctThen !== null && (
                <div aria-hidden="true" className="absolute -top-1 h-4 w-0.5 rounded bg-series-then" style={{ left: `calc(${s.pctThen}% - 1px)` }} />
              )}
            </div>
          </li>
        ))}
      </ul>
    </figure>
  );
}
