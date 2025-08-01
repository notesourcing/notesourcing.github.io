import { renderHook } from "@testing-library/react-hooks";
import { vi } from "vitest";
import { useCommentCounts } from "../hooks/useCommentCounts";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    // Simulate empty snapshot
    callback({ docs: [] });
    return () => {}; // Return unsubscribe function
  }),
}));

describe("useCommentCounts", () => {
  it("returns comment counts", () => {
    const { result } = renderHook(() => useCommentCounts(["note1", "note2"]));
    expect(result.current).toBeInstanceOf(Object);
  });
});
