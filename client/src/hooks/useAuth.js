import { useState, useCallback } from 'react';

const API_URL = '/api';

export function useAuth() {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('ide_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('ide_token'));
  const [showAuth, setShowAuth] = useState(false);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    localStorage.setItem('ide_token', data.token);
    localStorage.setItem('ide_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setShowAuth(false);
    return data.user;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    localStorage.setItem('ide_token', data.token);
    localStorage.setItem('ide_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    setShowAuth(false);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('ide_token');
    localStorage.removeItem('ide_user');
    setToken(null);
    setUser(null);
  }, []);

  return { user, token, login, register, logout, showAuth, setShowAuth };
}
