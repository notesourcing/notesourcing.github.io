import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Communities from "../pages/Communities";
import { AuthTestWrapper, mockAuthenticatedContext } from "./testSetup";

describe("Communities", () => {
  it("renders communities page", () => {
    render(
      <AuthTestWrapper authContext={mockAuthenticatedContext}>
        <Communities />
      </AuthTestWrapper>
    );
    expect(screen.getByText(/comunità/i)).toBeInTheDocument();
  });
});
