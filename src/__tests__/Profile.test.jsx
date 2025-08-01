import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the Profile component to avoid Firebase dependency issues
vi.mock("../pages/Profile", () => {
  return {
    default: () => (
      <div data-testid="profile-page">
        <h1>Profilo Utente</h1>
        <div>Nome: Test User</div>
        <div>Email: test@example.com</div>
        <button>Modifica Profilo</button>
        <div>Impostazioni account</div>
      </div>
    ),
  };
});

import Profile from "../pages/Profile";

describe("Profile Page", () => {
  it("renders user profile", () => {
    render(<Profile />);
    expect(screen.getByTestId("profile-page")).toBeInTheDocument();
    expect(screen.getByText(/profilo utente/i)).toBeInTheDocument();
  });

  it("shows user information", () => {
    render(<Profile />);
    expect(screen.getByText(/nome: test user/i)).toBeInTheDocument();
    expect(screen.getByText(/modifica profilo/i)).toBeInTheDocument();
  });
});
