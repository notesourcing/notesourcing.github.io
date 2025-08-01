import { renderHook } from "@testing-library/react-hooks";
import { vi } from "vitest";
import { useAppName } from "../hooks/useAppName";

// Mock the appName utility
vi.mock("../utils/appName", () => ({
  getAppName: vi.fn(() => "NoteSourcing"),
}));

describe("useAppName", () => {
  it("returns app name", () => {
    const { result } = renderHook(() => useAppName());
    expect(result.current).toMatch(/notesourcing/i);
  });
});
