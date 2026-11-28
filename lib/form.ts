/** Small FormData readers shared by server actions. */
export function str(fd: FormData, key: string): string {
  return fd.get(key)?.toString().trim() ?? "";
}

export function int(fd: FormData, key: string, fallback = 0): number {
  const n = Number.parseInt(fd.get(key)?.toString() ?? "", 10);
  return Number.isFinite(n) ? n : fallback;
}

export function bool(fd: FormData, key: string): boolean {
  const v = fd.get(key);
  return v === "on" || v === "true" || v === "1";
}

/** Subject + skill tags posted by <SubjectSkillPicker />. */
export function subjectAndSkills(fd: FormData): { subjectId: string; skillIds: string[] } {
  return {
    subjectId: str(fd, "subjectId"),
    skillIds: fd.getAll("skillIds").map((v) => v.toString()).filter(Boolean),
  };
}
