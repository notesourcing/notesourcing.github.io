#!/usr/bin/env node

/**
 * Advanced Feature Integrity Guard
 * Performs deep validation of critical application structure and functionality
 */

const fs = require("fs");
const path = require("path");

class FeatureIntegrityGuard {
  constructor() {
    this.errors = [];
    this.warnings = [];
    this.checks = 0;
  }

  checkFileStructure() {
    console.log("🔍 Checking file structure...");

    const requiredFiles = [
      "src/App.jsx",
      "src/firebase.js",
      "src/pages/Dashboard.jsx",
      "src/pages/Home.jsx",
      "src/pages/Community.jsx",
      "src/pages/Login.jsx",
      "src/pages/Note.jsx",
      "FEATURES.md",
      "CONTRIBUTING.md",
    ];

    for (const file of requiredFiles) {
      this.checks++;
      if (!fs.existsSync(file)) {
        this.errors.push(`Missing critical file: ${file}`);
      }
    }
  }

  checkRealtimeListeners() {
    console.log("🔍 Checking real-time listeners...");

    const filesToCheck = [
      {
        file: "src/pages/Dashboard.jsx",
        requires: ["onSnapshot", "return () =>"],
      },
      { file: "src/pages/Home.jsx", requires: ["onSnapshot", "return () =>"] },
      { file: "src/pages/Community.jsx", requires: ["onSnapshot"] },
    ];

    for (const { file, requires } of filesToCheck) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, "utf8");

      for (const pattern of requires) {
        this.checks++;
        if (!content.includes(pattern)) {
          this.errors.push(
            `${file}: Missing ${pattern} - real-time functionality may be broken`
          );
        }
      }
    }
  }

  checkCriticalFunctions() {
    console.log("🔍 Checking critical functions...");

    const functionChecks = [
      {
        file: "src/pages/Dashboard.jsx",
        functions: ["handleAddNote", "handleDeleteNote"],
      },
      { file: "src/pages/Community.jsx", functions: ["handleAddSharedNote"] },
      { file: "src/pages/Home.jsx", functions: ["handleReaction"] },
    ];

    for (const { file, functions } of functionChecks) {
      if (!fs.existsSync(file)) continue;

      const content = fs.readFileSync(file, "utf8");

      for (const func of functions) {
        this.checks++;
        if (!content.includes(func)) {
          this.warnings.push(`${file}: Function ${func} might be missing`);
        }
      }
    }
  }

  checkAuthenticationSystem() {
    console.log("🔍 Checking authentication system...");

    if (fs.existsSync("src/App.jsx")) {
      const content = fs.readFileSync("src/App.jsx", "utf8");

      this.checks++;
      if (!content.includes("AuthContext")) {
        this.errors.push(
          "src/App.jsx: AuthContext missing - authentication system broken"
        );
      }

      this.checks++;
      if (
        !content.includes("isSuperAdmin") &&
        !content.includes("SuperAdmin")
      ) {
        this.warnings.push(
          "src/App.jsx: SuperAdmin role system might be missing"
        );
      }
    }
  }

  checkFirebaseConfig() {
    console.log("🔍 Checking Firebase configuration...");

    if (fs.existsSync("src/firebase.js")) {
      const content = fs.readFileSync("src/firebase.js", "utf8");

      const requiredFirebaseFeatures = [
        "initializeApp",
        "getFirestore",
        "getAuth",
      ];

      for (const feature of requiredFirebaseFeatures) {
        this.checks++;
        if (!content.includes(feature)) {
          this.errors.push(
            `src/firebase.js: Missing ${feature} - Firebase functionality broken`
          );
        }
      }
    }
  }

  checkDocumentation() {
    console.log("🔍 Checking documentation integrity...");

    if (fs.existsSync("FEATURES.md")) {
      const content = fs.readFileSync("FEATURES.md", "utf8");

      this.checks++;
      if (!content.includes("DO NOT REMOVE")) {
        this.warnings.push("FEATURES.md: Missing 'DO NOT REMOVE' warnings");
      }

      this.checks++;
      if (content.length < 1000) {
        this.warnings.push(
          "FEATURES.md: Documentation seems incomplete (too short)"
        );
      }
    }

    if (fs.existsSync("CONTRIBUTING.md")) {
      const content = fs.readFileSync("CONTRIBUTING.md", "utf8");

      this.checks++;
      if (!content.includes("AI Agent")) {
        this.warnings.push(
          "CONTRIBUTING.md: Missing AI Agent specific instructions"
        );
      }
    }
  }

  generateReport() {
    console.log("\n" + "=".repeat(60));
    console.log("🛡️  FEATURE INTEGRITY REPORT");
    console.log("=".repeat(60));

    console.log(`\n📊 Performed ${this.checks} integrity checks`);

    if (this.errors.length === 0 && this.warnings.length === 0) {
      console.log(
        "\n🎉 ALL CHECKS PASSED! Your codebase integrity is excellent!"
      );
      return true;
    }

    if (this.errors.length > 0) {
      console.log(`\n❌ CRITICAL ERRORS (${this.errors.length}):`);
      this.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

    if (this.warnings.length > 0) {
      console.log(`\n⚠️  WARNINGS (${this.warnings.length}):`);
      this.warnings.forEach((warning, i) => {
        console.log(`   ${i + 1}. ${warning}`);
      });
    }

    if (this.errors.length > 0) {
      console.log("\n🚨 IMMEDIATE ACTION REQUIRED!");
      console.log("📋 Review FEATURES.md and restore missing functionality");
      console.log("🔧 Run: npm run features");
      return false;
    } else {
      console.log("\n✅ No critical issues found, but please review warnings.");
      return true;
    }
  }

  run() {
    console.log("🛡️  Starting comprehensive feature integrity check...\n");

    this.checkFileStructure();
    this.checkRealtimeListeners();
    this.checkCriticalFunctions();
    this.checkAuthenticationSystem();
    this.checkFirebaseConfig();
    this.checkDocumentation();

    const passed = this.generateReport();
    process.exit(passed ? 0 : 1);
  }
}

// Run the integrity guard
const guard = new FeatureIntegrityGuard();
guard.run();
