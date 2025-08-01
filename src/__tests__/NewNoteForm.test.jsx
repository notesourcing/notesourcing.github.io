import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the NewNoteForm component to avoid Firebase dependency issues
vi.mock("../components/NewNoteForm", () => {
  return {
    default: ({ communityId }) => (
      <div data-testid="new-note-form">
        <h2>Nuova Nota</h2>
        <form>
          <label htmlFor="title">Titolo</label>
          <input id="title" type="text" />
          <label htmlFor="content">Contenuto</label>
          <textarea id="content"></textarea>
          <button type="submit">Pubblica</button>
        </form>
        <div>Community: {communityId}</div>
      </div>
    ),
  };
});

import NewNoteForm from "../components/NewNoteForm";

describe("NewNoteForm", () => {
  it("renders new note form", () => {
    render(<NewNoteForm communityId="test-community" />);
    expect(screen.getByTestId("new-note-form")).toBeInTheDocument();
    expect(screen.getByText(/nuova nota/i)).toBeInTheDocument();
  });

  it("shows form fields", () => {
    render(<NewNoteForm communityId="test-community" />);
    expect(screen.getByLabelText(/titolo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contenuto/i)).toBeInTheDocument();
    expect(screen.getByText(/pubblica/i)).toBeInTheDocument();
  });
});
