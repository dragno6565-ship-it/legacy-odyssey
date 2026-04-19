import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { post, get, setToken, clearToken, getToken, setActiveFamilyId, getActiveFamilyId } from '../api/client';

const AuthContext = createContext(null);

const REFRESH_KEY = 'legacy_odyssey_refresh_v2'; // v2 matches client.js key rotation

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [families, setFamilies] = useState([]);
  const [activeFamilyId, setActiveFamilyIdState] = useState(null);

  /**
   * Attempt to refresh the session using the stored refresh token.
   */
  async function tryRefreshToken() {
    try {
      const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
      if (!refreshToken) return null;

      const res = await post('/api/auth/refresh', { refresh_token: refreshToken });
      const { session } = res.data;
      if (!session?.access_token) return null;

      await setToken(session.access_token);
      if (session.refresh_token) {
        await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token);
      }
      return session.access_token;
    } catch (err) {
      console.warn('Token refresh failed:', err.message);
      return null;
    }
  }

  /**
   * Fetch families list and active book data.
   */
  async function fetchUserData(accessToken) {
    try {
      // Fetch all families for this user
      const famRes = await get('/api/families/mine');
      const { families: famList, activeFamilyId: serverActiveFamilyId } = famRes.data;

      // Determine which family is active
      const storedFamilyId = await getActiveFamilyId();
      const effectiveFamilyId =
        storedFamilyId && famList.some(f => f.id === storedFamilyId)
          ? storedFamilyId
          : serverActiveFamilyId || famList[0]?.id;

      // Fetch book data for the active family
      const bookRes = await get('/api/books/mine');
      const book = bookRes.data;

      const activeFamily = famList.find(f => f.id === effectiveFamilyId) || famList[0];

      return {
        user: {
          token: accessToken,
          subdomain: book.subdomain || book.slug || '',
          display_name: activeFamily?.display_name || '',
          book_password: book.book_password || book.password || '',
          bookId: book.id,
          familyId: effectiveFamilyId,
          custom_domain: activeFamily?.custom_domain || '',
          book_type: activeFamily?.book_type || 'baby_book',
          plan: activeFamily?.plan || null,
        },
        families: famList,
        activeFamilyId: effectiveFamilyId,
      };
    } catch (err) {
      if (err.status === 401) {
        // Try refresh
        const newToken = await tryRefreshToken();
        if (newToken) {
          try {
            const famRes = await get('/api/families/mine');
            const { families: famList, activeFamilyId: serverActiveFamilyId } = famRes.data;
            const bookRes = await get('/api/books/mine');
            const book = bookRes.data;
            const effectiveFamilyId = serverActiveFamilyId || famList[0]?.id;
            const activeFamily = famList.find(f => f.id === effectiveFamilyId) || famList[0];

            return {
              user: {
                token: newToken,
                subdomain: book.subdomain || book.slug || '',
                display_name: activeFamily?.display_name || '',
                book_password: book.book_password || book.password || '',
                bookId: book.id,
                familyId: effectiveFamilyId,
                custom_domain: activeFamily?.custom_domain || '',
                book_type: activeFamily?.book_type || 'baby_book',
                plan: activeFamily?.plan || null,
              },
              families: famList,
              activeFamilyId: effectiveFamilyId,
            };
          } catch (retryErr) {
            console.warn('Retry after refresh failed:', retryErr.message);
          }
        }
      }
      console.warn('fetchUserData failed:', err.message);
      return null;
    }
  }

  // On mount, restore session
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getToken();
        if (!storedToken) return;

        setTokenState(storedToken);

        const data = await fetchUserData(storedToken);
        if (data) {
          setTokenState(data.user.token);
          setUser(data.user);
          setFamilies(data.families);
          setActiveFamilyIdState(data.activeFamilyId);
          await setActiveFamilyId(data.activeFamilyId);
        } else {
          // Session expired and refresh failed
          console.warn('Session expired, logging out');
          await clearToken();
          try { await SecureStore.deleteItemAsync(REFRESH_KEY); } catch (e) { /* ignore */ }
          setTokenState(null);
          setUser(null);
        }
      } catch (err) {
        console.warn('Session restore failed:', err.message);
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await post('/api/auth/login', { email, password });
    const { family, session } = res.data;
    const newToken = session.access_token;
    await setToken(newToken);
    setTokenState(newToken);

    // Store refresh token
    try {
      await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token);
    } catch (e) { /* ignore */ }

    // Set active family
    await setActiveFamilyId(family.id);
    setActiveFamilyIdState(family.id);
    setUser({ ...family, token: newToken, familyId: family.id });

    // Fetch full families list in background
    try {
      const famRes = await get('/api/families/mine');
      setFamilies(famRes.data.families || []);
    } catch (e) {
      setFamilies([family]);
    }

    return res.data;
  }, []);

  const signup = useCallback(async (email, password, subdomain, displayName) => {
    const res = await post('/api/auth/signup', { email, password, subdomain, displayName });
    const { family, session } = res.data;
    const newToken = session.access_token;
    await setToken(newToken);
    setTokenState(newToken);

    try {
      await SecureStore.setItemAsync(REFRESH_KEY, session.refresh_token);
    } catch (e) { /* ignore */ }

    await setActiveFamilyId(family.id);
    setActiveFamilyIdState(family.id);
    setUser({ ...family, token: newToken, familyId: family.id });
    setFamilies([family]);

    return res.data;
  }, []);

  /**
   * Switch to a different family/book.
   */
  const switchFamily = useCallback(async (familyId) => {
    await setActiveFamilyId(familyId);
    setActiveFamilyIdState(familyId);

    // Reload book data for the new family
    try {
      const bookRes = await get('/api/books/mine');
      const book = bookRes.data;
      const activeFamily = families.find(f => f.id === familyId);

      setUser((prev) => ({
        ...prev,
        subdomain: book.subdomain || book.slug || '',
        display_name: activeFamily?.display_name || prev?.display_name || '',
        book_password: book.book_password || book.password || '',
        bookId: book.id,
        familyId,
        custom_domain: activeFamily?.custom_domain || '',
        book_type: activeFamily?.book_type || 'baby_book',
        plan: activeFamily?.plan || null,
      }));
    } catch (err) {
      console.warn('Failed to load switched family:', err.message);
    }
  }, [families]);

  /**
   * Refresh the families list from the server.
   */
  const refreshFamilies = useCallback(async () => {
    try {
      const famRes = await get('/api/families/mine');
      setFamilies(famRes.data.families || []);
      return famRes.data.families || [];
    } catch (err) {
      console.warn('Failed to refresh families:', err.message);
      return families;
    }
  }, [families]);

  const enterDemoMode = useCallback(() => {
    setTokenState('demo');
    setUser({ displayName: 'Demo User', email: 'demo@example.com', token: 'demo', isDemo: true });
    setFamilies([]);
  }, []);

  const logout = useCallback(async () => {
    if (user?.isDemo) {
      setTokenState(null);
      setUser(null);
      setFamilies([]);
      return;
    }
    try {
      await post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout API call failed:', err.message);
    }
    await clearToken();
    await setActiveFamilyId(null);
    try { await SecureStore.deleteItemAsync(REFRESH_KEY); } catch (e) { /* ignore */ }
    setTokenState(null);
    setUser(null);
    setFamilies([]);
    setActiveFamilyIdState(null);
  }, [user]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    families,
    activeFamilyId,
    login,
    signup,
    logout,
    enterDemoMode,
    switchFamily,
    refreshFamilies,
    refreshSession: tryRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
