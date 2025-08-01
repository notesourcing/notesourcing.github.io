import { describe, it, expect, vi, beforeEach } from "vitest";
import { createDocumentWithSequentialId } from "../utils/sequentialIds";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import React from "react";
import Communities from "../pages/Communities";
import { AuthContext } from "../App";

// Mock Firebase
vi.mock("../firebase", () => ({
  db: {},
}));

// Mock Firestore functions
const adminCommunity = {
  id: "admin-1",
  data: () => ({
    name: "Admin Community",
    visibility: "public",
    creatorId: "test-user",
    members: ["test-user"],
    admins: ["test-user"],
    created: { toDate: () => new Date() },
  }),
};
const memberCommunity = {
  id: "member-1",
  data: () => ({
    name: "Member Community",
    visibility: "public",
    creatorId: "other-user",
    members: ["test-user"],
    admins: ["other-user"],
    created: { toDate: () => new Date() },
  }),
};
vi.mock("firebase/firestore", async () => {
  const firestore = await vi.importActual("firebase/firestore");
  const mockNote = {
    id: "note-1",
    communityId: "admin-1",
    reactions: { "👍": ["user-1", "user-2"] },
    created: { toDate: () => new Date() },
  };
  const mockComment = { id: "comment-1", noteId: "note-1" };

  return {
    ...firestore,
    collection: vi.fn((db, name) => ({
      name,
      withConverter: vi.fn(() => ({ name, converter: true })),
    })),
    query: vi.fn((coll, ...constraints) => ({ ...coll, constraints })),
    orderBy: vi.fn((field, direction = "asc") => ({
      type: "orderBy",
      field,
      direction,
    })),
    where: vi.fn((field, op, value) => ({
      type: "where",
      field,
      op,
      value,
    })),
    onSnapshot: vi.fn((query, callback) => {
      const collectionName = query.name;
      if (collectionName === "communities") {
        callback({
          docs: [adminCommunity, memberCommunity].map((doc) => ({
            id: doc.id,
            data: doc.data,
          })),
        });
      } else if (collectionName === "notes") {
        callback({
          docs: [{ id: "note-1", data: () => mockNote }],
        });
      } else if (collectionName === "comments") {
        callback({
          docs: [{ id: "comment-1", data: () => mockComment }],
        });
      } else if (collectionName === "users") {
        callback({ docs: [] });
      }
      return () => {}; // Return an unsubscribe function
    }),
    addDoc: vi.fn(),
    getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
    doc: vi.fn((db, collectionName, docId) => ({
      db,
      collectionName,
      docId,
    })),
    serverTimestamp: vi.fn(),
    Timestamp: {
      now: vi.fn(() => ({ toDate: () => new Date() })),
    },
  };
});

// Mock react-i18next
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        yourCommunities: "Le tue Community",
        allCommunities: "Tutte le Community",
        loadingCommunities: "Loading communities...",
        globalStats: "Statistiche Globali",
        totalCommunities: "Community Totali",
        totalNotes: "Note Totali",
        totalComments: "Commenti Totali",
        totalReactions: "Reazioni Totali",
        createCommunity: "Crea Community",
        confirm: "Conferma",
        communityNamePlaceholder: "Nome della Community",
        noOtherCommunitiesAvailable: "Non ci sono altre community disponibili.",
        publicCommunity: "Community Pubblica",
        privateCommunity: "Community Privata",
        hiddenCommunity: "Community Nascosta",
        publicHint: "Visibile a tutti gli utenti.",
        privateHint: "Visibile solo ai membri invitati.",
        hiddenHint: "Visibile solo ai membri e non elencata.",
        Admin: "Admin",
        Membro: "Membro",
      };
      return translations[key] || key;
    },
  }),
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
vi.mock("../utils/sequentialIds", () => {
  return {
    createDocumentWithSequentialId: vi.fn(() =>
      Promise.resolve({ docId: "test-id", sequentialId: 1 })
    ),
    getSequentialIdFromFirebase: vi.fn((_coll, docId) => Promise.resolve(1)),
  };
});

// Mock user utils
vi.mock("../utils/userUtils", () => ({
  enrichNotesWithUserData: vi.fn((notes) => Promise.resolve(notes)),
  enrichNotesWithCommunityNames: vi.fn((notes) => Promise.resolve(notes)),
  createRealTimeNotesEnrichment: vi.fn((communities) => ({
    enrichedNotes: communities.map((community) => ({
      ...community,
      creatorDisplayName:
        community.authorDisplayName ||
        community.authorEmail?.split("@")[0] ||
        "Creatore Sconosciuto",
    })),
    cleanup: vi.fn(),
  })),
}));

describe("Community Visibility Features", () => {
  const mockUser = { uid: "test-user", email: "test@example.com" };

  const renderComponent = (user) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user }}>
          <Communities />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders community creation form with visibility options", async () => {
    renderComponent(mockUser);

    // Wait for loading to finish and create button to appear
    await waitFor(() => {
      expect(screen.getByText("Crea Community")).toBeInTheDocument();
    });

    // Click create community button
    const createButton = screen.getByText("Crea Community");
    fireEvent.click(createButton);

    // Wait for the select to appear
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Check visibility options
    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(screen.getByText("Community Pubblica")).toBeInTheDocument();
    expect(screen.getByText("Community Privata")).toBeInTheDocument();
    expect(screen.getByText("Community Nascosta")).toBeInTheDocument();
  });

  it("shows different hints for visibility options", async () => {
    renderComponent(mockUser);

    // Wait for loading to finish and create button to appear
    await waitFor(() => {
      expect(screen.getByText("Crea Community")).toBeInTheDocument();
    });

    // Click create community button
    const createButton = screen.getByText("Crea Community");
    fireEvent.click(createButton);

    // Wait for the select to appear
    await waitFor(() => {
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    // Should show public hint
    expect(
      screen.getByText("Visibile a tutti gli utenti.")
    ).toBeInTheDocument();

    // Change to private visibility
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "private" } });

    await waitFor(() => {
      expect(
        screen.getByText("Visibile solo ai membri invitati.")
      ).toBeInTheDocument();
    });

    // Change to hidden visibility
    fireEvent.change(select, { target: { value: "hidden" } });

    await waitFor(() => {
      expect(
        screen.getByText("Visibile solo ai membri e non elencata.")
      ).toBeInTheDocument();
    });
  });

  it("renders community sections for different user types", async () => {
    renderComponent(mockUser);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loadingCommunities/i)).not.toBeInTheDocument();
    });

    // Should show admin and member communities section headers (robust to element splits)
    await waitFor(() => {
      const h2s = screen.getAllByRole("heading", { level: 2 });
      // Italian: "👑 Le tue Community (Admin)"
      const adminHeader = h2s.find(
        (h) =>
          h.textContent &&
          h.textContent.includes("👑") &&
          h.textContent.includes("Le tue Community") &&
          h.textContent.includes("Admin")
      );
      expect(adminHeader).toBeTruthy();
      // Italian: "👤 Le tue Community (Membro)"
      const memberHeader = h2s.find(
        (h) =>
          h.textContent &&
          h.textContent.includes("👤") &&
          h.textContent.includes("Le tue Community") &&
          h.textContent.includes("Membro")
      );
      expect(memberHeader).toBeTruthy();
      // Should show other communities section (Italian header)
      expect(
        h2s.some((h) => h.textContent && h.textContent.includes("🌍"))
      ).toBe(true);
    });
  });

  it("displays overall statistics", async () => {
    renderComponent(mockUser);

    // Wait for loading to finish
    await waitFor(() => {
      expect(screen.queryByText(/loadingCommunities/i)).not.toBeInTheDocument();
    });

    // The heading includes an emoji, so use a function matcher
    expect(
      screen.getByText((content) => content.includes("Statistiche Globali"))
    ).toBeInTheDocument();
    expect(screen.getByText("Community Totali")).toBeInTheDocument();
  });

  it("handles community creation with different visibility settings", async () => {
    renderComponent(mockUser);

    // Wait for loading to finish and create button to appear
    await waitFor(() => {
      expect(screen.getByText("Crea Community")).toBeInTheDocument();
    });

    // Click create community button
    const createButton = screen.getByText("Crea Community");
    fireEvent.click(createButton);

    await waitFor(() => {
      const nameInput = screen.getByPlaceholderText("Nome della Community");
      fireEvent.change(nameInput, { target: { value: "Test Community" } });
    });

    // Select private visibility
    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "private" } });

    // Submit form
    const confirmButton = screen.getByText("Conferma");
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
    renderComponent(null);

    // Should not show create community button for non-authenticated users
    expect(screen.queryByText("Crea Community")).not.toBeInTheDocument();

    // Should still show community sections but without user-specific sections
    expect(screen.queryByText(/👑.*Admin/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/👤.*Membro/i)).not.toBeInTheDocument();
  });
});
