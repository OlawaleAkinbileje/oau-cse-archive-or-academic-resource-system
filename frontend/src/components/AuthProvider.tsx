"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

import { getStoredSession, persistSession } from "@/lib/auth-session";
import { AuthSession, UserProfile, UserRole } from "@/types/auth";
import { supabase } from "@/lib/supabase-browser";
import { getAuthProfile } from "@/lib/api";

interface AuthContextValue {
  session: AuthSession;
  setSession: (nextSession: AuthSession) => void;
  clearSession: () => void;
  isHydrated: boolean;
}

const initialSession: AuthSession = { accessToken: null, userRole: null, userProfile: null };
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<AuthSession>(initialSession);
  const [isHydrated, setIsHydrated] = useState(false);

  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      // Get user from Supabase auth first
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        return {
          id: user.id,
          email: user.email!,
          fullName: user.user_metadata?.full_name || user.user_metadata?.name || null,
        };
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      // First get stored session
      const storedSession = getStoredSession();

      // Also get latest session from Supabase
      const { data: { session: supabaseSession } } = await supabase.auth.getSession();

      console.log("AuthProvider - initAuth: storedSession:", storedSession);
      console.log("AuthProvider - initAuth: supabaseSession:", supabaseSession);

      // Determine which token to use
      const finalSession = { ...storedSession };
      if (supabaseSession?.access_token) {
        finalSession.accessToken = supabaseSession.access_token;
        // Fetch user profile if we have a user
        const profile = await fetchUserProfile(supabaseSession.user.id);
        finalSession.userProfile = profile;

        // Enrich with backend auth profile
        const authProfile = await getAuthProfile(finalSession.accessToken);
        if (authProfile?.user?.role) {
          const user = authProfile.user;
          let userRole: UserRole;
          if (user.role === 'staff' && user.is_staff_verified) {
            userRole = 'staff';
          } else if (user.role === 'staff' && !user.is_staff_verified) {
            userRole = 'pending';
          } else {
            userRole = 'student';
          }
          finalSession.userRole = userRole;
          finalSession.userProfile = {
            id: user.id,
            email: user.email,
            fullName: user.full_name,
          };
        }
      }

      // Defer state updates to microtask to avoid synchronous setState in effect
      void Promise.resolve().then(() => {
        if (finalSession.accessToken || finalSession.userRole) {
          setSessionState(finalSession);
          persistSession(finalSession);
        }
        setIsHydrated(true);
      });
    };

    initAuth();

    // Listen for Supabase auth state changes (including token refreshes)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        console.log("AuthProvider - onAuthStateChange event:", event);
        if (supabaseSession?.access_token) {
          // Fetch user profile
          const profile = await fetchUserProfile(supabaseSession.user.id);

          // Enrich with backend auth profile
          let userRole: UserRole | null = null;
          let enrichedProfile = profile;
          try {
            const authProfile = await getAuthProfile(supabaseSession.access_token);
            if (authProfile?.user?.role) {
              const user = authProfile.user;
              if (user.role === 'staff' && user.is_staff_verified) {
                userRole = 'staff';
              } else if (user.role === 'staff' && !user.is_staff_verified) {
                userRole = 'pending';
              } else {
                userRole = 'student';
              }
              enrichedProfile = {
                id: user.id,
                email: user.email,
                fullName: user.full_name,
              };
            }
          } catch {
            // ignore
          }

          // Update session with new token and profile
          setSessionState((prev) => {
            const newSession = {
              ...prev,
              accessToken: supabaseSession.access_token,
              userProfile: enrichedProfile,
              userRole: userRole ?? prev.userRole,
            };
            persistSession(newSession);
            return newSession;
          });
        } else if (event === "SIGNED_OUT") {
          // Clear profile on sign out
          setSessionState(initialSession);
          persistSession(initialSession);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      setSession: (nextSession) => {
        persistSession(nextSession);
        setSessionState(nextSession);
      },
      clearSession: () => {
        persistSession(initialSession);
        setSessionState(initialSession);
      },
      isHydrated,
    }),
    [session, isHydrated],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
