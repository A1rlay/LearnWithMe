"use client";

import { useEffect, useState } from "react";

/** Posts the browser's timezone so streaks and the practice calendar follow the learner's own days. */
export function TimezoneInput() {
  const [tz, setTz] = useState("");
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);
  return <input type="hidden" name="timezone" value={tz} />;
}
