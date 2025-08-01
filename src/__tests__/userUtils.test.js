import { vi } from "vitest";
import { formatUserDisplayNameSimple } from "../utils/userUtils";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
}));

describe("userUtils", () => {
  it("should return user display name", () => {
    const note = { authorDisplayName: "Alice" };
    const name = formatUserDisplayNameSimple(note);
    expect(name).toBe("Alice");
  });
});
