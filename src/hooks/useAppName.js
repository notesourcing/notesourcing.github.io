import { useMemo } from "react";
import { getAppName } from "../utils/appName";

/**
 * Custom hook to get the current app name based on hostname
 * @returns {string} The app name (NoteSourcing, Rivelazioni, or Galuy)
 */
export const useAppName = () => {
  return useMemo(() => getAppName(), []);
};
