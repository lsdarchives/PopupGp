import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { onAuthStateChanged, signOut, type User } from "firebase/auth";
import { auth } from "../services/firebase";
import { getUserProfile } from "../services/users";
import type { UserProfile } from "../types";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const profileRequestId = useRef(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      const requestId = ++profileRequestId.current;
      setUser(firebaseUser);

      if (!firebaseUser) {
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(null);
      setLoading(true);
      void getUserProfile(firebaseUser.uid)
        .then((userProfile) => {
          if (requestId === profileRequestId.current) {
            setProfile(userProfile);
          }
        })
        .catch((error) => {
          if (requestId !== profileRequestId.current) return;
          console.error("Unable to load the signed-in user's profile.", error);
          setProfile(null);
        })
        .finally(() => {
          if (requestId === profileRequestId.current) {
            setLoading(false);
          }
        });
    });

    return () => {
      profileRequestId.current += 1;
      unsub();
    };
  }, []);

  const logout = async () => {
    await signOut(auth);
  };

  const refreshProfile = async () => {
    if (!user) return;

    const refreshedProfile = await getUserProfile(user.uid);
    if (auth.currentUser?.uid === user.uid) {
      setProfile(refreshedProfile);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
