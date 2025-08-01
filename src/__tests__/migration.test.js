import { vi } from "vitest";
import { runSequentialIdMigration } from "../utils/migration";

// Mock sequential IDs utility
vi.mock("../utils/sequentialIds", () => ({
  initializeSequentialIds: vi.fn(() => Promise.resolve()),
  getCollectionsForSequentialIds: vi.fn(() => ["notes", "communities"]),
}));

describe("migration", () => {
  it("should migrate data", async () => {
    const result = await runSequentialIdMigration();
    expect(result).toBeDefined(); // Function returns a result object
  });
});
