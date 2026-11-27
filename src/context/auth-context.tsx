// context/auth-context.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { installSessionExpiryInterceptor } from "@/lib/session";
import { endCookieSession, getAuthToken, isCookieMode, sessionRequest } from "@/lib/client-auth";
import { COOKIE_SESSION_SENTINEL } from "@/lib/auth-cookie";
import type { OrganizationMembership } from "@/types/organization";
import { deriveDisplayRole } from "@/lib/roles";
import type { PlatformInfo, PlatformPermission } from "@/lib/roles";

interface User {
  id: string;
  phone: string;
  country_code?: string;
  last_name: string;
  first_name: string;
  email: string;
  name: string;
  /**
   * Display role. V2 Phase 3c: the backend sends the platform role ('user' | 'admin' | 'listing_agent')
   * and a derived `is_vendor`; this field is 'vendor' for a derived vendor so existing role checks keep working.
   */
  role: string;
  /** V2 Phase 3c: derived by the backend from listing ownership / membership. */
  isVendor: boolean;
  image?: string;
  avatar?: string;
  profile_photo_url?: string;
  /** V2: backend feature switches (always present from the API; default off). */
  features: { organizations: boolean; teams: boolean; lifecycle: boolean; sensitive_review: boolean; billing_admin: boolean; org_billing: boolean };
  // The signed-in user's own capabilities. UI hint only: Laravel enforces them.
  permissions?: {
    manage_billing: boolean;
  };
  /** V2 Phase 3b.6: platform role and the permissions the backend grants right now. Absent from an older backend. */
  platform?: PlatformInfo;
  /** V2: the user's organizations. Empty unless features.organizations. */
  organizations: OrganizationMembership[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isUnverified: boolean;
  /** Pass the token in legacy mode; call with no argument after a cookie session was started. */
  login: (token?: string) => Promise<void>;
  logout: () => void | Promise<void>;
  refetchUser: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const fetchUserProfile = async (token: string) => {
    setLoading(true);
    setIsUnverified(false); // Reset unverified state

    try {

      const res = await fetch(`/api/user`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      if (res.status === 401) {
        // Unauthorized - clear everything
        localStorage.removeItem("authToken");
        setUser(null);
        setIsAuthenticated(false);
        setIsUnverified(false);
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        // Forbidden - likely unverified email
        setIsAuthenticated(false);
        setIsUnverified(true);
        setUser(null);
        setLoading(false);
        return; // Keep the token, don't clear it
      }

      if (res.ok) {
        const userData = await res.json();

        // Handle different backend response structures
        const raw = userData?.user ?? userData?.data ?? userData;

        const mappedUser: User = {
          id: raw?.id || "",
          name: raw?.name || raw?.username || `${raw?.first_name ?? ""} ${raw?.last_name ?? ""}`.trim() || raw?.email?.split("@")[0] || "User",
          role: deriveDisplayRole(raw?.role || raw?.user_type || "User", raw?.is_vendor === true),
          isVendor: raw?.is_vendor === true || String(raw?.role ?? "").toLowerCase() === "vendor",
          image: raw?.image || raw?.avatar || raw?.profile_picture || undefined,
          email: raw?.email || "",
          last_name: raw?.last_name || "",
          first_name: raw?.first_name || "",
          phone: raw?.phone || "",
          country_code: raw?.country_code || "",
          // V2 Phase 1: the backend decides whether organizations exist, so a
          // separately deployed frontend can never disagree with it.
          features: {
            organizations: raw?.features?.organizations === true,
            teams: raw?.features?.teams === true,
            lifecycle: raw?.features?.lifecycle === true,
            sensitive_review: raw?.features?.sensitive_review === true,
            billing_admin: raw?.features?.billing_admin === true,
            org_billing: raw?.features?.org_billing === true,
          },
          organizations: Array.isArray(raw?.organizations) ? raw.organizations : [],
          permissions: {
            manage_billing: raw?.permissions?.manage_billing === true,
          },
          platform: raw?.platform && Array.isArray(raw.platform.permissions)
            ? {
                role: raw.platform.role,
                permissions: raw.platform.permissions as PlatformPermission[],
              }
            : undefined,
        };

        setUser(mappedUser);
        setIsAuthenticated(true);
        setIsUnverified(false);

        // Store user role in localStorage for immediate access after login
        localStorage.setItem("userRole", mappedUser.role);
      } else {
        // Don't clear the token on an unexpected status — only 401 above means
        // the token is definitely invalid; other statuses may be transient.
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("Failed to fetch user:", err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = getAuthToken();
    if (token) {
      await fetchUserProfile(token);
    }
  };

  // Install once: redirects to login on any authenticated request's 401,
  // so individual fetch call sites don't each need their own check.
  useEffect(() => {
    installSessionExpiryInterceptor();
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      // V2 Phase 5.2c: once the server is in cookie mode, a token left in localStorage by the
      // old sign-in is dropped, so everyone signs in once more and ends up on the cookie.
      if (await isCookieMode()) {
        localStorage.removeItem("authToken");
      }
      if (cancelled) return;

      const token = getAuthToken();
      if (token) {
        fetchUserProfile(token);
      } else {
        setLoading(false);
        setIsAuthenticated(false);
        setIsUnverified(false);
      }
    };

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (token?: string) => {
    if (token && token !== COOKIE_SESSION_SENTINEL) {
      if (await isCookieMode()) {
        // A finished token handed to the browser (e.g. the Google redirect) goes into the cookie, never localStorage.
        const result = await sessionRequest("token", { token });
        if (result.mode === "cookie" && !result.ok) throw new Error("Could not start your session. Please sign in again.");
      } else {
        localStorage.setItem("authToken", token);
      }
    }
    setIsAuthenticated(false);
    setIsUnverified(false);
    const current = getAuthToken();
    if (current) await fetchUserProfile(current);
  };

  /**
   * Sign out and go to the public site.
   *
   * React state is deliberately left alone: clearing `user` here made the
   * dashboard's signed-out guard jump to /auth/login before the redirect landed.
   * The full page load below resets every in-memory state anyway, and replace()
   * keeps the dashboard out of the Back history.
   */
  const logout = async () => {
    if (signingOut) return;
    setSigningOut(true);

    const storedToken = localStorage.getItem("authToken");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");

    if (storedToken) {
      // Legacy mode: revoke the Laravel token without making the person wait.
      // keepalive lets the request finish after this page unloads.
      void fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${storedToken}`, Accept: "application/json" },
        keepalive: true,
        cache: "no-store",
      }).catch(() => undefined);
    } else if (await isCookieMode()) {
      // Cookie mode: only the server's response can clear the httpOnly session cookie, so wait for it.
      await endCookieSession();
    }

    window.location.replace("/discover");
  };

  const refetchUser = () => {
    const token = getAuthToken();
    if (token) {
      fetchUserProfile(token);
    } else {
      setIsAuthenticated(false);
      setIsUnverified(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        isUnverified,
        login,
        logout,
        refetchUser,
        refreshUser,
      }}
    >
      {children}
      {signingOut && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 backdrop-blur-sm"
        >
          <div className="flex items-center gap-3 text-sm font-medium text-[#1F3A4C]">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#93C01F] border-t-transparent" />
            Signing you out…
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
