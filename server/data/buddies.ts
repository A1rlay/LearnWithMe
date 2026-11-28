import { Prisma } from "@prisma/client";

import { prisma } from "@/server/db";
import { allow } from "@/server/data/rate-limit";

/**
 * Study buddies. Rules (PRD-study-buddies):
 * - only opted-in users are discoverable and may send requests;
 * - messaging + Discord only between ACCEPTED buddies;
 * - a block (either direction) hides both people from each other everywhere.
 * Every function takes the acting user's id and re-checks these rules itself.
 */

export class BuddyError extends Error {}

type ConnRow = { status: "PENDING" | "ACCEPTED" | "DECLINED"; requesterId: string; closedById: string | null; acceptedAt: Date | null };

/**
 * What a connection looks like to `me`. Declines are silent: a requester whose request
 * was declined keeps seeing it as "waiting".
 */
export function viewOf(c: ConnRow, me: string): "buddy" | "incoming" | "waiting" | "ended" | "hidden" {
  if (c.status === "ACCEPTED") return "buddy";
  if (c.status === "PENDING") return c.requesterId === me ? "waiting" : "incoming";
  if (c.acceptedAt === null && c.requesterId === me && c.closedById !== null && c.closedById !== me) return "waiting";
  if (c.acceptedAt !== null) return "ended";
  return "hidden";
}

const pair = (x: string, y: string) => (x < y ? { userAId: x, userBId: y } : { userAId: y, userBId: x });
const other = (c: { userAId: string; userBId: string }, me: string) => (c.userAId === me ? c.userBId : c.userAId);

export async function isBlockedEitherWay(a: string, b: string): Promise<boolean> {
  const n = await prisma.block.count({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
  });
  return n > 0;
}

async function blockedIds(me: string): Promise<Set<string>> {
  const rows = await prisma.block.findMany({
    where: { OR: [{ blockerId: me }, { blockedId: me }] },
    select: { blockerId: true, blockedId: true },
  });
  return new Set(rows.map((r) => (r.blockerId === me ? r.blockedId : r.blockerId)));
}

/** Public card: what a stranger may see. Never email, never Discord. */
const publicUser = {
  id: true,
  username: true,
  name: true,
  bio: true,
  interests: true,
  learning: { select: { subject: { select: { id: true, name: true } } } },
} as const;

// ─── Suggestions ──────────────────────────────────────────────────────────────

export type Suggestion = {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  interests: string[];
  subjects: string[];
  sharedSubjects: string[];
  sharedInterests: string[];
};

export async function getSuggestions(me: string, limit = 24): Promise<Suggestion[]> {
  const self = await prisma.user.findUnique({
    where: { id: me },
    select: { lookingForBuddies: true, interests: true, learning: { select: { subjectId: true } } },
  });
  if (!self?.lookingForBuddies) return [];

  const [blocked, connections] = await Promise.all([
    blockedIds(me),
    prisma.buddyConnection.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      select: { userAId: true, userBId: true, status: true, closedById: true, requesterId: true, acceptedAt: true },
    }),
  ]);
  // Exclude only people I'm visibly linked to (buddy / incoming / waiting). Closed rows stay
  // findable either way, so a cancelled request looks the same whether or not it was declined.
  const linked = connections
    .filter((c) => ["buddy", "incoming", "waiting"].includes(viewOf(c, me)))
    .map((c) => other(c, me));
  const exclude = new Set([me, ...blocked, ...linked]);

  const candidates = await prisma.user.findMany({
    where: { lookingForBuddies: true, id: { notIn: [...exclude] } },
    select: publicUser,
    take: 300,
    orderBy: { updatedAt: "desc" },
  });

  const mySubjects = new Set(self.learning.map((l) => l.subjectId));
  const myInterests = new Set(self.interests);
  return candidates
    .map((u) => {
      const sharedSubjects = u.learning.filter((l) => mySubjects.has(l.subject.id)).map((l) => l.subject.name);
      const sharedInterests = u.interests.filter((i) => myInterests.has(i));
      return {
        id: u.id,
        username: u.username,
        name: u.name,
        bio: u.bio,
        interests: u.interests,
        subjects: u.learning.map((l) => l.subject.name),
        sharedSubjects,
        sharedInterests,
        score: sharedSubjects.length * 3 + sharedInterests.length,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => ({
      id: s.id,
      username: s.username,
      name: s.name,
      bio: s.bio,
      interests: s.interests,
      subjects: s.subjects,
      sharedSubjects: s.sharedSubjects,
      sharedInterests: s.sharedInterests,
    }));
}

// ─── Requests ─────────────────────────────────────────────────────────────────

export async function sendRequest(me: string, targetId: string) {
  if (me === targetId) throw new BuddyError("You can't add yourself.");
  const [self, target] = await Promise.all([
    prisma.user.findUnique({ where: { id: me }, select: { lookingForBuddies: true } }),
    prisma.user.findUnique({ where: { id: targetId }, select: { lookingForBuddies: true } }),
  ]);
  if (!self?.lookingForBuddies) throw new BuddyError("Turn on “Show me to study buddies” first.");
  // Same answer whether the target doesn't exist, isn't opted in, or blocked — no probing.
  if (!target?.lookingForBuddies) throw new BuddyError("This person isn't available.");
  const iBlocked = await prisma.block.count({ where: { blockerId: me, blockedId: targetId } });
  if (iBlocked) throw new BuddyError("Unblock them first (on your Me page).");
  const theyBlocked = await prisma.block.count({ where: { blockerId: targetId, blockedId: me } });

  const key = pair(me, targetId);
  const existing = await prisma.buddyConnection.findUnique({ where: { userAId_userBId: key } });
  if (theyBlocked && !existing) return; // silent: indistinguishable from a request nobody answers
  if (existing) {
    if (existing.status !== "DECLINED") return; // already pending or buddies
    if (existing.closedById !== me || theyBlocked) {
      // Declined/ended/blocked by the other person: silently show it as "waiting" again,
      // exactly like a fresh unanswered request — never put it in front of them.
      if (existing.acceptedAt === null && existing.requesterId !== me) {
        await prisma.buddyConnection.update({ where: { id: existing.id }, data: { requesterId: me } });
      }
      return;
    }
    // I closed it earlier (declined / ended / blocked) — I may reopen with a fresh request.
    if (!(await allow(`buddy-req:${me}`, 20, 86_400_000))) throw new BuddyError("You've sent a lot of requests today. Try again tomorrow.");
    await prisma.buddyConnection.updateMany({
      where: { id: existing.id, status: "DECLINED", closedById: me },
      data: { status: "PENDING", requesterId: me, closedById: null, acceptedAt: null, respondedAt: null },
    });
    return;
  }
  if (!(await allow(`buddy-req:${me}`, 20, 86_400_000))) {
    throw new BuddyError("You've sent a lot of requests today. Try again tomorrow.");
  }
  try {
    await prisma.buddyConnection.create({ data: { ...key, requesterId: me } });
  } catch (e) {
    // Lost a race with the other person's request for the same pair: one row exists — fine.
    if (!(e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")) throw e;
  }
}

async function myConnection(me: string, connectionId: string) {
  const c = await prisma.buddyConnection.findUnique({ where: { id: connectionId } });
  if (!c || (c.userAId !== me && c.userBId !== me)) throw new BuddyError("Not found.");
  return c;
}

/** Only the person who received a PENDING request can answer it. */
export async function respondToRequest(me: string, connectionId: string, accept: boolean) {
  const c = await myConnection(me, connectionId);
  if (c.requesterId === me || c.status !== "PENDING") throw new BuddyError("Not found.");
  if (accept && (await isBlockedEitherWay(c.userAId, c.userBId))) throw new BuddyError("Not found.");
  const now = new Date();
  await prisma.buddyConnection.updateMany({
    where: { id: c.id, status: "PENDING" },
    data: accept
      ? { status: "ACCEPTED", acceptedAt: now, respondedAt: now }
      : { status: "DECLINED", closedById: me, respondedAt: now },
  });
}

/**
 * Requester withdraws. A real PENDING request is deleted (they may ask again later).
 * A silently-declined one is handed over to the decliner so it disappears from the
 * requester's list without letting them re-send it.
 */
export async function cancelRequest(me: string, connectionId: string) {
  const c = await myConnection(me, connectionId);
  if (viewOf(c, me) !== "waiting") throw new BuddyError("Not found.");
  if (c.status === "PENDING") {
    await prisma.buddyConnection.deleteMany({ where: { id: c.id, status: "PENDING", requesterId: me } });
  } else {
    await prisma.buddyConnection.update({ where: { id: c.id }, data: { requesterId: c.closedById! } });
  }
}

/** Either buddy ends the connection; history is kept (for reports) but messaging stops. */
export async function endBuddy(me: string, connectionId: string) {
  const c = await myConnection(me, connectionId);
  if (c.status !== "ACCEPTED") throw new BuddyError("Not found.");
  await prisma.buddyConnection.update({
    where: { id: c.id },
    data: { status: "DECLINED", closedById: me, respondedAt: new Date() },
  });
}

// ─── Lists ────────────────────────────────────────────────────────────────────

export async function getMyConnections(me: string) {
  const [rows, blocked] = await Promise.all([
    prisma.buddyConnection.findMany({
      where: { OR: [{ userAId: me }, { userBId: me }] },
      include: {
        userA: { select: { ...publicUser, discordHandle: true } },
        userB: { select: { ...publicUser, discordHandle: true } },
        messages: { orderBy: { createdAt: "desc" }, take: 1, select: { body: true, createdAt: true, senderId: true } },
        _count: { select: { messages: { where: { senderId: { not: me }, readAt: null } } } },
      },
      orderBy: { createdAt: "desc" },
    }),
    blockedIds(me),
  ]);

  const view = rows
    .map((c) => {
      const u = c.userAId === me ? c.userB : c.userA;
      const accepted = c.status === "ACCEPTED";
      return {
        id: c.id,
        view: viewOf(c, me),
        user: {
          id: u.id,
          username: u.username,
          name: u.name,
          bio: u.bio,
          interests: u.interests,
          subjects: u.learning.map((l) => l.subject.name),
          // Discord only once accepted.
          discordHandle: accepted ? u.discordHandle : null,
        },
        lastMessage: accepted ? (c.messages[0] ?? null) : null,
        unread: accepted ? c._count.messages : 0,
      };
    })
    .filter((c) => !blocked.has(c.user.id));

  return {
    buddies: view.filter((c) => c.view === "buddy"),
    incoming: view.filter((c) => c.view === "incoming"),
    outgoing: view.filter((c) => c.view === "waiting"),
  };
}

export async function unreadCount(me: string): Promise<number> {
  return prisma.message.count({
    where: {
      senderId: { not: me },
      readAt: null,
      connection: {
        status: "ACCEPTED",
        OR: [{ userAId: me }, { userBId: me }],
      },
    },
  });
}

// ─── Messages ─────────────────────────────────────────────────────────────────

/** Thread for a participant. Marks the other person's messages as read. */
export async function getThread(me: string, connectionId: string) {
  const c = await myConnection(me, connectionId).catch(() => null);
  if (!c || viewOf(c, me) === "hidden") return null;
  const otherId = other(c, me);
  if (await isBlockedEitherWay(me, otherId)) return null;

  const [peer, messages] = await Promise.all([
    prisma.user.findUnique({ where: { id: otherId }, select: { ...publicUser, discordHandle: true } }),
    prisma.message.findMany({
      where: { connectionId },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: { id: true, body: true, createdAt: true, senderId: true, readAt: true },
    }),
  ]);
  if (!peer) return null;
  if (c.status === "ACCEPTED") {
    await prisma.message.updateMany({ where: { connectionId, senderId: otherId, readAt: null }, data: { readAt: new Date() } });
  }
  return {
    connection: { id: c.id, status: c.status, view: viewOf(c, me) },
    peer: {
      id: peer.id,
      username: peer.username,
      name: peer.name,
      bio: peer.bio,
      interests: peer.interests,
      subjects: peer.learning.map((l) => l.subject.name),
      discordHandle: c.status === "ACCEPTED" ? peer.discordHandle : null,
    },
    messages: messages.reverse(),
  };
}

export async function sendMessage(me: string, connectionId: string, rawBody: string) {
  const body = rawBody.trim();
  if (!body) return;
  if (body.length > 2000) throw new BuddyError("Messages can be up to 2000 characters.");
  const c = await myConnection(me, connectionId);
  if (c.status !== "ACCEPTED") throw new BuddyError("You can message each other once the request is accepted.");
  if (await isBlockedEitherWay(c.userAId, c.userBId)) throw new BuddyError("Not found.");
  if (!(await allow(`msg:${me}`, 30, 60_000))) throw new BuddyError("Slow down a little — try again in a minute.");
  await prisma.message.create({ data: { connectionId, senderId: me, body } });
}

// ─── Safety ───────────────────────────────────────────────────────────────────

export async function blockUser(me: string, otherId: string) {
  if (me === otherId) return;
  if (!(await prisma.user.count({ where: { id: otherId } }))) throw new BuddyError("Not found.");
  await prisma.$transaction([
    prisma.block.upsert({
      where: { blockerId_blockedId: { blockerId: me, blockedId: otherId } },
      update: {},
      create: { blockerId: me, blockedId: otherId },
    }),
    prisma.buddyConnection.updateMany({
      where: { ...pair(me, otherId), status: { in: ["PENDING", "ACCEPTED"] } },
      data: { status: "DECLINED", closedById: me, respondedAt: new Date() },
    }),
  ]);
}

export async function unblockUser(me: string, otherId: string) {
  await prisma.block.deleteMany({ where: { blockerId: me, blockedId: otherId } });
}

export async function getMyBlocks(me: string) {
  return prisma.block.findMany({
    where: { blockerId: me },
    select: { blocked: { select: { id: true, username: true, name: true } }, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Report a person, optionally pointing at one of their messages. The message must
 * have been sent by that person in a conversation the reporter is part of.
 */
export async function reportUser(me: string, reportedId: string, reason: string, messageId?: string | null) {
  const r = reason.trim().slice(0, 1000);
  if (!r) throw new BuddyError("Tell us briefly what happened.");
  if (me === reportedId) throw new BuddyError("Not found.");
  if (messageId) {
    const m = await prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, connection: { select: { userAId: true, userBId: true } } },
    });
    const inIt = m && (m.connection.userAId === me || m.connection.userBId === me);
    if (!m || !inIt || m.senderId !== reportedId) throw new BuddyError("Not found.");
  } else {
    // A person-only report needs some prior contact (a connection row of any status).
    const c = await prisma.buddyConnection.findUnique({ where: { userAId_userBId: pair(me, reportedId) } });
    if (!c) throw new BuddyError("Not found.");
  }
  if (!(await allow(`report:${me}`, 10, 86_400_000))) throw new BuddyError("You've sent many reports today.");
  await prisma.report.create({ data: { reporterId: me, reportedId, reason: r, messageId: messageId ?? null } });
}

// ─── Owner moderation ─────────────────────────────────────────────────────────

export async function adminListReports(includeResolved = false) {
  return prisma.report.findMany({
    where: includeResolved ? undefined : { resolvedAt: null },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      reporter: { select: { id: true, username: true, name: true } },
      reported: { select: { id: true, username: true, name: true } },
      message: { select: { body: true, createdAt: true } },
    },
  });
}

export async function adminResolveReport(id: string) {
  await prisma.report.update({ where: { id }, data: { resolvedAt: new Date() } });
}
