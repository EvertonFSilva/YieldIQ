import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserAccountProfile } from '../types';
import { authService, userService } from '../services/apiClient';

interface AuthContextType {
  currentUser: UserAccountProfile | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (identifier: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserAccountProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshProfile = async (): Promise<void> => {
    const token = localStorage.getItem('yieldiq_access_token');
    const apiKey = localStorage.getItem('yieldiq_api_key');

    if (!token && !apiKey) {
      setCurrentUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const profile = await userService.retrieveProfile();
      setCurrentUser(profile);
    } catch {
      localStorage.removeItem('yieldiq_access_token');
      localStorage.removeItem('yieldiq_api_key');
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshProfile();
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login'): void => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = (): void => {
    setIsAuthModalOpen(false);
  };

  const login = async (identifier: string, password: string): Promise<void> => {
    await authService.login({ identifier, password });
    await refreshProfile();
    setIsAuthModalOpen(false);
  };

  const register = async (username: string, email: string, password: string): Promise<void> => {
    await authService.register({ username, email, password });
    await authService.login({ identifier: email, password });
    await refreshProfile();
    setIsAuthModalOpen(false);
  };

  const logout = (): void => {
    authService.logout();
    setCurrentUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        register,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};