/**
 * Development Feature Monitor
 * Runs during development to actively monitor critical features
 * Alerts immediately if any critical functionality is removed
 */

class FeatureMonitor {
  constructor() {
    this.isMonitoring = false;
    this.criticalFeatures = new Set();
    this.missingFeatures = new Set();
  }

  // Monitor critical real-time functionality
  monitorRealtimeFeatures() {
    // Check if Dashboard has real-time listeners
    this.checkComponent("Dashboard", () => {
      const dashboardElement = document.querySelector(
        '[data-page="dashboard"]'
      );
      if (dashboardElement && !dashboardElement.dataset.realtimeActive) {
        this.reportMissingFeature("Dashboard real-time listeners");
      }
    });

    // Check if Home has real-time listeners
    this.checkComponent("Home", () => {
      const homeElement = document.querySelector('[data-page="home"]');
      if (homeElement && !homeElement.dataset.realtimeActive) {
        this.reportMissingFeature("Home real-time listeners");
      }
    });
  }

  // Monitor authentication system
  monitorAuthSystem() {
    this.checkComponent("Authentication", () => {
      if (!window.AuthContext || !window.currentUser) {
        this.reportMissingFeature("Authentication system");
      }
    });
  }

  // Monitor SuperAdmin functionality
  monitorSuperAdminFeatures() {
    this.checkComponent("SuperAdmin", () => {
      const user = window.currentUser;
      if (user?.role === "SuperAdmin") {
        const adminElements = document.querySelectorAll("[data-superadmin]");
        if (adminElements.length === 0) {
          this.reportMissingFeature("SuperAdmin UI elements");
        }
      }
    });
  }

  checkComponent(name, checkFunction) {
    try {
      checkFunction();
      this.criticalFeatures.add(name);
    } catch (error) {
      this.reportMissingFeature(`${name}: ${error.message}`);
    }
  }

  reportMissingFeature(feature) {
    if (!this.missingFeatures.has(feature)) {
      this.missingFeatures.add(feature);

      // Create visible warning
      this.showWarning(`🚨 CRITICAL FEATURE MISSING: ${feature}`);

      // Console warning
      console.error(
        `🚨 FEATURE MONITOR: Missing critical feature - ${feature}`
      );
      console.error("📋 Please check FEATURES.md and restore functionality");

      // Development notification
      if (typeof window !== "undefined" && window.parent) {
        window.parent.postMessage(
          {
            type: "FEATURE_MISSING",
            feature: feature,
            message: "Critical feature missing - check FEATURES.md",
          },
          "*"
        );
      }
    }
  }

  showWarning(message) {
    // Only show in development
    if (process.env.NODE_ENV !== "development") return;

    // Create warning banner
    const banner = document.createElement("div");
    banner.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #ff4444;
      color: white;
      padding: 10px;
      text-align: center;
      font-weight: bold;
      z-index: 10000;
      font-family: monospace;
    `;
    banner.textContent = message;

    // Add close button
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "×";
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: white;
      float: right;
      font-size: 20px;
      cursor: pointer;
      margin-left: 10px;
    `;
    closeBtn.onclick = () => banner.remove();
    banner.appendChild(closeBtn);

    document.body.appendChild(banner);

    // Auto-remove after 10 seconds
    setTimeout(() => banner.remove(), 10000);
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    console.log("🛡️ Feature Monitor: Starting development monitoring...");
    this.isMonitoring = true;

    // Run checks every 5 seconds during development
    this.monitorInterval = setInterval(() => {
      this.monitorRealtimeFeatures();
      this.monitorAuthSystem();
      this.monitorSuperAdminFeatures();
    }, 5000);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.isMonitoring = false;
      console.log("🛡️ Feature Monitor: Stopped monitoring");
    }
  }
}

// Auto-start in development mode
let featureMonitor;
if (process.env.NODE_ENV === "development") {
  featureMonitor = new FeatureMonitor();

  // Start monitoring when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => featureMonitor.startMonitoring(), 2000);
    });
  } else {
    setTimeout(() => featureMonitor.startMonitoring(), 2000);
  }
}

export default featureMonitor;
