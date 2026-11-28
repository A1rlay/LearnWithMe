"use client";

import { useState } from "react";
import { useFormStatus } from "react-dom";

import { TagInput } from "@/components/ui/tag-input";
import { TimezoneInput } from "@/components/ui/timezone-input";
import { finishWelcomeAction, skipWelcomeAction } from "./actions";

type Subject = { id: string; name: string; description: string | null; activities: number; learners: number };

const STEPS = ["Subjects", "You", "Buddies"] as const;
const GOALS = [2, 3, 5, 7];

export function WelcomeFlow({ name, subjects }: { name: string; subjects: Subject[] }) {
  const [step, setStep] = useState(0);
  const [picked, setPicked] = useState<string[]>([]);
  const last = step === STEPS.length - 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <ol className="flex items-center gap-2" aria-label="Progress">
          {STEPS.map((s, i) => (
            <li key={s} className="flex flex-1 flex-col gap-1.5" aria-current={i === step ? "step" : undefined}>
              <span className={`h-1 rounded-full transition-colors ${i <= step ? "bg-accent-text" : "bg-surface-3"}`} />
              <span className={`text-[11px] ${i === step ? "text-fg" : "text-subtle"}`}>{s}</span>
            </li>
          ))}
        </ol>
        <p className="eyebrow mt-4">Welcome, {name}</p>
      </div>

      <form action={finishWelcomeAction} className="flex flex-col gap-8">
        <TimezoneInput />
        {/* Step 1. Hidden steps stay in the DOM so their fields are posted. */}
        <section hidden={step !== 0} aria-labelledby="w1" className="flex flex-col gap-5">
          <div>
            <h1 id="w1" className="font-display text-4xl leading-tight text-fg sm:text-5xl">What do you want to learn?</h1>
            <p className="mt-2 text-muted">Pick one or more. You can change this any time.</p>
          </div>
          {subjects.length === 0 ? (
            <p className="card p-6 text-sm text-muted">No subjects are open yet. Check back soon.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subjects.map((s) => {
                const on = picked.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className={`card card-interactive flex cursor-pointer flex-col gap-1.5 p-5 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-text ${on ? "border-accent-text/60 bg-accent/10" : ""}`}
                  >
                    <input
                      type="checkbox"
                      name="subjectIds"
                      value={s.id}
                      checked={on}
                      onChange={() => setPicked(on ? picked.filter((x) => x !== s.id) : [...picked, s.id])}
                      className="sr-only"
                    />
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-display text-2xl text-fg">{s.name}</span>
                      <span
                        aria-hidden="true"
                        className={`grid h-5 w-5 place-items-center rounded-full border text-[11px] ${on ? "border-accent-text bg-accent text-on-accent" : "border-line-strong"}`}
                      >
                        {on ? "✓" : ""}
                      </span>
                    </span>
                    {s.description && <span className="text-sm text-muted">{s.description}</span>}
                    <span className="font-mono text-xs text-subtle">
                      {s.activities} activities · {s.learners} {s.learners === 1 ? "learner" : "learners"}
                    </span>
                  </label>
                );
              })}
            </div>
          )}
        </section>

        <section hidden={step !== 1} aria-labelledby="w2" className="flex flex-col gap-6">
          <div>
            <h1 id="w2" className="font-display text-4xl leading-tight text-fg sm:text-5xl">A bit about you</h1>
            <p className="mt-2 text-muted">Shared interests help us match you with study buddies.</p>
          </div>
          <TagInput name="interests" label="Interests" placeholder="Type one and press Enter, e.g. music" hint="Optional." />
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-medium text-fg">How many activities a week?</legend>
            <div className="flex flex-wrap gap-2">
              {GOALS.map((g) => (
                <label key={g} className="toggle-chip toggle-chip-lg">
                  <input type="radio" name="weeklyGoal" value={g} defaultChecked={g === 3} className="sr-only" />
                  {g} a week
                </label>
              ))}
            </div>
            <span className="text-xs text-subtle">Small and steady beats big and rare. Your buddies see your progress toward it.</span>
          </fieldset>
        </section>

        <section hidden={step !== 2} aria-labelledby="w3" className="flex flex-col gap-5">
          <div>
            <h1 id="w3" className="font-display text-4xl leading-tight text-fg sm:text-5xl">Study with someone?</h1>
            <p className="mt-2 text-muted">
              People who study with a buddy keep going for longer. Buddies see your name, interests, subjects
              and weekly progress. Never your email.
            </p>
          </div>
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-accent-text/30 bg-accent/10 p-4">
            <input type="checkbox" name="lookingForBuddies" defaultChecked className="mt-0.5 h-4 w-4 accent-[var(--color-accent)]" />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-fg">Show me to study buddies</span>
              <span className="text-xs text-muted">You choose who to accept, and you can turn this off on your Me page.</span>
            </span>
          </label>
        </section>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
          <button type="submit" formAction={skipWelcomeAction} formNoValidate className="text-sm text-subtle hover:text-fg">
            Skip for now
          </button>
          <div className="flex gap-2">
            {step > 0 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">
                Back
              </button>
            )}
            {last ? (
              <Finish label={picked.length > 0 ? "Start my first activity" : "Finish"} />
            ) : (
              <button type="button" onClick={() => setStep(step + 1)} className="btn btn-primary">
                {step === 0 && picked.length === 0 ? "Decide later" : "Next"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

function Finish({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-primary">
      {pending ? "Setting up…" : label}
    </button>
  );
}
