#!/usr/bin/env node

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Get all test files
const testDir = "./src/__tests__";
const testFiles = fs
  .readdirSync(testDir)
  .filter((file) => file.endsWith(".test.js") || file.endsWith(".test.jsx"))
  .map((file) => path.join(testDir, file));

console.log(`Found ${testFiles.length} test files`);

let passed = 0;
let failed = 0;
const failedFiles = [];

async function runSingleTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n🧪 Running: ${testFile}`);

    const child = spawn(
      "node",
      [
        "--max-old-space-size=2048", // Increased memory for all tests
        "./node_modules/.bin/vitest",
        "run",
        "--config",
        "vitest.config.js",
        testFile,
      ],
      {
        stdio: "inherit",
        env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=2048" },
      }
    );

    child.on("close", (code) => {
      if (code === 0) {
        console.log(`✅ PASSED: ${testFile}`);
        passed++;
      } else {
        console.log(`❌ FAILED: ${testFile}`);
        failed++;
        failedFiles.push(testFile);
      }
      resolve();
    });
  });
}

async function runAllTests() {
  console.log("🚀 Starting individual test runs...\n");

  for (const testFile of testFiles) {
    await runSingleTest(testFile);
    // Small delay to allow garbage collection
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n📊 FINAL RESULTS:");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);

  if (failedFiles.length > 0) {
    console.log("\n🔴 Failed files:");
    failedFiles.forEach((file) => console.log(`  - ${file}`));
  }

  process.exit(failed > 0 ? 1 : 0);
}

runAllTests().catch(console.error);
