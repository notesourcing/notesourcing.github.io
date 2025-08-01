import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n";

// Import feature monitor for development
if (import.meta.env.DEV) {
  import("./utils/featureMonitor.js");
  import("./utils/migration.js");
  import("./utils/testUtils.js");
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
