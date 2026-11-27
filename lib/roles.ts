/** UI names for roles. The DB keeps TEACHER; people see "Expert". */
export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Admin",
  TEACHER: "Expert",
  STUDENT: "Learner",
};

export const ROLE_BADGE: Record<string, string> = {
  ADMIN: "border-accent-text/30 bg-accent/20 text-accent-text",
  TEACHER: "border-series-then/40 bg-series-then/15 text-series-then",
  STUDENT: "border-line-strong bg-surface-2 text-muted",
};
