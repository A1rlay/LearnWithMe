import type { ActivityType } from "@prisma/client";

import { ACTIVITY_META, ACTIVITY_TYPES } from "@/lib/activity-types";

/** Posts repeated `activityTypes` values; styled like the other chip toggles. */
export function ActivityTypeChecks({ defaults }: { defaults: ActivityType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVITY_TYPES.map((t) => (
        <label
          key={t}
          className="cursor-pointer rounded-full border border-line-strong px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:text-fg has-[:checked]:border-accent-text/60 has-[:checked]:bg-accent/25 has-[:checked]:text-fg has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent-text"
        >
          <input type="checkbox" name="activityTypes" value={t} defaultChecked={defaults.includes(t)} className="sr-only" />
          {ACTIVITY_META[t].label}
        </label>
      ))}
    </div>
  );
}
