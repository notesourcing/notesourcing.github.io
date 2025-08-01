import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Landing from "../pages/Landing";

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key, // Return the key as the translation for testing
  }),
}));

// Mock AuthContext and useContext
vi.mock("../App", () => ({
  AuthContext: React.createContext({ user: null }),
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

// Mock useContext
vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useContext: vi.fn(),
  };
});

// Mock getAppName utility
vi.mock("../utils/appName", () => ({
  getAppName: () => "NoteSourcing",
}));

describe("Landing", () => {
  const mockUser = { uid: "test-user", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup React.useContext mock
    vi.mocked(React.useContext).mockReturnValue({ user: null });
  });

  it("renders landing page with main sections", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Check for main landing elements
    expect(screen.getByText("landingTitle")).toBeInTheDocument();
    expect(screen.getByText("landingDescription")).toBeInTheDocument();

    // Check for tagline elements
    expect(screen.getByText("openSource")).toBeInTheDocument();
    expect(screen.getByText("communityDriven")).toBeInTheDocument();
    expect(screen.getByText("knowledgeSharing")).toBeInTheDocument();
  });

  it("renders quick start section", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("quickStart")).toBeInTheDocument();
    expect(screen.getByText("exploreUniverse")).toBeInTheDocument();
    expect(screen.getByText("communityAction")).toBeInTheDocument();
  });

  it("shows sign in action for non-authenticated users", () => {
    // Already set in beforeEach
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("signInAction")).toBeInTheDocument();
    expect(screen.getByText("signInActionDesc")).toBeInTheDocument();
  });

  it("shows your notes action for authenticated users", () => {
    // Setup useContext mock to return user
    const React = require("react");
    React.useContext.mockReturnValue({ user: mockUser });

    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("yourNotes")).toBeInTheDocument();
    expect(screen.getByText("yourNotesDesc")).toBeInTheDocument();
  });

  it("renders feature sections", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("whatIsApp")).toBeInTheDocument();
    expect(screen.getByText("mainFeatures")).toBeInTheDocument();
    expect(screen.getByText("personalSharedNotes")).toBeInTheDocument();
    expect(screen.getByText("collaborativeCommunity")).toBeInTheDocument();
    expect(screen.getByText("realTimeReactions")).toBeInTheDocument();
  });

  it("renders how to start section", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("howToStart")).toBeInTheDocument();
    expect(screen.getByText("createAccount")).toBeInTheDocument();
    expect(screen.getByText("exploreCommunity")).toBeInTheDocument();
    expect(screen.getByText("createShare")).toBeInTheDocument();
  });

  it("renders contribution links", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("contribute")).toBeInTheDocument();
    expect(screen.getByText("githubRepo")).toBeInTheDocument();
    expect(screen.getByText("improveApp")).toBeInTheDocument();
    expect(screen.getByText("supportProject")).toBeInTheDocument();
  });

  it("contains external links with proper attributes", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    // Check for GitHub repository link
    const githubLinks = screen
      .getAllByRole("link")
      .filter((link) => link.href && link.href.includes("github.com"));
    expect(githubLinks.length).toBeGreaterThan(0);

    githubLinks.forEach((link) => {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  it("renders footer section", () => {
    render(
      <BrowserRouter>
        <Landing />
      </BrowserRouter>
    );

    expect(screen.getByText("welcomeFooter")).toBeInTheDocument();
  });
});
