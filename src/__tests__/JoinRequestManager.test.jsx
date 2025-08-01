import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import JoinRequestManager from "../components/JoinRequestManager";

// Mock getDocs to return test data
vi.mock("firebase/firestore", async () => {
  const actual = await vi.importActual("firebase/firestore");
  return {
    ...actual,
    getDocs: vi.fn(() =>
      Promise.resolve({
        docs: [
          {
            id: "request1",
            data: () => ({
              userEmail: "alice@example.com",
              userDisplayName: "Alice",
              requestDate: new Date(),
              communityId: "test-community",
            }),
          },
        ],
      })
    ),
  };
});

describe("JoinRequestManager", () => {
  it("renders join requests", async () => {
    const mockUser = { uid: "test-user" };
    render(<JoinRequestManager communityId="test-community" user={mockUser} />);

    // Wait for loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText(/caricamento richieste/i)
      ).not.toBeInTheDocument();
    });

    expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
  });

  it("shows loading state initially", () => {
    const mockUser = { uid: "test-user" };
    render(<JoinRequestManager communityId="test-community" user={mockUser} />);
    expect(screen.getByText(/caricamento richieste/i)).toBeInTheDocument();
  });
});
