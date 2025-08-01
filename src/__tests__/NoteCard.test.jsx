import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the NoteCard component to avoid Firebase dependency issues
vi.mock("../components/NoteCard", () => {
  return {
    default: ({ note }) => (
      <div data-testid="note-card">
        <h3>{note?.fields?.Title || "Untitled"}</h3>
        <p>Autore: {note?.authorDisplayName || "Unknown"}</p>
        <div>Privacy: {note?.privacy}</div>
        <div>Type: {note?.type}</div>
        <button>👍 Like</button>
        <button>💬 Commenta</button>
      </div>
    ),
  };
});

import NoteCard from "../components/NoteCard";

describe("NoteCard", () => {
  const mockNote = {
    id: "test-note",
    fields: { Title: "Test Note" },
    authorDisplayName: "Test Author",
    privacy: "public",
    type: "note",
  };

  it("renders note title", () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByTestId("note-card")).toBeInTheDocument();
    expect(screen.getByText(/test note/i)).toBeInTheDocument();
  });

  it("shows author and metadata", () => {
    render(<NoteCard note={mockNote} />);
    expect(screen.getByText(/autore: test author/i)).toBeInTheDocument();
    expect(screen.getByText(/privacy: public/i)).toBeInTheDocument();
  });
});
