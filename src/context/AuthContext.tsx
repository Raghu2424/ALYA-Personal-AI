import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInWithPopup, 
  signInWithRedirect, 
  getRedirectResult,
  fbSignOut 
} from '../lib/firebase';
import { auth, googleProvider, db, cleanPayload } from '../lib/firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  authError: string | null;
  isInIframe: boolean;
  loginWithGoogle: () => Promise<void>;
  openInNewTab: () => void;
  logout: () => Promise<void>;
  clearAuthError: () => void;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsInIframe(window.self !== window.top);
    }
  }, []);

  const openInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  // Sync or initialize user profile in Firestore
  const syncUserProfile = async (currentUser: User): Promise<UserProfile> => {
    const userDocRef = doc(db, 'users', currentUser.uid);
    const docSnap = await getDoc(userDocRef);

    const now = new Date().toISOString();

    if (!docSnap.exists()) {
      const newProfile: UserProfile = {
        uid: currentUser.uid,
        email: currentUser.email,
        displayName: currentUser.displayName || 'Friend',
        photoURL: currentUser.photoURL || null,
        createdAt: now,
        lastLoginAt: now,
        aiTone: 'friendly'
      };

      await setDoc(userDocRef, cleanPayload(newProfile));
      return newProfile;
    } else {
      const existingData = docSnap.data() as UserProfile;
      const updatedProfile: UserProfile = {
        ...existingData,
        displayName: currentUser.displayName || existingData.displayName || 'Friend',
        photoURL: currentUser.photoURL || existingData.photoURL,
        lastLoginAt: now
      };

      await updateDoc(userDocRef, cleanPayload({
        displayName: updatedProfile.displayName,
        photoURL: updatedProfile.photoURL,
        lastLoginAt: now
      }));

      return updatedProfile;
    }
  };

  useEffect(() => {
    // Check for redirect result if popup wasn't supported
    getRedirectResult(auth).catch((err) => {
      console.warn('Redirect auth result warning:', err);
    });

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const profile = await syncUserProfile(currentUser);
          setUserProfile(profile);
          setAuthError(null);
        } catch (err: any) {
          console.error('Error synchronizing user profile:', err);
          setAuthError(err?.message || 'Failed to sync user profile');
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      const code = err?.code || '';
      const message = err?.message || '';

      if (code === 'auth/unauthorized-domain') {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'current domain';
        setAuthError(
          `Domain not authorized: "${domain}" is not in Firebase Authorized Domains. In Firebase Console → Authentication → Settings → Authorized domains, add "${domain}".`
        );
      } else if (code === 'auth/operation-not-allowed') {
        setAuthError(
          'Google Sign-In provider is disabled for this Firebase project. Please enable Google under Firebase Console → Authentication → Sign-in method.'
        );
      } else if (code === 'auth/popup-blocked' || code === 'auth/cancelled-popup-request') {
        if (isInIframe) {
          setAuthError(
            'The preview iframe prevented the Google Sign-In popup. Google strictly blocks OAuth inside iframes to prevent clickjacking (HTTP 403 / X-Frame-Options: DENY). Please click "Open in New Tab" to sign in directly.'
          );
        } else {
          // If running in top-level browser tab and popup was blocked, we can safely fall back to redirect
          try {
            await signInWithRedirect(auth, googleProvider);
            return;
          } catch (redirectErr: any) {
            setAuthError(redirectErr?.message || 'Sign-in redirect failed');
          }
        }
      } else if (message.includes('403') || message.includes('access_denied') || message.includes('restricted_client')) {
        setAuthError(
          'Google OAuth 403 Access Error: Make sure Google Sign-in is enabled in Firebase Authentication, the current domain is authorized, and the OAuth Consent Screen in Google Cloud Console is published (or your account is listed under Test Users).'
        );
      } else if (code === 'auth/popup-closed-by-user') {
        // User voluntarily closed popup; do not show scary red error
        setAuthError(null);
      } else {
        setAuthError(err?.message || 'Failed to sign in with Google');
      }
    }
  };

  const logout = async () => {
    try {
      await fbSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setAuthError(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setAuthError(err?.message || 'Failed to sign out');
    }
  };

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, 'users', user.uid);
      const { uid: _ignoreUid, ...safeData } = data as any;
      await updateDoc(userDocRef, cleanPayload(safeData));
      setUserProfile((prev) => prev ? { ...prev, ...safeData } : null);
    } catch (err: any) {
      console.error('Update profile error:', err);
      throw err;
    }
  };

  const clearAuthError = () => setAuthError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        loading,
        authError,
        isInIframe,
        loginWithGoogle,
        openInNewTab,
        logout,
        clearAuthError,
        updateProfileData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
