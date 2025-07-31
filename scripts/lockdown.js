#!/usr/bin/env node

/**
 * Feature Lockdown Manager
 * Provides maximum protection by creating file locks during AI development sessions
 */

const fs = require("fs");
const path = require("path");

const CRITICAL_FILES = [
  "src/pages/Dashboard.jsx",
  "src/pages/Home.jsx",
  "src/pages/Community.jsx",
  "src/App.jsx",
  "src/firebase.js",
  "FEATURES.md",
];

class FeatureLockdownManager {
  constructor() {
    this.lockDir = ".feature-locks";
    this.isLocked = false;
  }

  async enableLockdown() {
    console.log("🔒 Enabling Feature Lockdown Mode...");

    // Create lock directory
    if (!fs.existsSync(this.lockDir)) {
      fs.mkdirSync(this.lockDir);
    }

    // Create backup and lock files
    for (const file of CRITICAL_FILES) {
      if (fs.existsSync(file)) {
        const backupPath = path.join(
          this.lockDir,
          path.basename(file) + ".backup"
        );
        const lockPath = path.join(this.lockDir, path.basename(file) + ".lock");

        // Create backup
        fs.copyFileSync(file, backupPath);

        // Create lock file with checksum
        const content = fs.readFileSync(file, "utf8");
        const checksum = this.generateChecksum(content);
        fs.writeFileSync(
          lockPath,
          JSON.stringify({
            file: file,
            checksum: checksum,
            timestamp: new Date().toISOString(),
            locked: true,
          })
        );

        console.log(`🔒 Locked: ${file}`);
      }
    }

    this.isLocked = true;
    console.log("✅ Feature Lockdown Mode ACTIVE - Critical files protected");
    console.log('💡 Run "npm run unlock-features" to disable lockdown');
  }

  async disableLockdown() {
    console.log("🔓 Disabling Feature Lockdown Mode...");

    if (fs.existsSync(this.lockDir)) {
      fs.rmSync(this.lockDir, { recursive: true });
      console.log("✅ Feature Lockdown Mode DISABLED");
    }

    this.isLocked = false;
  }

  async checkLocks() {
    if (!fs.existsSync(this.lockDir)) {
      console.log("🔓 No lockdown active");
      return true;
    }

    console.log("🔍 Checking file integrity under lockdown...");
    let allValid = true;

    for (const file of CRITICAL_FILES) {
      const lockPath = path.join(this.lockDir, path.basename(file) + ".lock");

      if (fs.existsSync(lockPath) && fs.existsSync(file)) {
        const lockData = JSON.parse(fs.readFileSync(lockPath, "utf8"));
        const currentContent = fs.readFileSync(file, "utf8");
        const currentChecksum = this.generateChecksum(currentContent);

        if (currentChecksum !== lockData.checksum) {
          console.log(`🚨 LOCKDOWN VIOLATION: ${file} has been modified!`);
          console.log(`📋 Original checksum: ${lockData.checksum}`);
          console.log(`📋 Current checksum:  ${currentChecksum}`);
          allValid = false;

          // Restore from backup
          const backupPath = path.join(
            this.lockDir,
            path.basename(file) + ".backup"
          );
          if (fs.existsSync(backupPath)) {
            fs.copyFileSync(backupPath, file);
            console.log(`🔄 Restored ${file} from backup`);
          }
        }
      }
    }

    if (allValid) {
      console.log("✅ All locked files intact");
    } else {
      console.log("🚨 LOCKDOWN VIOLATIONS DETECTED AND RESTORED");
    }

    return allValid;
  }

  generateChecksum(content) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  async status() {
    if (fs.existsSync(this.lockDir)) {
      const lockFiles = fs
        .readdirSync(this.lockDir)
        .filter((f) => f.endsWith(".lock"));
      console.log(`🔒 Lockdown ACTIVE - ${lockFiles.length} files protected`);
      return true;
    } else {
      console.log("🔓 Lockdown INACTIVE");
      return false;
    }
  }
}

// CLI Interface
const action = process.argv[2];
const manager = new FeatureLockdownManager();

switch (action) {
  case "enable":
    manager.enableLockdown();
    break;
  case "disable":
    manager.disableLockdown();
    break;
  case "check":
    manager.checkLocks();
    break;
  case "status":
    manager.status();
    break;
  default:
    console.log("🔒 Feature Lockdown Manager");
    console.log(
      "Usage: node scripts/lockdown.js [enable|disable|check|status]"
    );
    console.log("");
    console.log("Commands:");
    console.log("  enable  - Lock critical files against modification");
    console.log("  disable - Remove all locks");
    console.log("  check   - Verify file integrity and restore if needed");
    console.log("  status  - Show current lockdown status");
}
