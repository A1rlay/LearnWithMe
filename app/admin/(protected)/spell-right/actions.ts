"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth";
import {
  SpellRightMode,
  adminCreateSpellRightSet,
  adminDeleteSpellRightSet,
  adminUpdateSpellRightSet,
  adminCreateSpellRightWord,
  adminDeleteSpellRightWord,
  adminUpdateSpellRightWord,
} from "@/server/data/spell-right";

// ─── Sets ─────────────────────────────────────────────────────────────────────

export async function createSpellRightSetAction(formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const mode = formData.get("mode")?.toString() as SpellRightMode;
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);
  const set = await adminCreateSpellRightSet({ title, description, mode, order });
  revalidatePath("/admin/spell-right");
  revalidatePath("/spell-right");
  redirect(`/admin/spell-right/${set.id}/words`);
}

export async function updateSpellRightSetAction(id: string, formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const title = formData.get("title")?.toString().trim() ?? "";
  const description = formData.get("description")?.toString().trim() ?? "";
  const order = parseInt(formData.get("order")?.toString() ?? "0", 10);
  await adminUpdateSpellRightSet(id, { title, description, order });
  revalidatePath("/admin/spell-right");
  revalidatePath("/spell-right");
  redirect("/admin/spell-right");
}

export async function deleteSpellRightSetAction(id: string) {
  await requireRole("ADMIN", "TEACHER");
  await adminDeleteSpellRightSet(id);
  revalidatePath("/admin/spell-right");
  revalidatePath("/spell-right");
  redirect("/admin/spell-right");
}

// ─── Words ────────────────────────────────────────────────────────────────────

export async function createSpellRightWordAction(setId: string, order: number, formData: FormData) {
  await requireRole("ADMIN", "TEACHER");
  const word = formData.get("word")?.toString().trim() ?? "";
  const correctAnswer = formData.get("correctAnswer")?.toString().trim() || null;
  const explanation = formData.get("explanation")?.toString().trim() || null;
  await adminCreateSpellRightWord({ setId, word, correctAnswer, explanation, order });
  revalidatePath(`/admin/spell-right/${setId}/words`);
  revalidatePath("/spell-right");
  redirect(`/admin/spell-right/${setId}/words`);
}

export async function updateSpellRightWordAction(
  setId: string,
  wordId: string,
  formData: FormData,
) {
  await requireRole("ADMIN", "TEACHER");
  const word = formData.get("word")?.toString().trim() ?? "";
  const correctAnswer = formData.get("correctAnswer")?.toString().trim() || null;
  const explanation = formData.get("explanation")?.toString().trim() || null;
  await adminUpdateSpellRightWord(wordId, { word, correctAnswer, explanation });
  revalidatePath(`/admin/spell-right/${setId}/words`);
  revalidatePath("/spell-right");
  redirect(`/admin/spell-right/${setId}/words`);
}

export async function deleteSpellRightWordAction(setId: string, wordId: string) {
  await requireRole("ADMIN", "TEACHER");
  await adminDeleteSpellRightWord(wordId);
  revalidatePath(`/admin/spell-right/${setId}/words`);
  revalidatePath("/spell-right");
}
