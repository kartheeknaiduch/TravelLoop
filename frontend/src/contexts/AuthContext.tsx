import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@/api";
import { getMe, getGetMeQueryKey } from "@/api";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const queryClient = useQueryClient();

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("traveloop_token");
      if (token) {
        try {
          const userData = await getMe();
          setUser(userData);
          queryClient.setQueryData(getGetMeQueryKey(), userData);
        } catch (error) {
          console.error("Failed to restore session", error);
          localStorage.removeItem("traveloop_token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [queryClient]);

  const login = (token: string, userData: User) => {
    localStorage.setItem("traveloop_token", token);
    setUser(userData);
    queryClient.setQueryData(getGetMeQueryKey(), userData);
  };

  const logout = () => {
    localStorage.removeItem("traveloop_token");
    setUser(null);
    queryClient.clear();
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    queryClient.setQueryData(getGetMeQueryKey(), userData);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
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
