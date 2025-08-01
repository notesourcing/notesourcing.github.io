import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Community from "../pages/Community";
import { TestWrapper, mockAuthenticatedContext } from "./testSetup";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  doc: vi.fn(),
  getDoc: vi.fn(() =>
    Promise.resolve({
      exists: () => true,
      data: () => ({ name: "Test Community" }),
    })
  ),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
}));

describe("Community Page", () => {
  it("renders community name", () => {
    render(
      <TestWrapper authContext={mockAuthenticatedContext}>
        <Community />
      </TestWrapper>
    );
    expect(screen.getByText(/comunità/i)).toBeInTheDocument();
  });
});
