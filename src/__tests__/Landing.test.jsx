import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Landing from "../pages/Landing";
import { AuthContext } from "../App";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key, // Return the key as the translation for testing
  }),
}));

// Mock getAppName utility
vi.mock("../utils/appName", () => ({
  getAppName: () => "NoteSourcing",
}));

describe("Landing", () => {
  const mockUser = { uid: "test-user", email: "test@example.com" };

  const renderComponent = (user) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user }}>
          <Landing />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders landing page with main sections", () => {
    renderComponent(null);

    // Check for main landing elements
    expect(screen.getByText(/landingTitle/i)).toBeInTheDocument();
    expect(screen.getByText(/landingDescription/i)).toBeInTheDocument();

    // Check for tagline elements
    expect(screen.getByText(/openSource/i)).toBeInTheDocument();
    expect(screen.getByText(/communityDriven/i)).toBeInTheDocument();
    expect(screen.getByText(/knowledgeSharing/i)).toBeInTheDocument();
  });

  it("renders quick start section", () => {
    renderComponent(null);

    expect(screen.getByText(/quickStart/i)).toBeInTheDocument();
    expect(screen.getAllByText(/exploreUniverse/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/communityAction/i).length).toBeGreaterThan(0);
  });

  it("shows sign in action for non-authenticated users", () => {
    renderComponent(null);

    expect(screen.getAllByText(/signInAction/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/signInActionDesc/i).length).toBeGreaterThan(0);
  });

  it("shows your notes action for authenticated users", () => {
    renderComponent(mockUser);

    expect(screen.getAllByText(/yourNotes/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/yourNotesDesc/i).length).toBeGreaterThan(0);
  });

  it("renders feature sections", () => {
    renderComponent(null);

    expect(screen.getAllByText(/whatIsApp/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/mainFeatures/i)).toBeInTheDocument();
    expect(screen.getAllByText(/personalSharedNotes/i).length).toBeGreaterThan(
      0
    );
    expect(
      screen.getAllByText(/collaborativeCommunity/i).length
    ).toBeGreaterThan(0);
    expect(screen.getAllByText(/realTimeReactions/i).length).toBeGreaterThan(0);
  });

  it("renders how to start section", () => {
    renderComponent(null);

    expect(screen.getByText(/howToStart/i)).toBeInTheDocument();
    expect(screen.getAllByText(/createAccount/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/exploreCommunity/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/createShare/i).length).toBeGreaterThan(0);
  });

  it("renders contribution links", () => {
    renderComponent(null);

    expect(screen.getByText(/contribute/i)).toBeInTheDocument();
    expect(screen.getAllByText(/githubRepo/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/improveApp/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/supportProject/i).length).toBeGreaterThan(0);
  });

  it("contains external links with proper attributes", () => {
    renderComponent(null);

    // Find the githubRepo link by role and accessible name
    const githubLink = screen.getByRole("link", { name: /githubRepo/i });
    expect(githubLink).toHaveAttribute(
      "href",
      "https://github.com/notesourcing/notesourcing.github.io"
    );
    expect(githubLink).toHaveAttribute("target", "_blank");
    expect(githubLink).toHaveAttribute("rel", "noopener noreferrer");
  });
});
