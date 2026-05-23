import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  setDoc, 
  getDoc,
  updateDoc,
  serverTimestamp,
  Timestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getToken, onMessage } from 'firebase/messaging';
import { db, auth, messaging } from '../lib/firebase';
import { fetchWithRetry } from '../lib/fetchUtils';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

// Using shared utils instead

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'recipe' | 'product' | 'post' | 'event';
  link?: string;
  createdAt: any;
}

interface Coupon {
  code: string;
  discount: string;
  redeemedAt: any;
}

interface PointTransaction {
  id: string;
  amount: number;
  reason: string;
  createdAt: any;
}

interface UserProfile {
  uid: string;
  email: string;
  role?: 'customer' | 'wholesale' | 'stockist';
  fcmToken?: string;
  wantsNotifications: boolean;
  geofencingEnabled?: boolean;
  consentDate?: any;
  points?: number;
  tier?: 'Seedling' | 'Sprout' | 'Harvest';
  lastHarvestDate?: any;
  coupons?: Coupon[];
  pointHistory?: PointTransaction[];
}

interface NotificationContextType {
  user: User | null;
  profile: UserProfile | null;
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  pushSupported: boolean;
  pushEnabled: boolean;
  localNotifications: { id: string; title: string; message: string }[];
  requestPushPermission: () => Promise<boolean>;
  updatePreferences: (wants: boolean) => Promise<void>;
  markAsRead: () => void;
  earnPoints: (amount: number, reason?: string, isHarvest?: boolean) => Promise<{ success: boolean; message?: string }>;
  redeemPoints: (pointsCost: number) => Promise<{ success: boolean; coupon?: string; message?: string }>;
  addLocalNotification: (title: string, message: string) => void;
  geofencingEnabled: boolean;
  setGeofencingEnabled: (enabled: boolean) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pushSupported, setPushSupported] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [localNotifications, setLocalNotifications] = useState<{ id: string; title: string; message: string }[]>([]);

  const addLocalNotification = (title: string, message: string) => {
    const id = Math.random().toString(36).substring(7);
    setLocalNotifications(prev => [...prev, { id, title, message }]);
    
    // Also try browser notification
    if (Notification.permission === 'granted') {
      new Notification(title, { body: message, icon: '/favicon.ico' });
    }

    setTimeout(() => {
      setLocalNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const setGeofencingEnabled = async (enabled: boolean) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    try {
      await setDoc(profileRef, { geofencingEnabled: enabled }, { merge: true });
      setProfile(prev => prev ? { ...prev, geofencingEnabled: enabled } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  // ... (rest of useEffects)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && messaging) {
      setPushSupported(true);
      setPushEnabled(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    if (!messaging || !user || !profile?.wantsNotifications || Notification.permission !== 'granted') return;

    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
      console.log('Message received in foreground: ', payload);
      // Foreground notification handled by standard Notification API or UI toast
      if (payload.notification) {
        new Notification(payload.notification.title || 'Mustard Deli Update', {
          body: payload.notification.body,
          icon: '/favicon.ico'
        });
      }
    });

    return () => unsubscribeOnMessage();
  }, [user, profile?.wantsNotifications]);

  const requestPushPermission = async (): Promise<boolean> => {
    if (!pushSupported || !messaging || !user) return false;

    try {
      const permission = await Notification.requestPermission();
      setPushEnabled(permission === 'granted');
      
      if (permission === 'granted') {
        // VAPID key is usually required for web push. 
        // We use a public one or the messagingSenderId depending on setup.
        // For AI Studio, we'll try to get it, but it might require a real VAPID key from Firebase console.
        const token = await getToken(messaging, {
          vapidKey: undefined // User should provide this if it fails
        });

        if (token) {
          const profileRef = doc(db, 'users', user.uid);
          await updateDoc(profileRef, { 
            fcmToken: token,
            wantsNotifications: true,
            consentDate: serverTimestamp()
          });
          setProfile(prev => prev ? { ...prev, fcmToken: token, wantsNotifications: true } : null);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (authUser) => {
      setUser(authUser);
      if (authUser) {
        // Fetch/Create profile
        const profileRef = doc(db, 'users', authUser.uid);
        try {
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            setProfile(profileSnap.data() as UserProfile);
          } else {
            // POPIA: Default to false, wait for explicit consent
            const newProfile: UserProfile = {
              uid: authUser.uid,
              email: authUser.email || '',
              wantsNotifications: false,
              points: 10, // Welcome points
              tier: 'Seedling'
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }

          // Sync role from WooCommerce
          if (authUser.email) {
            try {
              const res = await fetchWithRetry(`/api/user/role?email=${encodeURIComponent(authUser.email)}`);
              if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
              const data = await res.json();
              if (data.role && data.role !== 'customer') {
                await setDoc(profileRef, { role: data.role }, { merge: true });
                setProfile(prev => prev ? { ...prev, role: data.role } : null);
              }
            } catch (roleError) {
              console.error("Failed to sync role:", roleError);
            }
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${authUser.uid}`);
        }
      } else {
        setProfile(null);
        setNotifications([]);
      }
      setLoading(false);
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribeNotes = onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Notification[];
      setNotifications(notes);
      // Only count as unread if user is logged in and wants them
      setUnreadCount(user && profile?.wantsNotifications ? notes.length : 0);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'notifications');
    });

    return () => unsubscribeNotes();
  }, [user, profile?.wantsNotifications]);

  const updatePreferences = async (wants: boolean) => {
    if (!user) return;
    const profileRef = doc(db, 'users', user.uid);
    try {
      const updateData = {
        wantsNotifications: wants,
        consentDate: wants ? serverTimestamp() : null
      };
      await setDoc(profileRef, updateData, { merge: true });
      setProfile(prev => prev ? { ...prev, ...updateData } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  const markAsRead = () => {
    setUnreadCount(0);
  };

  const earnPoints = async (amount: number, reason: string = 'Community Action', isHarvest?: boolean) => {
    if (!user || !profile) return { success: false };
    const profileRef = doc(db, 'users', user.uid);
    try {
      if (isHarvest && profile.lastHarvestDate) {
        const lastHarvest = profile.lastHarvestDate.toDate?.() || new Date(profile.lastHarvestDate);
        const today = new Date();
        if (lastHarvest.toDateString() === today.toDateString()) {
          return { 
            success: false, 
            message: `Thank you for clicking the Daily Harvest Button, ${amount} points allocated already, please click again tomorrow.` 
          };
        }
      }

      const newPoints = (profile.points || 0) + amount;
      let newTier: 'Seedling' | 'Sprout' | 'Harvest' = 'Seedling';
      if (newPoints >= 100) newTier = 'Harvest';
      else if (newPoints >= 50) newTier = 'Sprout';

      const transaction: PointTransaction = {
        id: Math.random().toString(36).substring(7),
        amount,
        reason,
        createdAt: new Date().toISOString()
      };

      const updateData: any = {
        points: newPoints,
        tier: newTier,
        pointHistory: [transaction, ...(profile.pointHistory || [])].slice(0, 5) // Keep last 5
      };

      if (isHarvest) {
        updateData.lastHarvestDate = serverTimestamp();
      }

      await setDoc(profileRef, updateData, { merge: true });
      
      // Update local state (optimistic)
      const updatedProfile = { ...profile, ...updateData };
      if (isHarvest) updatedProfile.lastHarvestDate = Timestamp.now();
      setProfile(updatedProfile);

      addLocalNotification(
        "Seeds Earned! 🌱",
        `+${amount} Seeds for ${reason}. Your new balance is ${newPoints}.`
      );

      return { success: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      return { success: false };
    }
  };

  const redeemPoints = async (pointsCost: number) => {
    if (!user || !profile) return { success: false, message: 'Not authenticated' };
    if ((profile.points || 0) < pointsCost) return { success: false, message: 'Insufficient points' };

    const profileRef = doc(db, 'users', user.uid);
    try {
      const discount = pointsCost >= 100 ? '25%' : pointsCost >= 50 ? '15%' : '10%';
      const code = `MUSTARD-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const newCoupon: Coupon = {
        code,
        discount,
        redeemedAt: serverTimestamp()
      };

      const updatedCoupons = [...(profile.coupons || []), newCoupon];
      const newPoints = (profile.points || 0) - pointsCost;
      
      // Downgrade tier logic if needed (usually loyalty systems don't downgrade, but let's stick to the points threshold for simplicity)
      let newTier: 'Seedling' | 'Sprout' | 'Harvest' = 'Seedling';
      if (newPoints >= 100) newTier = 'Harvest';
      else if (newPoints >= 50) newTier = 'Sprout';

      const updateData = {
        points: newPoints,
        tier: newTier,
        coupons: updatedCoupons
      };

      await setDoc(profileRef, updateData, { merge: true });
      
      setProfile(prev => prev ? { ...prev, ...updateData, coupons: [...(prev.coupons || []), { ...newCoupon, redeemedAt: Timestamp.now() }] } : null);

      return { success: true, coupon: code };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      return { success: false, message: 'Redemption failed' };
    }
  };

  return (
    <NotificationContext.Provider value={{ 
      user, 
      profile, 
      notifications, 
      unreadCount, 
      loading, 
      pushSupported,
      pushEnabled,
      requestPushPermission,
      updatePreferences,
      markAsRead,
      earnPoints,
      redeemPoints,
      addLocalNotification,
      geofencingEnabled: profile?.geofencingEnabled || false,
      setGeofencingEnabled,
      localNotifications
    }}>
      {children}
      
      {/* Render local ephemeral notifications */}
      <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-4">
        {localNotifications.map(note => (
          <div key={note.id} className="bg-brand-dark text-white p-4 shadow-2xl border border-brand-accent/30 pointer-events-auto animate-in slide-in-from-top duration-300">
             <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-accent mb-1">{note.title}</h4>
             <p className="text-[11px] font-medium leading-tight">{note.message}</p>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
