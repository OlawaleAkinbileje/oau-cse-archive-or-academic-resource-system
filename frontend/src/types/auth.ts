export type UserRole = "staff" | "student" | "pending" | null;

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
}

export interface AuthSession {
  accessToken: string | null;
  userRole: UserRole;
  userProfile: UserProfile | null;
}
