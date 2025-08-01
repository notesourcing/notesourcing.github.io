import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import LanguageSwitcher from "../components/LanguageSwitcher";

// Mock react-i18next
const mockChangeLanguage = vi.fn();
vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: "it",
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

describe("LanguageSwitcher", () => {
  it("renders language switcher with default language", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    expect(select).toBeInTheDocument();
    expect(select.value).toBe("it");
  });

  it("calls changeLanguage when language is changed", () => {
    render(<LanguageSwitcher />);

    const select = screen.getByRole("combobox");
    fireEvent.change(select, { target: { value: "en" } });

    expect(mockChangeLanguage).toHaveBeenCalledWith("en");
  });
});
