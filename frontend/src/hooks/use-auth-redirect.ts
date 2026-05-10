import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";

export function useAuthRedirect(requireAuth: boolean = true) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !user) {
        setLocation("/login");
      } else if (!requireAuth && user) {
        setLocation("/dashboard");
      }
    }
  }, [user, isLoading, requireAuth, setLocation]);

  return { user, isLoading };
}
