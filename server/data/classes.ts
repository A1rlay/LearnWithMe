import { randomBytes } from "crypto";

import { prisma } from "@/server/db";

function generateCode(): string {
  return randomBytes(3).toString("hex").toUpperCase(); // e.g. "A1B2C3"
}

export async function adminGetAllClasses(teacherId?: string) {
  return prisma.class.findMany({
    where: teacherId ? { teacherId } : undefined,
    include: {
      teacher: { select: { id: true, name: true } },
      _count: { select: { students: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function adminGetClass(id: string) {
  return prisma.class.findUnique({
    where: { id },
    include: {
      teacher: { select: { id: true, name: true, email: true } },
      students: {
        include: {
          student: { select: { id: true, name: true, email: true } },
        },
        orderBy: { joinedAt: "asc" },
      },
    },
  });
}

export async function adminCreateClass(data: { name: string; teacherId: string }) {
  let code = generateCode();
  // Retry on collision (extremely unlikely)
  while (await prisma.class.findUnique({ where: { code } })) {
    code = generateCode();
  }
  return prisma.class.create({ data: { ...data, code } });
}

export async function adminUpdateClass(id: string, data: { name: string; teacherId: string }) {
  return prisma.class.update({ where: { id }, data });
}

export async function adminDeleteClass(id: string) {
  return prisma.class.delete({ where: { id } });
}

export async function addStudentToClass(classId: string, studentId: string) {
  return prisma.classStudent.upsert({
    where: { classId_studentId: { classId, studentId } },
    update: {},
    create: { classId, studentId },
  });
}

export async function removeStudentFromClass(classId: string, studentId: string) {
  return prisma.classStudent.delete({
    where: { classId_studentId: { classId, studentId } },
  });
}

export async function getStudentClasses(userId: string) {
  return prisma.classStudent.findMany({
    where: { studentId: userId },
    include: {
      class: {
        include: { teacher: { select: { name: true } } },
      },
    },
    orderBy: { joinedAt: "desc" },
  });
}

// ─── Assignments ──────────────────────────────────────────────────────────────

export async function assignTopicToClass(classId: string, topicId: string, opts?: { note?: string; dueAt?: Date | null }) {
  return prisma.classAssignment.upsert({
    where: { classId_topicId: { classId, topicId } },
    update: { note: opts?.note ?? null, dueAt: opts?.dueAt ?? null },
    create: { classId, topicId, note: opts?.note ?? null, dueAt: opts?.dueAt ?? null },
  });
}

export async function removeAssignment(id: string) {
  return prisma.classAssignment.delete({ where: { id } });
}

export async function getClassAssignments(classId: string) {
  return prisma.classAssignment.findMany({
    where: { classId },
    include: {
      topic: { select: { id: true, title: true, description: true, _count: { select: { questions: true } } } },
    },
    orderBy: { createdAt: "asc" },
  });
}

