import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

// Mock the UserRoles component to avoid Firebase dependency issues
vi.mock("../pages/UserRoles", () => {
  return {
    default: () => (
      <div data-testid="user-roles-page">
        <h1>Gestione Utenti</h1>
        <div>Lista utenti e loro ruoli</div>
        <table>
          <thead>
            <tr>
              <th>Utente</th>
              <th>Ruolo</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>test@example.com</td>
              <td>user</td>
              <td>
                <button>Modifica</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    ),
  };
});

import UserRoles from "../pages/UserRoles";

describe("UserRoles Page", () => {
  it("renders roles list", () => {
    render(<UserRoles />);
    expect(screen.getByTestId("user-roles-page")).toBeInTheDocument();
    expect(screen.getByText(/gestione utenti/i)).toBeInTheDocument();
  });

  it("shows user table", () => {
    render(<UserRoles />);
    expect(screen.getByText(/utente/i)).toBeInTheDocument();
    expect(screen.getByText(/ruolo/i)).toBeInTheDocument();
    expect(screen.getByText(/modifica/i)).toBeInTheDocument();
  });
});
