export const getAppName = () => {
  const hostname = window.location.hostname;
  if (hostname.includes("rivelazioni.github.io")) {
    return "Rivelazioni";
  }
  if (hostname.includes("galuy.github.io")) {
    return "Galuy";
  }
  if (hostname.includes("notesourcing.github.io")) {
    return "NoteSourcing";
  }
  // Default to NoteSourcing for localhost and other domains
  return "NoteSourcing";
};

/**
 * Updates the document title with the app name
 * @param {string} pageTitle - Optional page title to append
 */
export const updateDocumentTitle = (pageTitle = "") => {
  const appName = getAppName();
  document.title = pageTitle ? `${pageTitle} - ${appName}` : appName;
};
