// context/auth-context.tsx
"use client";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  phone: string;
  last_name: string;
  first_name: string;
  email: string;
  name: string;
  role: string;
  image?: string;
  avatar?: string;
  profile_photo_url?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isUnverified: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refetchUser: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isUnverified, setIsUnverified] = useState(false);

  const fetchUserProfile = async (token: string) => {
    // console.log("🔄 fetchUserProfile called with token:", token ? "exists" : "missing");
    setLoading(true);
    setIsUnverified(false); // Reset unverified state

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://me-fie.co.uk";

      // Try different possible user endpoints
      const endpoints = [
        "/api/user",
        // "/api/auth/user",
        // "/api/profile",
        // "/api/me",
      ];

      let userData = null;
      // let successfulEndpoint = "";

      for (const endpoint of endpoints) {
        try {
          // console.log("📡 Trying endpoint:", `${API_URL}${endpoint}`);
          const res = await fetch(`${API_URL}${endpoint}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          // console.log(`📨 ${endpoint} Response status:`, res.status);

          if (res.status === 401) {
            // Unauthorized - clear everything
            // console.log("🔐 401 - Unauthorized, clearing token");
            localStorage.removeItem("authToken");
            setUser(null);
            setIsAuthenticated(false);
            setIsUnverified(false);
            setLoading(false);
            return;
          }
          
          if (res.status === 403) {
            // Forbidden - likely unverified email
            // console.log("🔐 403 - Forbidden (likely unverified email)");
            setIsAuthenticated(false);
            setIsUnverified(true);
            setUser(null);
            setLoading(false);
            return; // Keep the token, don't clear it
          }

          if (res.ok) {
            const data = await res.json();
            // console.log(`✅ User data from ${endpoint}:`, data);
            userData = data;
            // successfulEndpoint = endpoint;
            break;
          } else if (res.status === 405) {
            // console.log(`⚠️ ${endpoint} returned 405 - Method Not Allowed`);
            // Try with POST method
            const postRes = await fetch(`${API_URL}${endpoint}`, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            });

            if (postRes.ok) {
              const postData = await postRes.json();
              // console.log(`✅ User data from ${endpoint} (POST):`, postData);
              userData = postData;
              // successfulEndpoint = `${endpoint} (POST)`;
              break;
            }
          }
        } catch  {
          // console.log(`❌ ${endpoint} failed:`, err);
          continue;
        }
      }

      if (userData) {
        // console.log(`🎯 Successfully fetched user from: ${successfulEndpoint}`);

        // Handle different backend response structures
        const raw = userData?.user ?? userData?.data ?? userData;
        // console.log("🔍 Extracted raw user data:", raw);

        const mappedUser: User = {
          id: raw?.id || "",
          name: raw?.name || raw?.username || `${raw?.first_name ?? ""} ${raw?.last_name ?? ""}`.trim() || raw?.email?.split("@")[0] || "User",
          role: raw?.role || raw?.user_type || "User",
          image: raw?.image || raw?.avatar || raw?.profile_picture || undefined,
          email: raw?.email || "",
          last_name: raw?.last_name || "",
          first_name: raw?.first_name || "",
          phone: raw?.phone || "",
        };

        // console.log("👤 Final mapped user:", mappedUser);
        setUser(mappedUser);
        setIsAuthenticated(true);
        setIsUnverified(false);
        
        // Store user role in localStorage for immediate access after login
        localStorage.setItem("userRole", mappedUser.role);
      } else {
        // console.log("❌ All user endpoints failed");
        // Don't clear token if it might be an unverified case
        // Only clear if we're sure it's invalid
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error("🚨 Failed to fetch user:", err);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("authToken");
    if (token) {
      await fetchUserProfile(token);
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    // console.log("🔍 AuthProvider mounting, checking for token...");
    const token = localStorage.getItem("authToken");
    // console.log("🔑 Token found:", token ? "yes" : "no");

    if (token) {
      fetchUserProfile(token);
    } else {
      // console.log("🔑 No token found, setting loading to false");
      setLoading(false);
      setIsAuthenticated(false);
      setIsUnverified(false);
    }
  }, []);

  const login = async (token: string) => {
    // console.log("🔑 Login called with token:", token ? "exists" : "missing");
    localStorage.setItem("authToken", token);
    // console.log("💾 Token saved to localStorage");
    setIsAuthenticated(false);
    setIsUnverified(false);
    await fetchUserProfile(token);
  };

  const logout = () => {
    // console.log("🚪 Logout called");
    localStorage.removeItem("authToken");
    localStorage.removeItem("userRole");
    setUser(null);
    setIsAuthenticated(false);
    setIsUnverified(false);
    window.location.href = "/discover";
  };

  const refetchUser = () => {
    // console.log("🔄 refetchUser called");
    const token = localStorage.getItem("authToken");
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