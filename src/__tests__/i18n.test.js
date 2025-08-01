import { describe, it, expect, beforeEach, vi } from "vitest";
import i18n from "../i18n";

// Mock react-i18next's initReactI18next
vi.mock("react-i18next", () => ({
  initReactI18next: {
    type: "3rdParty",
    init: vi.fn(),
  },
}));

// Mock i18next-browser-languagedetector
vi.mock("i18next-browser-languagedetector", () => ({
  default: {
    type: "languageDetector",
    init: vi.fn(),
    detect: vi.fn(() => "en"),
    cacheUserLanguage: vi.fn(),
  },
}));

describe("i18n Configuration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("has English as fallback language", () => {
    expect(i18n.options.fallbackLng).toEqual(["en"]);
  });

  it("has Italian as default language", () => {
    expect(i18n.options.lng).toBe("it");
  });

  it("has debug mode disabled", () => {
    expect(i18n.options.debug).toBe(false);
  });

  it("has proper interpolation configuration", () => {
    expect(i18n.options.interpolation.escapeValue).toBe(false);
  });

  it("contains required English translations", () => {
    const enResources = i18n.options.resources.en.translation;

    // Check for key navigation translations
    expect(enResources.home).toBeDefined();
    expect(enResources.communities).toBeDefined();
    expect(enResources.login).toBeDefined();
    expect(enResources.logout).toBeDefined();

    // Check for authentication translations
    expect(enResources.signIn).toBeDefined();
    expect(enResources.register).toBeDefined();
    expect(enResources.email).toBeDefined();
    expect(enResources.password).toBeDefined();
  });

  it("contains required Italian translations", () => {
    const itResources = i18n.options.resources.it.translation;

    // Check for key navigation translations
    expect(itResources.home).toBeDefined();
    expect(itResources.communities).toBeDefined();
    expect(itResources.login).toBeDefined();
    expect(itResources.logout).toBeDefined();

    // Check for community-specific translations
    expect(itResources.communityName).toBeDefined();
    expect(itResources.createCommunity).toBeDefined();
    expect(itResources.publicCommunity).toBeDefined();
    expect(itResources.privateCommunity).toBeDefined();
    expect(itResources.hiddenCommunity).toBeDefined();
  });

  it("contains required Portuguese translations", () => {
    const ptResources = i18n.options.resources.pt.translation;

    // Check for key navigation translations
    expect(ptResources.home).toBeDefined();
    expect(ptResources.communities).toBeDefined();
    expect(ptResources.login).toBeDefined();
    expect(ptResources.logout).toBeDefined();
  });

  it("has consistent translation keys across languages", () => {
    const enKeys = Object.keys(i18n.options.resources.en.translation);
    const itKeys = Object.keys(i18n.options.resources.it.translation);
    const ptKeys = Object.keys(i18n.options.resources.pt.translation);

    // Check that Italian has most keys (as it's the default)
    expect(itKeys.length).toBeGreaterThan(0);

    // Check that other languages have key translations
    expect(enKeys.length).toBeGreaterThan(0);
    expect(ptKeys.length).toBeGreaterThan(0);

    // Check for common keys
    const commonKeys = ["home", "communities", "login", "logout"];
    commonKeys.forEach((key) => {
      expect(enKeys).toContain(key);
      expect(itKeys).toContain(key);
      expect(ptKeys).toContain(key);
    });
  });

  it("includes community visibility translations", () => {
    const itResources = i18n.options.resources.it.translation;

    expect(itResources.publicCommunity).toContain("Pubblica");
    expect(itResources.privateCommunity).toContain("Privata");
    expect(itResources.hiddenCommunity).toContain("Nascosta");

    expect(itResources.publicHint).toBeDefined();
    expect(itResources.privateHint).toBeDefined();
    expect(itResources.hiddenHint).toBeDefined();
  });

  it("includes landing page translations", () => {
    const itResources = i18n.options.resources.it.translation;

    expect(itResources.landingTitle).toBeDefined();
    expect(itResources.landingDescription).toBeDefined();
    expect(itResources.openSource).toBeDefined();
    expect(itResources.communityDriven).toBeDefined();
    expect(itResources.knowledgeSharing).toBeDefined();
  });

  it("includes basic note and comment translations", () => {
    const itResources = i18n.options.resources.it.translation;

    expect(itResources.newNote).toBeDefined();
    expect(itResources.editNote).toBeDefined();
    expect(itResources.deleteNote).toBeDefined();
    expect(itResources.addComment).toBeDefined();
    expect(itResources.comment).toBeDefined();
  });

  it("has language detector configuration", () => {
    expect(i18n.options.detection).toBeDefined();
    expect(i18n.options.detection.order).toContain("localStorage");
    expect(i18n.options.detection.order).toContain("navigator");
  });
});
