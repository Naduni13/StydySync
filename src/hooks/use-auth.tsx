import { useState, useEffect, useContext, createContext } from 'react';
import {
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  updateProfile
} from 'firebase/auth';
import { auth } from '@/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateUserEmail: (email: string) => Promise<void>;
  updateUserPassword: (password: string) => Promise<void>;
  updateUserProfile: (displayName: string) => Promise<void>;
}

interface UserData {
  uid: string;
  email: string | null;
  name: string;
  studyStreak?: number;
  totalNotes?: number;
  completedTasks?: number;
  createdAt?: any;
  lastActive?: any;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return;

      console.log("👤 Auth state changed. User:", user);
      if (user) {
        setCurrentUser(user);

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            uid: user.uid,
            email: user.email,
            name: data.name || user.displayName || user.email?.split('@')[0] || 'User',
            ...data
          });
        } else {
          await initializeUserData(user);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const initializeUserData = async (user: User) => {
    const newUserData: UserData = {
      uid: user.uid,
      email: user.email,
      name: user.displayName || user.email?.split('@')[0] || 'User',
      studyStreak: 0,
      totalNotes: 0,
      completedTasks: 0,
      createdAt: serverTimestamp(),
      lastActive: serverTimestamp()
    };

    await setDoc(doc(db, 'users', user.uid), newUserData);
    setUserData(newUserData);
  };

  const signup = async (email: string, password: string, name: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(userCredential.user, { displayName: name });
    await initializeUserData(userCredential.user);
  };

  const login = async (email: string, password: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await setDoc(
      doc(db, 'users', userCredential.user.uid),
      { lastActive: serverTimestamp() },
      { merge: true }
    );
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const updateUserEmail = async (email: string) => {
    if (!currentUser) throw new Error('No user logged in');
    await updateEmail(currentUser, email);
    await setDoc(doc(db, 'users', currentUser.uid), { email }, { merge: true });
  };

  const updateUserPassword = async (password: string) => {
    if (!currentUser) throw new Error('No user logged in');
    await updatePassword(currentUser, password);
  };

  const updateUserProfile = async (displayName: string) => {
    if (!currentUser) throw new Error('No user logged in');
    await updateProfile(currentUser, { displayName });
    await setDoc(
      doc(db, 'users', currentUser.uid),
      { name: displayName },
      { merge: true }
    );
    setUserData((prev) => (prev ? { ...prev, name: displayName } : null));
  };

  const value: AuthContextType = {
    user: currentUser,
    userData,
    loading,
    signup,
    login,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
