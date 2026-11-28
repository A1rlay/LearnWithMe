import type { ActivityType } from "@prisma/client";

import { ACTIVITY_META, ACTIVITY_TYPES } from "@/lib/activity-types";

/** Posts repeated `activityTypes` values; styled like the other chip toggles. */
export function ActivityTypeChecks({ defaults }: { defaults: ActivityType[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {ACTIVITY_TYPES.map((t) => (
        <label
          key={t}
          className="toggle-chip"
        >
          <input type="checkbox" name="activityTypes" value={t} defaultChecked={defaults.includes(t)} className="sr-only" />
          {ACTIVITY_META[t].label}
        </label>
      ))}
    </div>
  );
}
