import { vi } from "vitest";
import { createDocumentWithSequentialId } from "../utils/sequentialIds";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
  getNextSequence: vi.fn(() => Promise.resolve(1)),
}));

vi.mock("firebase/firestore", () => ({
  addDoc: vi.fn(() => Promise.resolve({ id: "mock-id" })),
  collection: vi.fn(),
  doc: vi.fn(),
  setDoc: vi.fn(),
}));

describe("sequentialIds", () => {
  it("should create document with sequential id", async () => {
    const result = await createDocumentWithSequentialId("test", {
      data: "test",
    });
    expect(result).toBeDefined();
  });
});
