import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Communities from "../pages/Communities";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

// Mock Firestore functions
vi.mock("firebase/firestore", () => ({
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  onSnapshot: vi.fn(),
  addDoc: vi.fn(),
  serverTimestamp: vi.fn(),
  Timestamp: {
    now: vi.fn(() => ({ toDate: () => new Date() })),
  },
}));

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
  }),
}));

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
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

// Mock AuthContext
vi.mock("../App", () => ({
  AuthContext: React.createContext({ user: null }),
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

// Mock sequential IDs
vi.mock("../utils/sequentialIds", () => ({
  createDocumentWithSequentialId: vi.fn(() =>
    Promise.resolve({ docId: "test-id", sequentialId: 1 })
  ),
}));

// Mock user utils
vi.mock("../utils/userUtils", () => ({
  enrichNotesWithUserData: vi.fn((notes) => Promise.resolve(notes)),
  enrichNotesWithCommunityNames: vi.fn((notes) => Promise.resolve(notes)),
  createRealTimeNotesEnrichment: vi.fn(() => ({
    enrichedNotes: [],
    cleanup: vi.fn(),
  })),
}));

describe("Community Visibility Features", () => {
  const mockUser = { uid: "test-user", email: "test@example.com" };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup useContext mock to return user
    vi.mocked(React.useContext).mockReturnValue({ user: mockUser });

    // Mock onSnapshot to return empty results
    const { onSnapshot } = require("firebase/firestore");
    onSnapshot.mockImplementation((query, callback) => {
      callback({ docs: [] });
      return vi.fn(); // Return unsubscribe function
    });
  });

  it("renders community creation form with visibility options", async () => {
    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    // Click create community button
    const createButton = screen.getByText("createCommunity");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByLabelText("visibility")).toBeInTheDocument();
    });

    // Check visibility options
    expect(screen.getByDisplayValue("public")).toBeInTheDocument();
    expect(screen.getByText("publicCommunity")).toBeInTheDocument();
    expect(screen.getByText("privateCommunity")).toBeInTheDocument();
    expect(screen.getByText("hiddenCommunity")).toBeInTheDocument();
  });

  it("shows different hints for visibility options", async () => {
    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    // Click create community button
    const createButton = screen.getByText("createCommunity");
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText("publicHint")).toBeInTheDocument();
    });

    // Change to private visibility
    const privateOption = screen.getByDisplayValue("private");
    fireEvent.click(privateOption);

    await waitFor(() => {
      expect(screen.getByText("privateHint")).toBeInTheDocument();
    });

    // Change to hidden visibility
    const hiddenOption = screen.getByDisplayValue("hidden");
    fireEvent.click(hiddenOption);

    await waitFor(() => {
      expect(screen.getByText("hiddenHint")).toBeInTheDocument();
    });
  });

  it("renders community sections for different user types", () => {
    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    // Should show admin communities section
    expect(screen.getByText(/👑.*Admin/)).toBeInTheDocument();

    // Should show member communities section
    expect(screen.getByText(/👤.*Membro/)).toBeInTheDocument();

    // Should show other communities section
    expect(screen.getByText(/🌍/)).toBeInTheDocument();
  });

  it("displays overall statistics", () => {
    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    expect(screen.getByText("globalStats")).toBeInTheDocument();
    expect(screen.getByText("totalCommunities")).toBeInTheDocument();
  });

  it("handles community creation with different visibility settings", async () => {
    const {
      createDocumentWithSequentialId,
    } = require("../utils/sequentialIds");

    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    // Click create community button
    const createButton = screen.getByText("createCommunity");
    fireEvent.click(createButton);

    await waitFor(() => {
      const nameInput = screen.getByLabelText("communityName");
      fireEvent.change(nameInput, { target: { value: "Test Community" } });
    });

    // Select private visibility
    const privateOption = screen.getByDisplayValue("private");
    fireEvent.click(privateOption);

    // Submit form
    const confirmButton = screen.getByText("confirm");
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(createDocumentWithSequentialId).toHaveBeenCalledWith(
        "communities",
        expect.objectContaining({
          name: "Test Community",
          visibility: "private",
          creatorId: "test-user",
        })
      );
    });
  });

  it("filters communities for non-authenticated users", () => {
    // Setup useContext mock to return no user
    const React = require("react");
    React.useContext.mockReturnValue({ user: null });

    render(
      <BrowserRouter>
        <Communities />
      </BrowserRouter>
    );

    // Should not show create community button for non-authenticated users
    expect(screen.queryByText("createCommunity")).not.toBeInTheDocument();

    // Should still show community sections but without user-specific sections
    expect(screen.queryByText(/👑.*Admin/)).not.toBeInTheDocument();
    expect(screen.queryByText(/👤.*Membro/)).not.toBeInTheDocument();
  });
});
