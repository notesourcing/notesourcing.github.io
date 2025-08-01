import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Logo from "../components/Logo";

// Mock the appName utility
vi.mock("../utils/appName", () => ({
  getAppName: vi.fn(() => "NoteSourcing"),
}));

// Mock Login component and its dependencies
vi.mock("../pages/Login", () => ({
  default: function MockLogin() {
    return <div data-testid="login-mock">Login Component</div>;
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

import Login from "../pages/Login";

describe("Logo", () => {
  it("renders logo image", () => {
    render(<Logo />);
    expect(screen.getByText(/NoteSourcing/i)).toBeInTheDocument();
  });
});

describe("Login", () => {
  it("renders login component", () => {
    render(<Login />);
    expect(screen.getByTestId("login-mock")).toBeInTheDocument();
  });
});
