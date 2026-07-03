import { AuthSession, UserRole } from "@/types/auth";

export const AUTH_TOKEN_KEY = "access_token";
export const AUTH_ROLE_KEY = "user_role";
export const AUTH_PROFILE_KEY = "user_profile";
export const AUTH_TOKEN_COOKIE = "oau_access_token";
export const AUTH_ROLE_COOKIE = "oau_user_role";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.split("=")[1];
  return match ? decodeURIComponent(match) : null;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function getStoredSession(): AuthSession {
  console.log("getStoredSession called!");
  if (typeof window === "undefined") {
    return { accessToken: null, userRole: null, userProfile: null };
  }
  const accessToken =
    localStorage.getItem(AUTH_TOKEN_KEY) ?? readCookie(AUTH_TOKEN_COOKIE);
  const userRole = (localStorage.getItem(AUTH_ROLE_KEY) ??
    readCookie(AUTH_ROLE_COOKIE)) as UserRole;
  const profileJson = localStorage.getItem(AUTH_PROFILE_KEY);
  const userProfile = profileJson ? JSON.parse(profileJson) : null;

  console.log(
    "getStoredSession - accessToken found:",
    !!accessToken,
    "userRole:",
    userRole,
    "userProfile:",
    userProfile,
  );
  return {
    accessToken,
    userRole: userRole ?? null,
    userProfile,
  };
}

export function persistSession(session: AuthSession) {
  console.log("persistSession called with:", session);
  if (typeof window === "undefined") return;

  if (session.accessToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, session.accessToken);
    writeCookie(AUTH_TOKEN_COOKIE, session.accessToken, 60 * 60 * 12);
    console.log("persistSession - saved token to localStorage and cookie!");
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    clearCookie(AUTH_TOKEN_COOKIE);
    console.log("persistSession - removed token!");
  }

  if (session.userRole) {
    localStorage.setItem(AUTH_ROLE_KEY, session.userRole);
    writeCookie(AUTH_ROLE_COOKIE, session.userRole, 60 * 60 * 12);
    console.log("persistSession - saved userRole to localStorage and cookie!");
  } else {
    localStorage.removeItem(AUTH_ROLE_KEY);
    clearCookie(AUTH_ROLE_COOKIE);
    console.log("persistSession - removed userRole!");
  }

  if (session.userProfile) {
    localStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify(session.userProfile));
    console.log("persistSession - saved userProfile to localStorage!");
  } else {
    localStorage.removeItem(AUTH_PROFILE_KEY);
    console.log("persistSession - removed userProfile!");
  }
}
