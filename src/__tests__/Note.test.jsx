import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Note from "../pages/Note";
import { TestWrapper, mockAuthenticatedContext } from "./testSetup";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ fields: { Title: "Test Note" } }),
    })
  ),
  collection: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
}));

// Mock the useCommentCounts hook
vi.mock("../hooks/useCommentCounts", () => ({
  useCommentCounts: vi.fn(() => ({})),
}));

describe("Note Page", () => {
  it("renders note content", () => {
    render(
      <TestWrapper authContext={mockAuthenticatedContext}>
        <Note />
      </TestWrapper>
    );
    expect(screen.getByText(/nota/i)).toBeInTheDocument();
  });
});
