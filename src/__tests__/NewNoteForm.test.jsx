import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import NewNoteForm from "../components/NewNoteForm";
import { AuthTestWrapper, mockAuthenticatedContext } from "./testSetup";

describe("NewNoteForm", () => {
  it("renders new note form", () => {
    render(
      <AuthTestWrapper authContext={mockAuthenticatedContext}>
        <NewNoteForm communityId="test-community" />
      </AuthTestWrapper>
    );
    expect(screen.getByText(/nuova nota/i)).toBeInTheDocument();
  });
});
