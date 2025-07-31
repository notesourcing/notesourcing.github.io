#!/usr/bin/env node

/**
 * Feature Validation Script
 * Checks that critical features are still present in the codebase
 */

const fs = require("fs");
const path = require("path");

const CRITICAL_FEATURES = [
  {
    name: "Real-time listeners in Dashboard",
    file: "src/pages/Dashboard.jsx",
    pattern: /onSnapshot.*notes/,
    description: "Dashboard must have real-time personal notes listener",
  },
  {
    name: "Real-time listeners in Home",
    file: "src/pages/Home.jsx",
    pattern: /onSnapshot/,
    description: "Home page must have real-time listeners for notes",
  },
  {
    name: "SuperAdmin role check in Dashboard",
    file: "src/pages/Dashboard.jsx",
    pattern: /SuperAdmin/,
    description: "Dashboard must preserve SuperAdmin functionality",
  },
  {
    name: "Community shared notes functionality",
    file: "src/pages/Community.jsx",
    pattern: /handleAddSharedNote/,
    description: "Community page must allow adding shared notes",
  },
  {
    name: "Authentication context",
    file: "src/App.jsx",
    pattern: /AuthContext|UserContext/,
    description: "App must maintain authentication context",
  },
  {
    name: "Firebase configuration",
    file: "src/firebase.js",
    pattern: /initializeApp/,
    description: "Firebase configuration must be present",
  },
  {
    name: "Real-time cleanup in useEffect",
    file: "src/pages/Dashboard.jsx",
    pattern: /unsubNotes\(\)|unsubSharedNotes\(\)/,
    description: "Dashboard must properly cleanup real-time listeners",
  },
  {
    name: "Note page exists",
    file: "src/pages/Note.jsx",
    pattern: /function Note|export.*Note/,
    description: "Note page component must exist",
  },
  {
    name: "Reaction system",
    file: "src/pages/Home.jsx",
    pattern: /reaction|like|heart/i,
    description: "Home page must maintain note reactions",
  },
  {
    name: "Communities link in Dashboard",
    file: "src/pages/Dashboard.jsx",
    pattern: /comunità|communities/i,
    description: "Dashboard must link to Communities page",
  },
];

let allPassed = true;

console.log("🔍 Validating critical features...\n");

for (const feature of CRITICAL_FEATURES) {
  const filePath = path.join(process.cwd(), feature.file);

  if (!fs.existsSync(filePath)) {
    console.log(`❌ MISSING FILE: ${feature.file}`);
    console.log(`   Required for: ${feature.description}\n`);
    allPassed = false;
    continue;
  }

  const content = fs.readFileSync(filePath, "utf8");

  if (!feature.pattern.test(content)) {
    console.log(`❌ MISSING FEATURE: ${feature.name}`);
    console.log(`   File: ${feature.file}`);
    console.log(`   Description: ${feature.description}\n`);
    allPassed = false;
  } else {
    console.log(`✅ ${feature.name}`);
  }
}

if (allPassed) {
  console.log("\n🎉 All critical features are present!");
  process.exit(0);
} else {
  console.log("\n🚨 CRITICAL FEATURES MISSING!");
  console.log("📋 Please review FEATURES.md and restore missing functionality");
  console.log("🔧 Run: npm run features");
  process.exit(1);
}
