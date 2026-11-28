"use client";

import { useEffect, useRef } from "react";

/** Posts the browser's timezone so streaks and the practice calendar follow the learner's own days. */
export function TimezoneInput() {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.value = Intl.DateTimeFormat().resolvedOptions().timeZone;
  }, []);
  return <input ref={ref} type="hidden" name="timezone" defaultValue="" />;
}
