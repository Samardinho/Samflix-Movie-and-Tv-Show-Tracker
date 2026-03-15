import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  type User
} from "firebase/auth";
import type { FirebaseError } from "firebase/app";
import { doc, serverTimestamp, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { auth, db, storage } from "../lib/firebase";
import type { UserProfile } from "../types/domain";

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  uploadProfilePicture: (file: File) => Promise<string>;
  deleteProfilePicture: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Fetch profile from Firestore to get profilePictureUrl
        try {
          const userDoc = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setProfile({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              createdAt: data.createdAt?.toDate?.()?.toISOString() ?? firebaseUser.metadata.creationTime ?? null,
              profilePictureUrl: data.profilePictureUrl ?? null
            });
          } else {
            // Create profile if it doesn't exist
            const baseProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              createdAt: firebaseUser.metadata.creationTime ?? null,
              profilePictureUrl: null
            };
            await setDoc(doc(db, "users", firebaseUser.uid), {
              email: firebaseUser.email,
              createdAt: serverTimestamp()
            });
            setProfile(baseProfile);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          // Fallback to basic profile
          const baseProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            createdAt: firebaseUser.metadata.creationTime ?? null,
            profilePictureUrl: null
          };
          setProfile(baseProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: unknown) {
      // Handle Firebase Auth errors
      const authError = error as FirebaseError;
      if (authError?.code) {
        switch (authError.code) {
          case "auth/invalid-credential":
          case "auth/wrong-password":
          case "auth/user-not-found":
          case "auth/invalid-email":
            throw new Error("Invalid email or password");
          case "auth/too-many-requests":
            throw new Error("Too many failed attempts. Please try again later");
          case "auth/user-disabled":
            throw new Error("This account has been disabled");
          default:
            throw new Error(authError.message || "Failed to login");
        }
      }
      // Fallback for other errors
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to login");
      }
      throw new Error("Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string): Promise<void> => {
    try {
      setLoading(true);
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, "users", cred.user.uid);
      await setDoc(userRef, {
        email,
        createdAt: serverTimestamp()
      });
    } catch (error: unknown) {
      // Handle Firebase Auth errors
      const authError = error as FirebaseError;
      if (authError?.code) {
        switch (authError.code) {
          case "auth/email-already-in-use":
            throw new Error("This email is already registered. Please login instead");
          case "auth/invalid-email":
            throw new Error("Invalid email address");
          case "auth/weak-password":
            throw new Error("Password is too weak. Please use at least 6 characters");
          case "auth/operation-not-allowed":
            throw new Error("Email/password accounts are not enabled");
          default:
            throw new Error(authError.message || "Failed to register");
        }
      }
      // Fallback for other errors
      if (error instanceof Error) {
        throw new Error(error.message || "Failed to register");
      }
      throw new Error("Failed to register");
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    try {
      setLoading(true);
      console.log("Sending password reset email to:", email);
      console.log("Using auth instance:", auth.app.name);
      console.log("Auth config emulator:", (auth as any)._delegate?._config?.emulator);
      
      await sendPasswordResetEmail(auth, email, {
        url: window.location.origin + "/reset-password",
        handleCodeInApp: false
      });
      
      console.log("Password reset email sent successfully");
    } catch (error: unknown) {
      console.error("Password reset error:", error);
      // Handle Firebase Auth errors
      const authError = error as FirebaseError;
      if (authError?.code) {
        console.error("Firebase error code:", authError.code);
        switch (authError.code) {
          case "auth/user-not-found":
            // Don't reveal that user doesn't exist for security
            // Still show success message
            console.log("User not found, but showing success for security");
            break;
          case "auth/invalid-email":
            throw new Error("Invalid email address");
          case "auth/too-many-requests":
            throw new Error("Too many requests. Please try again later");
          default:
            throw new Error(authError.message || "Failed to send password reset email");
        }
      } else if (error instanceof Error) {
        throw new Error(error.message || "Failed to send password reset email");
      } else {
        throw new Error("Failed to send password reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  const uploadProfilePicture = async (file: File): Promise<string> => {
    if (!user) {
      throw new Error("You must be logged in to upload a profile picture");
    }

    // Check if storage is available
    if (!storage) {
      throw new Error("Firebase Storage is not configured. Please check your Firebase setup.");
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      throw new Error("File must be an image (JPG, PNG, GIF, etc.)");
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      throw new Error("Image size must be less than 5MB");
    }

    try {
      // Delete old profile picture if it exists
      if (profile?.profilePictureUrl) {
        try {
          const oldUrl = profile.profilePictureUrl;
          // Extract path from URL - handle both production and emulator URLs
          let oldPath: string | undefined;
          if (oldUrl.includes("/o/")) {
            oldPath = oldUrl.split("/o/")[1]?.split("?")[0];
          } else if (oldUrl.includes("profile-pictures/")) {
            // Emulator URL format
            oldPath = oldUrl.split("profile-pictures/")[1]?.split("?")[0];
            if (oldPath) {
              oldPath = `profile-pictures/${oldPath}`;
            }
          }
          
          if (oldPath) {
            const decodedPath = decodeURIComponent(oldPath);
            const oldRef = ref(storage, decodedPath);
            await deleteObject(oldRef);
          }
        } catch (error) {
          console.warn("Failed to delete old profile picture:", error);
          // Continue even if deletion fails
        }
      }

      // Upload new picture
      const fileRef = ref(storage, `profile-pictures/${user.uid}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      // Update Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        profilePictureUrl: downloadURL
      });

      // Update local profile state
      setProfile((prev) => prev ? { ...prev, profilePictureUrl: downloadURL } : null);

      return downloadURL;
    } catch (error: any) {
      console.error("Error uploading profile picture:", error);
      
      // Provide more specific error messages
      if (error?.code === "storage/unauthorized") {
        throw new Error("You don't have permission to upload. Please check Firebase Storage rules.");
      } else if (error?.code === "storage/quota-exceeded") {
        throw new Error("Storage quota exceeded. Please contact support.");
      } else if (error?.code === "storage/unauthenticated") {
        throw new Error("You must be logged in to upload a profile picture.");
      } else if (error?.message) {
        throw new Error(error.message);
      }
      
      throw new Error("Failed to upload profile picture. Please check your Firebase Storage configuration.");
    }
  };

  const deleteProfilePicture = async (): Promise<void> => {
    if (!user || !profile?.profilePictureUrl) {
      return;
    }

    if (!storage) {
      throw new Error("Firebase Storage is not configured. Please check your Firebase setup.");
    }

    try {
      // Delete from Storage
      const oldUrl = profile.profilePictureUrl;
      // Extract path from URL - handle both production and emulator URLs
      let oldPath: string | undefined;
      if (oldUrl.includes("/o/")) {
        oldPath = oldUrl.split("/o/")[1]?.split("?")[0];
      } else if (oldUrl.includes("profile-pictures/")) {
        // Emulator URL format
        oldPath = oldUrl.split("profile-pictures/")[1]?.split("?")[0];
        if (oldPath) {
          oldPath = `profile-pictures/${oldPath}`;
        }
      }
      
      if (oldPath) {
        const decodedPath = decodeURIComponent(oldPath);
        const fileRef = ref(storage, decodedPath);
        await deleteObject(fileRef);
      }

      // Update Firestore
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, {
        profilePictureUrl: null
      });

      // Update local profile state
      setProfile((prev) => prev ? { ...prev, profilePictureUrl: null } : null);
    } catch (error: any) {
      console.error("Error deleting profile picture:", error);
      
      // Provide more specific error messages
      if (error?.code === "storage/unauthorized") {
        throw new Error("You don't have permission to delete. Please check Firebase Storage rules.");
      } else if (error?.message) {
        throw new Error(error.message);
      }
      
      throw new Error("Failed to delete profile picture. Please check your Firebase Storage configuration.");
    }
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      login,
      register,
      logout,
      resetPassword,
      uploadProfilePicture,
      deleteProfilePicture
    }),
    [user, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


