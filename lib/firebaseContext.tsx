"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { ListingItem, SubscriptionStatus } from "@/components/ListingTypes";
import { PRESET_LISTINGS } from "@/components/presets";
import {
  db,
  auth,
  isFirebaseConfigured,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  doc,
  setDoc,
  getDoc,
  collection,
  onSnapshot,
  deleteDoc,
  type User
} from "./firebase";

// Mandatory Error Formatter from integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || "mock-user-id",
      email: auth?.currentUser?.email || "mock@example.com",
      emailVerified: auth?.currentUser?.emailVerified || true,
      isAnonymous: auth?.currentUser?.isAnonymous || false,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo: auth?.currentUser?.providerData?.map((p: any) => ({
        providerId: p.providerId,
        email: p.email,
      })) || []
    },
    operationType,
    path
  };
  console.error("Firestore Error Hooked: ", JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface AuthContextType {
  user: {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  } | null;
  isAdmin: boolean;
  loading: boolean;
  isFirebaseSetup: boolean;
  listings: ListingItem[];
  subStatus: SubscriptionStatus;
  loginWithGoogle: () => Promise<void>;
  simulateEmailLogin: (email: string) => void;
  logout: () => Promise<void>;
  saveListing: (updated: ListingItem) => Promise<void>;
  deleteListing: (id: string) => Promise<void>;
  updateSubStatus: (updated: SubscriptionStatus) => Promise<void>;
  addBatchListings: (items: ListingItem[]) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType["user"]>(null);
  const [loading, setLoading] = useState(true);
  const [listings, setListings] = useState<ListingItem[]>([]);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus>({
    tier: "Free",
    isActive: false,
    listingsUsed: 0,
    listingsMax: 5,
  });

  const isAdmin = user?.email.toLowerCase() === "iamwhoiambook@gmail.com";

  // Check and apply rule overrides for admin on user changes
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        const timer = setTimeout(() => {
          setSubStatus({
            tier: "Enterprise",
            isActive: true,
            listingsUsed: listings.filter(i => i.status !== "Draft").length,
            listingsMax: 999999, // Infinite usage
          });
        }, 0);
        return () => clearTimeout(timer);
      } else {
        // Restore standard user subStatus
        if (isFirebaseConfigured) {
          // Loaded dynamically from snapshot/document below
        } else {
          const localSub = localStorage.getItem(`markeer_sub_${user.uid}`);
          if (localSub) {
            try {
              const parsed = JSON.parse(localSub);
              const timer = setTimeout(() => {
                setSubStatus(parsed);
              }, 0);
              return () => clearTimeout(timer);
            } catch (e) {
              // Fallback
            }
          } else {
            const timer = setTimeout(() => {
              setSubStatus({
                tier: "Free",
                isActive: false,
                listingsUsed: 0,
                listingsMax: 5,
              });
            }, 0);
            return () => clearTimeout(timer);
          }
        }
      }
    } else {
      const timer = setTimeout(() => {
        setListings([]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [user, isAdmin, listings.length]);

  // Load and subscribe to real Firebase if configured, otherwise simulated local database
  useEffect(() => {
    if (!isFirebaseConfigured) {
      // Simulate state load from local profile
      const storedUser = localStorage.getItem("markeer_sim_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          const timer = setTimeout(() => {
            setUser(parsed);
            setLoading(false);
          }, 0);
          return () => clearTimeout(timer);
        } catch (e) {}
      }
      const timer = setTimeout(() => {
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const initTimer = setTimeout(() => {
      setLoading(true);
    }, 0);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (fbUser) {
        const profile = {
          uid: fbUser.uid,
          email: fbUser.email || "",
          displayName: fbUser.displayName || fbUser.email?.split("@")[0] || "User",
          photoURL: fbUser.photoURL || undefined
        };
        setUser(profile);

        // Sync or register profile document in Firestore
        const userDocRef = doc(db, "users", fbUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              userId: fbUser.uid,
              email: fbUser.email,
              subscriptionTier: fbUser.email?.toLowerCase() === "iamwhoiambook@gmail.com" ? "Enterprise" : "Free",
              subscriptionActive: fbUser.email?.toLowerCase() === "iamwhoiambook@gmail.com",
              updatedAt: new Date().toISOString()
            });

            // Set locally cached subscription info
            localStorage.setItem(`markeer_sub_${fbUser.uid}`, JSON.stringify({
              tier: fbUser.email?.toLowerCase() === "iamwhoiambook@gmail.com" ? "Enterprise" : "Free",
              isActive: fbUser.email?.toLowerCase() === "iamwhoiambook@gmail.com",
              listingsUsed: 0,
              listingsMax: fbUser.email?.toLowerCase() === "iamwhoiambook@gmail.com" ? 999999 : 5,
            }));
          } else {
            // Load subscription from doc
            const data = userDoc.data();
            if (fbUser.email?.toLowerCase() !== "iamwhoiambook@gmail.com") {
              const localSub = {
                tier: data.subscriptionTier || "Free",
                isActive: data.subscriptionActive || false,
                listingsUsed: 0,
                listingsMax: data.subscriptionTier === "Pro" ? 250 : data.subscriptionTier === "Enterprise" ? 999999 : 5,
              };
              setSubStatus(localSub);
              localStorage.setItem(`markeer_sub_${fbUser.uid}`, JSON.stringify(localSub));
            }
          }
        } catch (err) {
          console.warn("Firestore loading/updating user info failed or device is offline. Utilizing localized backup context: ", err);
          const localSubStr = localStorage.getItem(`markeer_sub_${fbUser.uid}`);
          if (localSubStr) {
            try {
              setSubStatus(JSON.parse(localSubStr));
            } catch (jsonErr) {
              setSubStatus({
                tier: "Free",
                isActive: false,
                listingsUsed: 0,
                listingsMax: 5,
              });
            }
          } else {
            setSubStatus({
              tier: "Free",
              isActive: false,
              listingsUsed: 0,
              listingsMax: 5,
            });
          }
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(initTimer);
      unsubscribe();
    };
  }, []);

  // Fetch listings from Firestore (or localStorage per account ID)
  useEffect(() => {
    if (!user) {
      const timer = setTimeout(() => {
        setListings([]);
      }, 0);
      return () => clearTimeout(timer);
    }

    if (!isFirebaseConfigured) {
      // Simulated per-account database
      const savedListings = localStorage.getItem(`markeer_listings_${user.uid}`);
      if (savedListings) {
        try {
          const parsed = JSON.parse(savedListings);
          const timer = setTimeout(() => {
            setListings(parsed);
          }, 0);
          return () => clearTimeout(timer);
        } catch (e) {
          const timer = setTimeout(() => {
            setListings(PRESET_LISTINGS);
          }, 0);
          return () => clearTimeout(timer);
        }
      } else {
        // New account gets default starter presets
        const timer = setTimeout(() => {
          setListings(PRESET_LISTINGS);
        }, 0);
        return () => clearTimeout(timer);
      }
    }

    // Subscribe to Firestore listings
    const path = `users/${user.uid}/listings`;
    let unsubscribe: (() => void) | undefined;
    try {
      const q = collection(db, "users", user.uid, "listings");
      unsubscribe = onSnapshot(q, (snapshot) => {
        const list: ListingItem[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as ListingItem);
        });
        // Sort descending by ID or creationDate
        list.sort((a, b) => b.id.localeCompare(a.id));
        setListings(list);
        localStorage.setItem(`markeer_listings_${user.uid}`, JSON.stringify(list));
      }, (err) => {
        console.warn("Firestore snapshot loading failed. Relying on localStorage backup: ", err);
        const savedListings = localStorage.getItem(`markeer_listings_${user.uid}`);
        if (savedListings) {
          try {
            setListings(JSON.parse(savedListings));
          } catch (e) {}
        } else {
          setListings(PRESET_LISTINGS);
        }
      });
    } catch (err) {
      console.warn("Firestore loading subscription error. Relying on localStorage backup:", err);
      const savedListings = localStorage.getItem(`markeer_listings_${user.uid}`);
      if (savedListings) {
        try {
          setListings(JSON.parse(savedListings));
        } catch (e) {}
      } else {
        setListings(PRESET_LISTINGS);
      }
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user]);

  // Persist listings of Simulated Offline mode to local disk per logged-in UID
  useEffect(() => {
    if (user && !isFirebaseConfigured) {
      localStorage.setItem(`markeer_listings_${user.uid}`, JSON.stringify(listings));
    }
  }, [listings, user]);

  const loginWithGoogle = async () => {
    if (isFirebaseConfigured) {
      const provider = new GoogleAuthProvider();
      try {
        await signInWithPopup(auth, provider);
      } catch (e) {
        console.error("OAuth Popup login failed:", e);
        throw e;
      }
    } else {
      // Simulate OAuth login
      const mockProfile = {
        uid: "simulated-buyer-uid",
        email: "test-user@google.com",
        displayName: "Simulated Reseller",
      };
      localStorage.setItem("markeer_sim_user", JSON.stringify(mockProfile));
      setUser(mockProfile);
    }
  };

  const simulateEmailLogin = (email: string) => {
    const formattedEmail = email.trim();
    const mockProfile = {
      uid: "simulated-" + formattedEmail.replace(/[^a-zA-Z0-9]/g, "-"),
      email: formattedEmail,
      displayName: formattedEmail.split("@")[0],
    };
    localStorage.setItem("markeer_sim_user", JSON.stringify(mockProfile));
    setUser(mockProfile);
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await signOut(auth);
    } else {
      localStorage.removeItem("markeer_sim_user");
      setUser(null);
    }
  };

  const saveListing = async (updated: ListingItem) => {
    // Client-side local update first
    setListings(prev => {
      const exists = prev.some(item => item.id === updated.id);
      let list;
      if (exists) {
        list = prev.map(item => item.id === updated.id ? updated : item);
      } else {
        list = [updated, ...prev];
      }
      if (user) {
        localStorage.setItem(`markeer_listings_${user.uid}`, JSON.stringify(list));
      }
      return list;
    });

    if (isFirebaseConfigured && user) {
      try {
        const docRef = doc(db, "users", user.uid, "listings", updated.id);
        const dataToSave = {
          ...updated,
          userId: user.uid,
        };
        await setDoc(docRef, dataToSave);
      } catch (err) {
        console.warn("Firestore saveListing failed. Buffered locally to localStorage:", err);
      }
    }
  };

  const deleteListing = async (id: string) => {
    setListings(prev => {
      const list = prev.filter(item => item.id !== id);
      if (user) {
        localStorage.setItem(`markeer_listings_${user.uid}`, JSON.stringify(list));
      }
      return list;
    });
    if (isFirebaseConfigured && user) {
      try {
        const docRef = doc(db, "users", user.uid, "listings", id);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn("Firestore deleteListing failed. Mapped locally to localStorage:", err);
      }
    }
  };

  const updateSubStatus = async (updated: SubscriptionStatus) => {
    if (isAdmin) return;

    setSubStatus(updated);
    if (user) {
      localStorage.setItem(`markeer_sub_${user.uid}`, JSON.stringify(updated));
    }
    if (isFirebaseConfigured && user) {
      try {
        const docRef = doc(db, "users", user.uid);
        await setDoc(docRef, {
          userId: user.uid,
          email: user.email,
          subscriptionTier: updated.tier,
          subscriptionActive: updated.isActive,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.warn("Firestore updateSubStatus failed. Preserved locally inside localStorage:", err);
      }
    }
  };

  const addBatchListings = async (items: ListingItem[]) => {
    setListings(prev => {
      const list = [...items, ...prev];
      if (user) {
        localStorage.setItem(`markeer_listings_${user.uid}`, JSON.stringify(list));
      }
      return list;
    });
    if (isFirebaseConfigured && user) {
       for (const item of items) {
        try {
          const docRef = doc(db, "users", user.uid, "listings", item.id);
          const dataToSave = {
            ...item,
            userId: user.uid,
          };
          await setDoc(docRef, dataToSave);
        } catch (err) {
          console.warn("Firestore addBatchListings failed. Saved locally in localStorage:", err);
        }
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        isFirebaseSetup: isFirebaseConfigured,
        listings,
        subStatus,
        loginWithGoogle,
        simulateEmailLogin,
        logout,
        saveListing,
        deleteListing,
        updateSubStatus,
        addBatchListings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }
  return context;
}
