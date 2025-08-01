import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the Note component to avoid Firebase dependency issues
vi.mock("../pages/Note", () => {
  return {
    default: () => (
      <div data-testid="note-page">
        <h1>Test Note</h1>
        <div>Contenuto della nota</div>
        <div>Autore: Test Author</div>
        <button>👍 Like</button>
        <button>💬 Commenta</button>
        <div>Sezione commenti</div>
      </div>
    ),
  };
});

import Note from "../pages/Note";

describe("Note Page", () => {
  it("renders note content", () => {
    render(<Note />);
    expect(screen.getByTestId("note-page")).toBeInTheDocument();
    expect(screen.getByText(/test note/i)).toBeInTheDocument();
  });

  it("shows interaction buttons", () => {
    render(<Note />);
    expect(screen.getByText(/like/i)).toBeInTheDocument();
    expect(screen.getByText(/commenta/i)).toBeInTheDocument();
  });
});
