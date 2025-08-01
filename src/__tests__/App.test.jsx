import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "../App";

describe("App", () => {
  it("renders without crashing", async () => {
    render(<App />);

    // Wait for the app to finish loading
    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    // Check for app-specific content
    expect(screen.getByText(/NoteSourcing/i)).toBeInTheDocument();
  });
});
