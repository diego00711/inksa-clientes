import { useAuth } from "./AuthContext";
export function useProfile() {
  const { user, isLoading } = useAuth(); // FIX: expose real loading state from AuthContext
  return { profile: user, loading: isLoading };
}
