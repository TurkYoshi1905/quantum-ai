import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@workspace/api-client-react";
import { setAuthTokenGetter, useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("quantum_ai_token");
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const queryClient = useQueryClient();

  // Setup the token getter for the API client
  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("quantum_ai_token"));
  }, []);

  // Fetch current user if we have a token
  const { data: me, isLoading: isLoadingMe, error } = useGetMe({
    query: {
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (me) {
      setUser(me);
    } else if (error) {
      // Token likely invalid
      setToken(null);
      setUser(null);
      localStorage.removeItem("quantum_ai_token");
    }
    
    if (!isLoadingMe) {
      setIsInitializing(false);
    }
  }, [me, error, isLoadingMe]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("quantum_ai_token", newToken);
    setToken(newToken);
    setUser(newUser);
    queryClient.setQueryData(getGetMeQueryKey(), newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem("quantum_ai_token");
    setToken(null);
    setUser(null);
    queryClient.clear();
  };

  const isLoading = isInitializing || (!!token && isLoadingMe);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout: handleLogout,
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
