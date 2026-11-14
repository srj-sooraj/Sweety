import { createContext, useContext, useEffect, useState } from 'react';
import { authApi, getStoredToken, setStoredToken } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function hydrateUser() {
      const token = getStoredToken();
      if (!token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const data = await authApi.me();
        if (active) {
          setUser(data.user);
        }
      } catch {
        setStoredToken(null);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    hydrateUser();

    function handleUnauthorized() {
      setUser(null);
    }

    window.addEventListener('sweety:unauthorized', handleUnauthorized);
    return () => {
      active = false;
      window.removeEventListener('sweety:unauthorized', handleUnauthorized);
    };
  }, []);

  async function login(credentials) {
    const data = await authApi.login(credentials);
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(payload) {
    const data = await authApi.register(payload);
    setStoredToken(data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    setStoredToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: Boolean(user),
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside an AuthProvider.');
  }
  return ctx;
}
