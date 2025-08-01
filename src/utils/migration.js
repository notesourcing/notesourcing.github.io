/**
 * Migration script to initialize sequential IDs for existing documents
 * Run this once to migrate existing data to use sequential IDs
 */
import {
  initializeSequentialIds,
  getCollectionsForSequentialIds,
} from "./sequentialIds.js";

/**
 * Run the complete migration for all collections
 */
export const runSequentialIdMigration = async () => {
  console.log("🚀 Starting sequential ID migration...");

  const collections = getCollectionsForSequentialIds();
  const results = {
    success: [],
    errors: [],
  };

  for (const collectionName of collections) {
    try {
      console.log(`\n📦 Processing collection: ${collectionName}`);
      await initializeSequentialIds(collectionName);
      results.success.push(collectionName);
      console.log(`✅ Successfully migrated ${collectionName}`);
    } catch (error) {
      console.error(`❌ Error migrating ${collectionName}:`, error);
      results.errors.push({ collection: collectionName, error: error.message });
    }
  }

  console.log("\n🎉 Migration complete!");
  console.log(`✅ Successful: ${results.success.join(", ")}`);
  if (results.errors.length > 0) {
    console.log(
      `❌ Errors: ${results.errors.map((e) => e.collection).join(", ")}`
    );
    console.log("Error details:", results.errors);
  }

  return results;
};

// For browser console usage
if (typeof window !== "undefined") {
  window.runSequentialIdMigration = runSequentialIdMigration;
  console.log(
    "💡 Migration function available as window.runSequentialIdMigration()"
  );
}
