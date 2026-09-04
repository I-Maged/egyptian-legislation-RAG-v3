import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../client";
import {
  appendMessage,
  createConversation,
  deleteConversation,
  getConversation,
  getConversationForUser,
  listConversations,
  updateConversationTitle,
} from "./conversation.repository";

const suffix = Date.now().toString(36);

const testUserId = `test-conv-user-${suffix}`;
const otherUserId = `test-conv-other-${suffix}`;

async function waitFor(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

beforeAll(async () => {
  await prisma.user.createMany({
    data: [
      {
        id: testUserId,
        email: `conv-repo-test-${suffix}@example.com`,
        passwordHash: "test-hash",
        name: "Conversation Repo Test",
      },
      {
        id: otherUserId,
        email: `conv-repo-other-${suffix}@example.com`,
        passwordHash: "test-hash",
        name: "Conversation Repo Other",
      },
    ],
  });
});

afterAll(async () => {
  await prisma.user.deleteMany({
    where: { id: { in: [testUserId, otherUserId] } },
  });

  await prisma.$disconnect();
});

describe("conversation repository", () => {
  it("creates a conversation with a title", async () => {
    const conversation = await createConversation({
      userId: testUserId,
      title: "سؤال عن قانون العمل",
    });

    expect(conversation.id).toBeTruthy();
    expect(conversation.userId).toBe(testUserId);
    expect(conversation.title).toBe("سؤال عن قانون العمل");
    expect(conversation.createdAt).toBeInstanceOf(Date);
    expect(conversation.updatedAt).toBeInstanceOf(Date);
  });

  it("creates a conversation without a title (null)", async () => {
    const conversation = await createConversation({ userId: testUserId });

    expect(conversation.title).toBeNull();
  });

  it("appends USER and ASSISTANT messages in order and touches updatedAt", async () => {
    const conversation = await createConversation({ userId: testUserId });
    const initialUpdatedAt = conversation.updatedAt;

    const userMessage = await appendMessage({
      conversationId: conversation.id,
      role: "USER",
      content: "ما هي شروط إنهاء عقد العمل؟",
    });

    await waitFor(10);

    const assistantMessage = await appendMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: "وفقًا للمادة [1]، يحدد القانون ذلك.",
    });

    expect(userMessage.role).toBe("USER");
    expect(userMessage.content).toBe("ما هي شروط إنهاء عقد العمل؟");
    expect(assistantMessage.role).toBe("ASSISTANT");

    const loaded = await getConversation(conversation.id);

    expect(loaded).not.toBeNull();
    expect(loaded!.messages).toHaveLength(2);
    expect(loaded!.messages[0]!.role).toBe("USER");
    expect(loaded!.messages[1]!.role).toBe("ASSISTANT");
    expect(loaded!.updatedAt.getTime()).toBeGreaterThan(
      initialUpdatedAt.getTime(),
    );
  });

  it("stores rag run metadata on assistant messages", async () => {
    const conversation = await createConversation({ userId: testUserId });

    const message = await appendMessage({
      conversationId: conversation.id,
      role: "ASSISTANT",
      content: "إجابة مع بيانات تشغيل.",
      ragRun: {
        model: "gemma4:cloud",
        retrievalTimeMs: 120,
        generationTimeMs: 800,
        totalTimeMs: 950,
      },
    });

    expect(message.ragRun).not.toBeNull();
    expect(message.ragRun!.model).toBe("gemma4:cloud");
    expect(message.ragRun!.retrievalTimeMs).toBe(120);
    expect(message.ragRun!.generationTimeMs).toBe(800);
    expect(message.ragRun!.totalTimeMs).toBe(950);
  });

  it("lists only the owner's conversations, newest activity first, with message counts", async () => {
    const first = await createConversation({
      userId: testUserId,
      title: "الأقدم نشاطًا",
    });

    await waitFor(10);

    const second = await createConversation({
      userId: testUserId,
      title: "الأحدث نشاطًا",
    });

    await appendMessage({
      conversationId: first.id,
      role: "USER",
      content: "رسالة تجعل الأول الأحدث",
    });

    await appendMessage({
      conversationId: first.id,
      role: "ASSISTANT",
      content: "رد",
    });

    await createConversation({ userId: otherUserId, title: "محادثة مستخدم آخر" });

    const conversations = await listConversations(testUserId);

    const ids = conversations.map((conversation) => conversation.id);

    expect(ids).toContain(first.id);
    expect(ids).toContain(second.id);
    expect(ids.indexOf(first.id)).toBeLessThan(ids.indexOf(second.id));

    const firstEntry = conversations.find(
      (conversation) => conversation.id === first.id,
    );

    expect(firstEntry!._count.messages).toBe(2);

    const other = await listConversations(otherUserId);

    expect(other).toHaveLength(1);
    expect(other[0]!.title).toBe("محادثة مستخدم آخر");
  });

  it("getConversationForUser enforces ownership", async () => {
    const conversation = await createConversation({
      userId: testUserId,
      title: "خاصة",
    });

    const owned = await getConversationForUser(conversation.id, testUserId);
    expect(owned).not.toBeNull();
    expect(owned!.id).toBe(conversation.id);

    const foreign = await getConversationForUser(conversation.id, otherUserId);
    expect(foreign).toBeNull();

    const missing = await getConversationForUser("does-not-exist", testUserId);
    expect(missing).toBeNull();
  });

  it("updates the conversation title", async () => {
    const conversation = await createConversation({ userId: testUserId });

    const updated = await updateConversationTitle(
      conversation.id,
      "عنوان جديد",
    );

    expect(updated.title).toBe("عنوان جديد");
  });

  it("deletes a conversation and cascades to messages", async () => {
    const conversation = await createConversation({ userId: testUserId });

    await appendMessage({
      conversationId: conversation.id,
      role: "USER",
      content: "سيتم حذفها",
    });

    const deleted = await deleteConversation(conversation.id);

    expect(deleted.id).toBe(conversation.id);

    const loaded = await getConversation(conversation.id);
    expect(loaded).toBeNull();

    const messages = await prisma.message.findMany({
      where: { conversationId: conversation.id },
    });
    expect(messages).toHaveLength(0);
  });
});
