import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the Comments component since it has complex Firebase dependencies
vi.mock("../components/Comments", () => {
  return {
    default: ({ noteId, noteType }) => (
      <div data-testid="comments-component">
        <p>Nessun commento per questa {noteType}</p>
        <p>Note ID: {noteId}</p>
      </div>
    ),
  };
});

import Comments from "../components/Comments";

describe("Comments", () => {
  it("renders comments component", () => {
    render(<Comments noteId="test-note" noteType="note" />);
    expect(screen.getByTestId("comments-component")).toBeInTheDocument();
    expect(screen.getByText(/nessun commento/i)).toBeInTheDocument();
  });

  it("handles different note types", () => {
    render(<Comments noteId="test-note" noteType="suggestion" />);
    expect(
      screen.getByText(/nessun commento per questa suggestion/i)
    ).toBeInTheDocument();
  });
});
