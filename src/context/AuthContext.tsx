"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth, googleProvider, isFirebaseConfigured } from "@/lib/firebase";

export interface SchemaAIUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  isDemo?: boolean;
}

interface AuthContextType {
  user: SchemaAIUser | User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<SchemaAIUser | User | null>;
  signOutUser: () => Promise<void>;
  isConfigured: boolean;
  signInDemoUser: () => void;
  signInAsCustomUser: (name: string, email: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => null,
  signOutUser: async () => {},
  isConfigured: false,
  signInDemoUser: () => {},
  signInAsCustomUser: () => {},
});

const SESSION_STORAGE_KEY = "schemaai_user_session";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SchemaAIUser | User | null>(null);
  const [loading, setLoading] = useState(true);

  // 1. Synchronous / Immediate Session Restore from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.uid) {
          setUser(parsed);
        }
      }
    } catch (err) {
      console.warn("Could not parse cached session:", err);
    }
  }, []);

  // 2. Firebase Auth Listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Firebase not configured; check local storage and finish loading
      try {
        const stored = localStorage.getItem(SESSION_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.uid) {
            setUser(parsed);
          }
        }
      } catch (e) {
        // ignore
      }
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        if (currentUser) {
          const cleanUser: SchemaAIUser = {
            uid: currentUser.uid,
            displayName: currentUser.displayName || currentUser.email?.split("@")[0] || "Authenticated User",
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            isDemo: false,
          };
          setUser(cleanUser);
          try {
            localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(cleanUser));
          } catch (e) {
            // ignore
          }
        } else {
          // If Firebase reports no user, check if we have an active local/demo user session
          try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) {
              const parsed = JSON.parse(stored);
              if (parsed && parsed.isDemo) {
                // Keep the demo session intact
                setUser(parsed);
                setLoading(false);
                return;
              }
            }
          } catch (e) {
            // ignore
          }
          // No user session found
          setUser(null);
          try {
            localStorage.removeItem(SESSION_STORAGE_KEY);
          } catch (e) {
            // ignore
          }
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firebase onAuthStateChanged error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 3. Google One Tap (Strictly validate client ID to prevent GSI library crashes)
  useEffect(() => {
    // If already signed in or not on client, do not run One Tap
    if (user || typeof window === "undefined" || !isFirebaseConfigured) return;

    // Google One Tap strictly requires a Google OAuth Web Client ID (ending with .apps.googleusercontent.com)
    const rawClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const isValidGoogleClientId =
      rawClientId &&
      !rawClientId.startsWith("1:") && // not a Firebase App ID
      rawClientId.includes(".apps.googleusercontent.com");

    if (!isValidGoogleClientId) {
      return;
    }

    let timer: NodeJS.Timeout;

    const initializeOneTap = () => {
      const google = (window as any).google;
      if (!google || !google.accounts || !google.accounts.id) return;

      try {
        google.accounts.id.initialize({
          client_id: rawClientId,
          use_fedcm_for_prompt: false, // Prevents FedCM get() AbortError
          callback: async (response: any) => {
            if (response.credential) {
              try {
                const credential = GoogleAuthProvider.credential(response.credential);
                const userCredential = await signInWithCredential(auth, credential);
                const signedUser: SchemaAIUser = {
                  uid: userCredential.user.uid,
                  displayName: userCredential.user.displayName,
                  email: userCredential.user.email,
                  photoURL: userCredential.user.photoURL,
                  isDemo: false,
                };
                setUser(signedUser);
                localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(signedUser));
              } catch (err) {
                console.error("One Tap sign-in error:", err);
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        google.accounts.id.prompt((notification: any) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            // Fall back silently to standard button
          }
        });
      } catch (e) {
        console.warn("Google One Tap initialization skipped:", e);
      }
    };

    if ((window as any).google) {
      initializeOneTap();
    } else {
      timer = setTimeout(initializeOneTap, 1000);
    }

    return () => {
      if (timer) clearTimeout(timer);
      try {
        const google = (window as any).google;
        google?.accounts?.id?.cancel?.();
      } catch (e) {
        // ignore
      }
    };
  }, [user]);

  // 4. Sign In with Google Popup
  const signInWithGoogle = async (): Promise<SchemaAIUser | User | null> => {
    if (!isFirebaseConfigured) {
      return signInDemoUser();
    }

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const authenticatedUser: SchemaAIUser = {
        uid: result.user.uid,
        displayName: result.user.displayName || result.user.email?.split("@")[0] || "User",
        email: result.user.email,
        photoURL: result.user.photoURL,
        isDemo: false,
      };
      setUser(authenticatedUser);
      try {
        localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(authenticatedUser));
      } catch (e) {
        // ignore
      }
      return authenticatedUser;
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      throw error;
    }
  };

  // 5. Sign In Demo / Instant User
  const signInDemoUser = (): SchemaAIUser => {
    const mockUser: SchemaAIUser = {
      uid: "usr_demo_8829",
      displayName: "Alex Rivera",
      email: "alex.rivera@datacore.io",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      isDemo: true,
    };
    setUser(mockUser);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(mockUser));
    } catch (e) {
      // ignore
    }
    return mockUser;
  };

  // 6. Sign In as Custom User
  const signInAsCustomUser = (name: string, email: string): SchemaAIUser => {
    const cleanId = `usr_${Math.random().toString(36).substring(2, 10)}`;
    const customUser: SchemaAIUser = {
      uid: cleanId,
      displayName: name.trim() || "SchemaAI Developer",
      email: email.trim() || "developer@schemaai.io",
      photoURL: null,
      isDemo: true,
    };
    setUser(customUser);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(customUser));
    } catch (e) {
      // ignore
    }
    return customUser;
  };

  // 7. Sign Out
  const signOutUser = async () => {
    try {
      if (isFirebaseConfigured) {
        await signOut(auth);
      }
    } catch (error) {
      console.warn("Firebase sign-out warning:", error);
    } finally {
      setUser(null);
      try {
        localStorage.removeItem(SESSION_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithGoogle,
        signOutUser,
        isConfigured: isFirebaseConfigured,
        signInDemoUser,
        signInAsCustomUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
