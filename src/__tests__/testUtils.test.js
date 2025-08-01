import { vi } from "vitest";
import { createTestCommunity } from "../utils/testUtils";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

// Mock sequential IDs utility
vi.mock("../utils/sequentialIds", () => ({
  createDocumentWithSequentialId: vi.fn(() =>
    Promise.resolve({
      docId: "test-id",
      sequentialId: 1,
    })
  ),
}));

describe("testUtils", () => {
  it("should run test function", async () => {
    const mockUser = { uid: "test-uid" };
    const result = await createTestCommunity(mockUser);
    expect(result).toBeDefined();
  });
});
