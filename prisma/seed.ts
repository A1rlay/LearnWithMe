import { randomBytes, scrypt } from "crypto";
import { promisify } from "util";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const scryptAsync = promisify(scrypt);

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${buf.toString("hex")}`;
}

async function main() {
  // Seed admin user from env vars (upsert so re-running seed is safe)
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "changeme";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await hashPassword(adminPassword),
      name: "Admin",
      role: "ADMIN",
    },
  });
  console.log(`Admin user: ${adminEmail}`);

  await prisma.questionOption.deleteMany();
  await prisma.question.deleteMany();
  await prisma.video.deleteMany();
  await prisma.topic.deleteMany();

  const topicPast = await prisma.topic.create({
    data: {
      description:
        "Introduce students to past descriptions with was and were through short stories and school-life conversations.",
      level: "A1 - A2",
      tags: ["was", "were", "past descriptions"],
      title: "Verb To Be in Past",
    },
  });

  const topicPresent = await prisma.topic.create({
    data: {
      description:
        "Help students recognize actions happening right now using rich present continuous listening scenes.",
      level: "A1 - A2",
      tags: ["actions now", "ing forms", "describing scenes"],
      title: "Present Continuous",
    },
  });

  await prisma.video.create({
    data: {
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description:
        "A short story about what two students did last weekend, focused on was and were usage.",
      order: 1,
      title: "Weekend Memory",
      topicId: topicPast.id,
      questions: {
        create: [
          {
            checkpointSeconds: 30,
            order: 1,
            prompt: "Where were the students on Saturday morning?",
            options: {
              create: [
                { isCorrect: true, order: 1, text: "They were at the library." },
                { order: 2, text: "They were at the beach." },
                { order: 3, text: "They were at home." },
                { order: 4, text: "They were at school." },
              ],
            },
          },
          {
            checkpointSeconds: 55,
            order: 2,
            prompt: "How was Ana feeling after the trip?",
            options: {
              create: [
                { order: 1, text: "Tired" },
                { order: 2, text: "Hungry" },
                { isCorrect: true, order: 3, text: "Excited" },
                { order: 4, text: "Late" },
              ],
            },
          },
          {
            checkpointSeconds: 75,
            order: 3,
            prompt: "What was inside Miguel's backpack?",
            options: {
              create: [
                { order: 1, text: "A sandwich" },
                { order: 2, text: "A grammar quiz" },
                { isCorrect: true, order: 3, text: "An old photo" },
                { order: 4, text: "A jacket" },
              ],
            },
          },
          {
            checkpointSeconds: 90,
            order: 4,
            prompt: "When were they back at home?",
            options: {
              create: [
                { order: 1, text: "At noon" },
                { isCorrect: true, order: 2, text: "In the evening" },
                { order: 3, text: "Before class" },
                { order: 4, text: "After lunch" },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.video.create({
    data: {
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description:
        "A classroom dialogue describing where objects and people were during a school event.",
      order: 2,
      title: "School Event Recap",
      topicId: topicPast.id,
      questions: {
        create: [
          {
            checkpointSeconds: 20,
            order: 1,
            prompt: "Where was the principal?",
            options: {
              create: [
                { isCorrect: true, order: 1, text: "In the gym" },
                { order: 2, text: "In the cafeteria" },
                { order: 3, text: "In the hallway" },
                { order: 4, text: "In the office" },
              ],
            },
          },
          {
            checkpointSeconds: 35,
            order: 2,
            prompt: "What color was the banner?",
            options: {
              create: [
                { order: 1, text: "Blue" },
                { isCorrect: true, order: 2, text: "Red" },
                { order: 3, text: "Green" },
                { order: 4, text: "Yellow" },
              ],
            },
          },
          {
            checkpointSeconds: 50,
            order: 3,
            prompt: "How many teachers were near the entrance?",
            options: {
              create: [
                { order: 1, text: "Three" },
                { isCorrect: true, order: 2, text: "Four" },
                { order: 3, text: "Five" },
                { order: 4, text: "Six" },
              ],
            },
          },
          {
            checkpointSeconds: 65,
            order: 4,
            prompt: "What was on the stage?",
            options: {
              create: [
                { isCorrect: true, order: 1, text: "A microphone" },
                { order: 2, text: "A notebook" },
                { order: 3, text: "A speaker" },
                { order: 4, text: "A camera" },
              ],
            },
          },
        ],
      },
    },
  });

  await prisma.video.create({
    data: {
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description:
        "A city scene where people are doing different actions right now.",
      order: 1,
      title: "Busy City Morning",
      topicId: topicPresent.id,
      questions: {
        create: [
          {
            checkpointSeconds: 25,
            order: 1,
            prompt: "What is the tourist doing?",
            options: {
              create: [
                { isCorrect: true, order: 1, text: "Reading a map" },
                { order: 2, text: "Buying fruit" },
                { order: 3, text: "Waiting for a bus" },
                { order: 4, text: "Taking pictures" },
              ],
            },
          },
          {
            checkpointSeconds: 45,
            order: 2,
            prompt: "What is the boy carrying?",
            options: {
              create: [
                { order: 1, text: "A dog" },
                { isCorrect: true, order: 2, text: "A bicycle helmet" },
                { order: 3, text: "A newspaper" },
                { order: 4, text: "An umbrella" },
              ],
            },
          },
          {
            checkpointSeconds: 65,
            order: 3,
            prompt: "Where are the musicians playing?",
            options: {
              create: [
                { order: 1, text: "In a cafe" },
                { order: 2, text: "At the station" },
                { order: 3, text: "In a park" },
                { isCorrect: true, order: 4, text: "At the market" },
              ],
            },
          },
          {
            checkpointSeconds: 80,
            order: 4,
            prompt: "Why are people opening umbrellas?",
            options: {
              create: [
                { order: 1, text: "Because it is cold" },
                { isCorrect: true, order: 2, text: "Because it is raining" },
                { order: 3, text: "Because it is windy" },
                { order: 4, text: "Because it is sunny" },
              ],
            },
          },
        ],
      },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
