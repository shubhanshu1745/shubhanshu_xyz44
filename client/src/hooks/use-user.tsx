import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Define User type
type User = {
  id: number;
  username: string;
  email: string;
  name?: string;
  profileImage?: string;
  bio?: string;
  role: string;
  isVerified: boolean;
  [key: string]: any;
};

// Create context
type UserContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  refetchUser: () => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

// Provider component
interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [storedUserState, setStoredUserState] = useState<boolean>(false);

  // Check for stored authentication on mount
  useEffect(() => {
    const checkStoredAuth = async () => {
      try {
        // This just checks if we have auth in local storage, actual auth state is handled by the query
        const hasStoredAuth = localStorage.getItem("auth") !== null;
        setStoredUserState(hasStoredAuth);
      } catch (error) {
        console.error("Error checking stored auth:", error);
      }
    };

    checkStoredAuth();
  }, []);

  // Fetch current user using React Query
  const {
    data: user,
    isLoading,
    error,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["/api/auth/me"],
    enabled: storedUserState, // Only run if we have stored auth
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <UserContext.Provider value={{ user, isLoading, error, refetchUser }}>
      {children}
    </UserContext.Provider>
  );
}

// Hook to use the user context
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}