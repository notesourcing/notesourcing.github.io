import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Comments from "../components/Comments";
import { AuthTestWrapper, mockAuthenticatedContext } from "./testSetup";

describe("Comments", () => {
  it("renders comments list", () => {
    render(
      <AuthTestWrapper authContext={mockAuthenticatedContext}>
        <Comments noteId="test-note" noteType="note" />
      </AuthTestWrapper>
    );
    expect(screen.getByText(/nessun commento/i)).toBeInTheDocument();
  });

  it("handles empty comments", () => {
    render(
      <AuthTestWrapper authContext={mockAuthenticatedContext}>
        <Comments noteId="empty-note" noteType="note" />
      </AuthTestWrapper>
    );
    expect(screen.getByText(/nessun commento/i)).toBeInTheDocument();
  });
});
