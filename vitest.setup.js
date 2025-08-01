// Vitest setup for React Testing Library
import "@testing-library/jest-dom";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";

// Global Firebase mock for all tests
const mockApp = {
  name: "[DEFAULT]",
  options: {},
  automaticDataCollectionEnabled: false,
  _providers: new Map(),
  _isDeleted: false,
  container: {
    getProvider: vi.fn(() => ({
      isInitialized: () => true,
      getImmediate: () => mockApp,
    })),
  },
};

vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => mockApp),
  getApp: vi.fn(() => mockApp),
}));

// Firebase Auth mock
const mockAuth = {
  currentUser: null,
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn((callback) => {
    // Call callback with null user immediately
    callback(null);
    // Return unsubscribe function
    return () => {};
  }),
};

vi.mock("firebase/auth", () => ({
  getAuth: vi.fn(() => mockAuth),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  updateProfile: vi.fn(),
  onAuthStateChanged: vi.fn((callback) => {
    callback(null);
    return () => {};
  }),
  connectAuthEmulator: vi.fn(),
}));

// Firebase Firestore mock
const mockDb = {};
vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => mockDb),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false })),
  setDoc: vi.fn(() => Promise.resolve()),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn((query, callback) => {
    callback({ docs: [] });
    return () => {};
  }),
  addDoc: vi.fn(() => Promise.resolve({ id: "mock-id" })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  runTransaction: vi.fn((fn) =>
    fn({
      get: vi.fn(() => Promise.resolve({ exists: () => false })),
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    })
  ),
  getDocs: vi.fn(() => Promise.resolve({ docs: [] })),
  arrayUnion: vi.fn(),
  arrayRemove: vi.fn(),
  serverTimestamp: vi.fn(),
}));

vi.mock("firebase/analytics", () => ({
  getAnalytics: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(false)),
}));

// Clean up the DOM after each test
afterEach(() => {
  cleanup();
});

// Global test utilities
global.mockFirebaseDoc = {
  exists: () => true,
  data: () => ({
    role: "user",
    displayName: "Test User",
    communityCustomNames: {},
  }),
};

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  warn: vi.fn(),
  error: vi.fn(),
  log: vi.fn(),
};
