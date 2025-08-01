import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import NoteCard from "../components/NoteCard";
import { TestWrapper, mockAuthenticatedContext } from "./testSetup";

// Mock the useCommentCounts hook
vi.mock("../hooks/useCommentCounts", () => ({
  useCommentCounts: vi.fn(() => ({})),
}));

describe("NoteCard", () => {
  const mockNote = {
    id: "test-note",
    fields: { Title: "Test Note" },
    authorDisplayName: "Test Author",
    privacy: "public",
    type: "note",
  };

  it("renders note title", () => {
    render(
      <TestWrapper authContext={mockAuthenticatedContext}>
        <NoteCard note={mockNote} />
      </TestWrapper>
    );
    expect(screen.getByText(/Test Note/i)).toBeInTheDocument();
  });
});
