import React from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";
import Logo from "../components/Logo";

// Mock the appName utility
vi.mock("../utils/appName", () => ({
  getAppName: vi.fn(() => "NoteSourcing"),
}));

describe("Logo", () => {
  it("renders logo image", () => {
    render(<Logo />);
    expect(screen.getByText(/NoteSourcing/i)).toBeInTheDocument();
  });
});
