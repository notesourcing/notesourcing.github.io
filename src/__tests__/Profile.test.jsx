import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Profile from "../pages/Profile";
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
      data: () => ({ displayName: "Test User" }),
    })
  ),
  setDoc: vi.fn(),
}));

describe("Profile Page", () => {
  it("renders user profile", () => {
    render(
      <TestWrapper authContext={mockAuthenticatedContext}>
        <Profile />
      </TestWrapper>
    );
    expect(screen.getByText(/profilo/i)).toBeInTheDocument();
  });
});
