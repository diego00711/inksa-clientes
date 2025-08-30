import { useAuth } from "./AuthContext";
export function useProfile() {
  const { user } = useAuth();
  return { profile: user, loading: false };
}
