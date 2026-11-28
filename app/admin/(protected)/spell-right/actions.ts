"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireEditorOf, requireSubjectEditor } from "@/lib/auth";
import { int, pedagogy, str, subjectAndSkills } from "@/lib/form";
import {
  SpellRightMode,
  adminCreateSpellRightSet,
  adminCreateSpellRightWord,
  adminDeleteSpellRightSet,
  adminDeleteSpellRightWord,
  adminUpdateSpellRightSet,
  adminUpdateSpellRightWord,
} from "@/server/data/spell-right";
import { assertSubjectOffers, setActivitySubjectAndSkills } from "@/server/data/subjects";

function revalidateSR(setId?: string) {
  revalidatePath("/admin/spell-right");
  if (setId) revalidatePath(`/admin/spell-right/${setId}/words`);
  revalidatePath("/", "layout");
}

// ─── Sets ─────────────────────────────────────────────────────────────────────

export async function createSpellRightSetAction(formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  await requireSubjectEditor(subjectId);
  await assertSubjectOffers(subjectId, "SPELLING");
  const mode = formData.get("mode")?.toString() as SpellRightMode;
  if (!Object.values(SpellRightMode).includes(mode)) throw new Error("Unknown mode.");
  const set = await adminCreateSpellRightSet({
    title: str(formData, "title"),
    ...pedagogy(formData),
    description: str(formData, "description"),
    mode,
    order: int(formData, "order"),
    subjectId,
  });
  await setActivitySubjectAndSkills("spellSet", set.id, subjectId, skillIds);
  revalidateSR();
  redirect(`/admin/spell-right/${set.id}/words`);
}

export async function updateSpellRightSetAction(id: string, formData: FormData) {
  const { subjectId, skillIds } = subjectAndSkills(formData);
  await requireEditorOf({ kind: "spellSet", id });
  await requireSubjectEditor(subjectId);
  await adminUpdateSpellRightSet(id, {
    title: str(formData, "title"),
    ...pedagogy(formData),
    description: str(formData, "description"),
    order: int(formData, "order"),
  });
  await setActivitySubjectAndSkills("spellSet", id, subjectId, skillIds);
  revalidateSR(id);
  redirect(`/admin/spell-right?subject=${subjectId}`);
}

export async function deleteSpellRightSetAction(id: string) {
  await requireEditorOf({ kind: "spellSet", id });
  await adminDeleteSpellRightSet(id);
  revalidateSR();
  redirect("/admin/spell-right");
}

// ─── Words ────────────────────────────────────────────────────────────────────

function readWord(formData: FormData) {
  return {
    word: str(formData, "word"),
    correctAnswer: str(formData, "correctAnswer") || null,
    explanation: str(formData, "explanation") || null,
  };
}

export async function createSpellRightWordAction(setId: string, order: number, formData: FormData) {
  await requireEditorOf({ kind: "spellSet", id: setId });
  await adminCreateSpellRightWord({ setId, order, ...readWord(formData) });
  revalidateSR(setId);
  redirect(`/admin/spell-right/${setId}/words`);
}

export async function updateSpellRightWordAction(_setId: string, wordId: string, formData: FormData) {
  await requireEditorOf({ kind: "spellWord", id: wordId });
  const w = await adminUpdateSpellRightWord(wordId, readWord(formData));
  revalidateSR(w.setId);
  redirect(`/admin/spell-right/${w.setId}/words`);
}

export async function deleteSpellRightWordAction(_setId: string, wordId: string) {
  await requireEditorOf({ kind: "spellWord", id: wordId });
  const w = await adminDeleteSpellRightWord(wordId);
  revalidateSR(w.setId);
}
