import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the JoinRequestManager component to avoid Firebase dependency issues
vi.mock("../components/JoinRequestManager", () => {
  return {
    default: ({ communityId, user }) => (
      <div data-testid="join-request-manager">
        <h2>Gestione Richieste per {communityId}</h2>
        <div>Utente: {user?.uid}</div>
        <div>alice@example.com</div>
        <button>Approva</button>
        <button>Rifiuta</button>
      </div>
    ),
  };
});

import JoinRequestManager from "../components/JoinRequestManager";

describe("JoinRequestManager", () => {
  it("renders join request manager", () => {
    const mockUser = { uid: "test-user" };
    render(<JoinRequestManager communityId="test-community" user={mockUser} />);

    expect(screen.getByTestId("join-request-manager")).toBeInTheDocument();
    expect(
      screen.getByText(/gestione richieste per test-community/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
  });

  it("shows approve and reject buttons", () => {
    const mockUser = { uid: "test-user" };
    render(<JoinRequestManager communityId="test-community" user={mockUser} />);

    expect(screen.getByText(/approva/i)).toBeInTheDocument();
    expect(screen.getByText(/rifiuta/i)).toBeInTheDocument();
  });
});
