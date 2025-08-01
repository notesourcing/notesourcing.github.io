import { renderHook, act } from "@testing-library/react-hooks";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { useCommentCounts } from "../hooks/useCommentCounts";
import { collection, onSnapshot } from "firebase/firestore";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  onSnapshot: vi.fn(),
}));

describe("useCommentCounts", () => {
  beforeEach(() => {
    // Clear all previous mock data and calls
    vi.clearAllMocks();
  });

  it("returns comment counts and unsubscribes on unmount", () => {
    const unsubscribe = vi.fn();
    onSnapshot.mockImplementation((query, callback) => {
      // Simulate initial empty snapshot
      callback({ docs: [] });
      return unsubscribe; // Return unsubscribe function
    });

    const notes = [{ id: "note1", type: "public" }];
    const { result, unmount } = renderHook(() => useCommentCounts(notes));

    // Initial state should be an empty object
    expect(result.current).toEqual({ note1: 0 });

    // Unmount the hook
    unmount();

    // Expect the unsubscribe function to have been called
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it("handles multiple notes and updates correctly", () => {
    const unsubscribe = vi.fn();
    let callback;
    onSnapshot.mockImplementation((query, cb) => {
      callback = cb;
      // Simulate initial empty snapshot
      cb({ docs: [] });
      return unsubscribe;
    });

    const notes = [
      { id: "note1", type: "public" },
      { id: "note2", type: "private" },
    ];
    const { result } = renderHook(() => useCommentCounts(notes));

    // Initial state
    expect(result.current).toEqual({ note1: 0, note2: 0 });

    // Simulate a new comment for note1
    act(() => {
      callback({
        docs: [
          { id: "c1", data: () => ({ noteId: "note1", noteType: "public" }) },
        ],
      });
    });

    // Check updated state
    expect(result.current).toEqual({ note1: 1, note2: 0 });
  });
});
