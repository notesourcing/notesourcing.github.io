import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import UserRoles from "../pages/UserRoles";
import { TestWrapper, mockSuperAdminContext } from "./testSetup";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
  doc: vi.fn(),
  updateDoc: vi.fn(),
}));

describe("UserRoles Page", () => {
  it("renders roles list", () => {
    render(
      <TestWrapper authContext={mockSuperAdminContext}>
        <UserRoles />
      </TestWrapper>
    );
    expect(screen.getByText(/gestione utenti/i)).toBeInTheDocument();
  });
});
