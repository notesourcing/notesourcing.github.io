import React from "react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";
import { AuthContext } from "../App";

// Mock user context
export const mockAuthContext = {
  user: null,
  isAdmin: false,
  isSuperAdmin: false,
  userDisplayName: null,
  userCommunityCustomNames: {},
};

// Mock authenticated user context
export const mockAuthenticatedContext = {
  user: {
    uid: "test-uid",
    email: "test@example.com",
    role: "user",
  },
  isAdmin: false,
  isSuperAdmin: false,
  userDisplayName: "Test User",
  userCommunityCustomNames: {},
};

// Mock admin user context
export const mockAdminContext = {
  user: {
    uid: "admin-uid",
    email: "admin@example.com",
    role: "admin",
  },
  isAdmin: true,
  isSuperAdmin: false,
  userDisplayName: "Admin User",
  userCommunityCustomNames: {},
};

// Mock super admin user context
export const mockSuperAdminContext = {
  user: {
    uid: "superadmin-uid",
    email: "superadmin@example.com",
    role: "superadmin",
  },
  isAdmin: true,
  isSuperAdmin: true,
  userDisplayName: "Super Admin",
  userCommunityCustomNames: {},
};

// Test wrapper with AuthContext and Router
export const TestWrapper = ({ children, authContext = mockAuthContext }) => {
  return (
    <AuthContext.Provider value={authContext}>
      <BrowserRouter>{children}</BrowserRouter>
    </AuthContext.Provider>
  );
};

// Test wrapper only with AuthContext (for components that don't need routing)
export const AuthTestWrapper = ({
  children,
  authContext = mockAuthContext,
}) => {
  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
};

// Test wrapper only with Router (for components that don't need auth)
export const RouterTestWrapper = ({ children }) => {
  return <BrowserRouter>{children}</BrowserRouter>;
};

// Mock navigate function
export const mockNavigate = vi.fn();

// Mock location object
export const mockLocation = {
  pathname: "/",
  search: "",
  hash: "",
  state: null,
};

// Mock params object
export const mockParams = {
  id: "test-id",
};
