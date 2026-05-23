import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  ShieldCheck, 
  Trash2, 
  Calendar, 
  Star, 
  CreditCard, 
  ChevronRight, 
  Bell, 
  Info,
  ArrowLeft,
  Package,
  Receipt,
  Loader2,
  Sparkles,
  Leaf,
  Share2,
  Rotate3d,
  Scan,
  MessageSquare,
  Beaker
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { motion, AnimatePresence } from 'motion/react';
import { fetchWithRetry } from '../lib/fetchUtils';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

interface MemberProfileProps {
  onClose: () => void;
}

interface Order {
  id: number;
  number: string;
  date: string;
  status: string;
  total: string;
  currency: string;
  items: Array<{ name: string; quantity: number }>;
}

interface ActivityRecord {
  id: string;
  type: string;
  message: string;
  createdAt: any;
}

interface UserTestimonial {
  id: string;
  text: string;
  rating: number;
  location: string;
  createdAt: any;
}

const MemberProfile: React.FC<MemberProfileProps> = ({ onClose }) => {
  const { 
    user, 
    profile, 
    pushSupported, 
    pushEnabled, 
    requestPushPermission, 
    updatePreferences, 
    redeemPoints, 
    earnPoints 
  } = useNotifications();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [activeTab, setActiveTab] = useState<'account' | 'orders' | 'loyalty' | 'records' | 'privacy' | 'system'>('account');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [wooProfile, setWooProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // Records state
  const [userActivity, setUserActivity] = useState<ActivityRecord[]>([]);
  const [userReviews, setUserReviews] = useState<UserTestimonial[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(false);

  useEffect(() => {
    if (activeTab === 'account' && profile?.email && !wooProfile) {
      fetchWooProfile();
    }
    if (activeTab === 'orders' && profile?.email) {
      fetchOrders();
    }
    if (activeTab === 'records' && user?.uid) {
      fetchUserRecords();
    }
  }, [activeTab, profile?.email, user?.uid]);

  const fetchWooProfile = async () => {
    if (!profile?.email) return;
    setLoadingProfile(true);
    try {
      const response = await fetchWithRetry(`/api/user/profile?email=${encodeURIComponent(profile.email)}`);
      if (response.ok) {
        const data = await response.json();
        setWooProfile(data);
      }
    } catch (err) {
      console.error("Failed to fetch WooCommerce profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchUserRecords = async () => {
    if (!user) return;
    setLoadingRecords(true);
    try {
      const { collection, query, where, getDocs, orderBy, limit } = await import('firebase/firestore');
      
      // Fetch Activity
      const actQuery = query(
        collection(db, 'activity'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      const actSnap = await getDocs(actQuery);
      setUserActivity(actSnap.docs.map(d => ({ id: d.id, ...d.data() } as ActivityRecord)));

      // Fetch Reviews (Testimonials)
      const revQuery = query(
        collection(db, 'testimonials'),
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
      const revSnap = await getDocs(revQuery);
      setUserReviews(revSnap.docs.map(d => ({ id: d.id, ...d.data() } as UserTestimonial)));

    } catch (err) {
      console.error("Failed to fetch user records:", err);
    } finally {
      setLoadingRecords(false);
    }
  };

  const fetchOrders = async (retryCount = 0) => {
    setLoadingOrders(true);
    try {
      const response = await fetchWithRetry(`/api/orders?email=${encodeURIComponent(profile!.email)}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      } else if (retryCount < 1) {
        // Simple one-time retry
        setTimeout(() => fetchOrders(retryCount + 1), 2000);
      }
    } catch (error) {
      console.error('Failed to fetch orders', error);
      if (retryCount < 1) {
        setTimeout(() => fetchOrders(retryCount + 1), 2000);
      }
    } finally {
      if (retryCount >= 1 || orders.length > 0) {
        setLoadingOrders(false);
      }
    }
  };

  if (!user || !profile) return null;

  const handleDeleteData = async () => {
    try {
      // POPIA: Right to be Forgotten
      await deleteDoc(doc(db, 'users', user.uid));
      // Optionally sign out or delete auth user (deleteUser requires recent login)
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error('Failed to delete data', error);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-white flex flex-col"
    >
      {/* Header */}
      <div className="px-6 py-8 border-b border-brand-border flex items-center justify-between">
        <button 
          onClick={onClose}
          className="flex items-center gap-2 group"
        >
          <ArrowLeft className="w-5 h-5 text-brand-dark group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest text-brand-dark">Back to Deli</span>
        </button>
        <div className="text-right">
          <h2 className="text-xs font-black uppercase tracking-widest text-brand-accent">Member Profile</h2>
          <p className="text-[8px] font-bold text-brand-dark/40 uppercase tracking-widest">Mustard Club Digital Card</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-12">
          
          {/* Digital Card Section */}
          <div className="mb-12">
            <div className="bg-brand-dark text-white rounded-sm relative overflow-hidden shadow-2xl">
              {/* Cover Image Background */}
              <div className="absolute inset-0 z-0">
                <img 
                  src={wooProfile?.coverImage || "https://images.unsplash.com/photo-1495107333219-6118c392bb81?auto=format&fit=crop&q=80&w=1200"} 
                  alt="" 
                  className="w-full h-full object-cover opacity-20 grayscale"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/80 to-transparent" />
              </div>

              <div className="relative z-10 p-8">
                <div className="flex justify-between items-start mb-12">
                  <div>
                    <h3 className="text-[14px] font-black uppercase tracking-[0.2em] text-brand-accent mb-3">Mustard Club</h3>
                    <div className="flex items-center gap-2">
                       <AnimatePresence mode="wait">
                          {profile.tier === 'Harvest' ? (
                            <motion.div 
                              key="harvest"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-4 py-1.5 bg-gradient-to-r from-brand-accent to-amber-400 rounded-none shadow-lg border border-amber-300 flex items-center gap-2"
                            >
                              <Sparkles className="w-3 h-3 text-brand-dark" />
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-brand-dark">Harvest Tier</span>
                            </motion.div>
                          ) : profile.tier === 'Sprout' ? (
                            <motion.div 
                              key="sprout"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-4 py-1.5 bg-green-600 rounded-none shadow-lg border border-green-500 flex items-center gap-2"
                            >
                              <Leaf className="w-3 h-3 text-white" />
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Sprout Tier</span>
                            </motion.div>
                          ) : (
                            <motion.div 
                              key="seedling"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="px-4 py-1.5 bg-white/10 rounded-none border border-white/20 flex items-center gap-2 backdrop-blur-md"
                            >
                              <Star className="w-3 h-3 text-brand-accent fill-brand-accent" />
                              <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white">Seedling Tier</span>
                            </motion.div>
                          )}
                       </AnimatePresence>
                    </div>
                  </div>
                  <CreditCard className="w-8 h-8 opacity-20" />
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[32px] font-black tracking-tighter leading-none mb-2">
                      {profile.points || 0}
                      <span className="text-[10px] uppercase font-black tracking-widest ml-3 text-brand-accent">Seeds Earned</span>
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center text-brand-dark font-black text-xs overflow-hidden border-2 border-brand-accent shadow-xl">
                        {wooProfile?.avatar || user.photoURL ? (
                          <img src={wooProfile?.avatar || user.photoURL || ""} alt="" className="w-full h-full object-cover" />
                        ) : (
                          profile.email.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-black uppercase tracking-widest">{wooProfile?.firstName ? `${wooProfile.firstName} ${wooProfile.lastName || ''}` : user.displayName || 'Member'}</p>
                        <p className="text-[9px] opacity-60 uppercase tracking-wider">{profile.email}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-40 mb-1">Authenticated</p>
                    <div className="flex gap-0.5">
                      {[1,2,3,4].map(i => <div key={i} className="w-4 h-1 bg-brand-accent" />)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-brand-border mb-8 overflow-x-auto scrollbar-hide -mx-6 px-6">
            <button 
              onClick={() => setActiveTab('account')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'account' ? 'text-brand-dark' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Account
              {activeTab === 'account' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-dark" />}
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'orders' ? 'text-brand-dark' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Orders
              {activeTab === 'orders' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-dark" />}
            </button>
            <button 
              onClick={() => setActiveTab('loyalty')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'loyalty' ? 'text-brand-dark' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Loyalty
              {activeTab === 'loyalty' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-dark" />}
            </button>
            <button 
              onClick={() => setActiveTab('records')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'records' ? 'text-brand-dark' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Artisan Records
              {activeTab === 'records' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-dark" />}
            </button>
            <button 
              onClick={() => setActiveTab('privacy')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'privacy' ? 'text-brand-dark' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Privacy
              {activeTab === 'privacy' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-dark" />}
            </button>
            <button 
              onClick={() => setActiveTab('system')}
              className={`pb-4 px-3 whitespace-nowrap text-[10px] font-black uppercase tracking-widest transition-colors relative ${activeTab === 'system' ? 'text-brand-accent' : 'text-brand-dark/30 hover:text-brand-dark'}`}
            >
              Settings Guide
              {activeTab === 'system' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-brand-accent" />}
            </button>
          </div>

          {activeTab === 'account' ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-6 border border-brand-border bg-brand-secondary/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Mail className="w-4 h-4 text-brand-dark/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Email Address</span>
                  </div>
                  <p className="text-xs font-bold text-brand-dark">{profile.email}</p>
                </div>
                <div className="p-6 border border-brand-border bg-brand-secondary/30">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-4 h-4 text-brand-dark/40" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Loyalty Since</span>
                  </div>
                  <p className="text-xs font-bold text-brand-dark">May 2026</p>
                </div>
              </div>

              <div className="p-4 sm:p-8 border border-brand-border rounded-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-6 flex items-center gap-2">
                  <Bell className="w-4 h-4" /> Notification Preferences
                </h4>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-brand-dark mb-1">New Recipes & Products</p>
                      <p className="text-[10px] text-brand-dark/60">Stay updated when we launch seasonal products.</p>
                    </div>
                    <button 
                      onClick={() => updatePreferences(!profile.wantsNotifications)}
                      className={`w-12 h-6 rounded-full transition-all relative ${profile.wantsNotifications ? 'bg-brand-accent' : 'bg-brand-dark/10'}`}
                    >
                      <motion.div 
                        animate={{ x: profile.wantsNotifications ? 24 : 4 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                      />
                    </button>
                  </div>
                  
                  {pushSupported && !pushEnabled && profile.wantsNotifications && (
                    <div className="mt-4 p-4 bg-brand-accent/5 border border-dashed border-brand-accent">
                      <p className="text-[10px] font-bold text-brand-dark mb-2 uppercase tracking-tight">Enable Device Notifications</p>
                      <p className="text-[9px] text-brand-dark/60 mb-3 leading-relaxed italic">
                        Receive real-time alerts for new recipes, event invitations, and artisanal releases directly on your device.
                      </p>
                      <button 
                        onClick={requestPushPermission}
                        className="w-full py-2 bg-brand-accent text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark transition-colors"
                      >
                        Grant Push Permission
                      </button>
                    </div>
                  )}

                  {pushEnabled && profile.wantsNotifications && (
                    <div className="mt-2 flex items-center gap-2 text-[9px] text-green-600 font-bold uppercase tracking-tight">
                      <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                      Device Notifications Enabled
                    </div>
                  )}
                  
                  {profile.wantsNotifications && profile.consentDate && (
                    <div className="p-3 bg-green-50 border border-green-100 flex items-center gap-3">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <p className="text-[9px] text-green-800 font-medium italic">
                        Consent updated on {profile.consentDate?.toDate?.() ? profile.consentDate.toDate().toLocaleString() : 'Just now'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Admin Simulation Section */}
              <div className="p-4 sm:p-8 border border-dashed border-brand-accent bg-brand-accent/5 rounded-sm">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Admin Simulation
                </h4>
                <p className="text-[10px] text-brand-dark/60 mb-6 leading-relaxed italic">
                  Broadcast a test notification to all subscribed users (latest recipes, events, posts, or stockists).
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { title: 'New Recipe', body: 'Check out our new Green Fig Salmon glaze!', type: 'recipe' },
                    { title: 'Upcoming Event', body: 'Join us for a tasting at Old Biscuit Mill this Saturday.', type: 'event' },
                    { title: 'Stockist Alert', body: 'Mustard Deli is now available at Woolworths V&A!', type: 'post' }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      onClick={async () => {
                        try {
                          const res = await fetch('/api/admin/broadcast', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item)
                          });
                          if (res.ok) alert('Broadcast sent!');
                        } catch (err) {
                          console.error('Broadcast failed', err);
                        }
                      }}
                      className="p-3 bg-white border border-brand-accent/20 hover:border-brand-accent text-[9px] font-black uppercase tracking-widest text-brand-dark transition-all text-left"
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === 'loyalty' ? (
            <div className="space-y-12">
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-brand-border pb-4">Redeem Seeds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { points: 50, discount: '15%', title: 'Silver Sprout' },
                    { points: 100, discount: '25%', title: 'Golden Harvest' },
                  ].map(tier => (
                    <div key={tier.points} className="p-6 border border-brand-border bg-white group hover:border-brand-accent transition-colors relative overflow-hidden">
                      <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                           <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">{tier.title}</span>
                           <span className="text-xl font-black text-brand-dark">{tier.points} <span className="text-[8px] uppercase">Seeds</span></span>
                        </div>
                        <p className="text-xs font-bold text-brand-dark mb-6">Unlock {tier.discount} discount on your next handcrafted reserve.</p>
                        <button 
                          onClick={() => {
                            if ((profile.points || 0) >= tier.points) {
                              redeemPoints(tier.points);
                            }
                          }}
                          disabled={(profile.points || 0) < tier.points}
                          className={`w-full py-4 text-[10px] font-black uppercase tracking-widest transition-all ${
                            (profile.points || 0) >= tier.points 
                              ? 'bg-brand-dark text-white hover:bg-brand-accent' 
                              : 'bg-brand-secondary text-brand-dark/20 cursor-not-allowed'
                          }`}
                        >
                          {(profile.points || 0) >= tier.points ? `Synthesize ${tier.discount} Code` : `Need ${tier.points - (profile.points || 0)} More Seeds`}
                        </button>
                      </div>
                      <div className="absolute -bottom-4 -right-4 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                        <Sparkles className="w-24 h-24 text-brand-dark" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {profile.coupons && profile.coupons.length > 0 && (
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-brand-border pb-4">Your Active Formulas</h3>
                  <div className="space-y-4">
                    {profile.coupons.map((coupon, idx) => (
                      <div key={idx} className="p-6 bg-brand-secondary/30 border border-brand-border flex justify-between items-center group">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40 mb-1">Generated {new Date(coupon.redeemedAt.toDate?.() || coupon.redeemedAt).toLocaleDateString()}</p>
                          <div className="flex items-center gap-3">
                            <span className="px-3 py-1 bg-brand-accent text-brand-dark text-[10px] font-black uppercase tracking-widest">
                              {coupon.discount} OFF
                            </span>
                            <span className="text-sm font-black tracking-widest text-brand-dark select-all">
                              {coupon.code}
                            </span>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                          }}
                          className="p-3 hover:bg-white transition-colors"
                          title="Copy Code"
                        >
                          <CreditCard className="w-4 h-4 text-brand-dark" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-8 bg-brand-dark text-white">
                <h4 className="text-[10px] font-black uppercase tracking-widest mb-4">How to earn more seeds</h4>
                <ul className="space-y-4 mb-8">
                  {[
                    { label: 'Share the Deli with a friend', points: '+5 Seeds', icon: Share2 },
                    { label: 'Complete an artisanal checkout', points: '+10 Seeds', icon: Package },
                    { label: 'Daily Harvest Button click', points: '+2 Seeds', icon: Leaf },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center justify-between group">
                      <div className="flex items-center gap-3">
                        <item.icon className="w-3.5 h-3.5 text-brand-accent" />
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</span>
                      </div>
                      <span className="text-[10px] font-black text-brand-accent">{item.points}</span>
                    </li>
                  ))}
                </ul>
                <button 
                  onClick={async () => {
                    const shareData = {
                      title: 'Mustard Deli - Artisan Flavours',
                      text: 'Check out these handcrafted South African mustards! Use my referral to earn seeds.',
                      url: window.location.origin,
                    };
                    try {
                      if (navigator.share) {
                        await navigator.share(shareData);
                      } else {
                        navigator.clipboard.writeText(window.location.origin);
                        alert('Referral link copied!');
                      }
                      earnPoints(5, 'Community Action');
                    } catch (err) {
                      console.log('Sharing failed', err);
                    }
                  }}
                  className="w-full py-4 border border-brand-accent text-brand-accent text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent hover:text-brand-dark transition-all flex items-center justify-center gap-3"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Synthesize Referral Link
                </button>
              </div>
            </div>
          ) : activeTab === 'orders' ? (
            <div className="space-y-6">
              {loadingOrders ? (
                <div className="flex flex-col items-center justify-center py-20 text-brand-dark/40">
                  <Loader2 className="w-8 h-8 animate-spin mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest italic">Retrieving your archives...</p>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-brand-border">
                  <Package className="w-12 h-12 text-brand-dark/10 mx-auto mb-4" />
                  <p className="text-xs font-bold text-brand-dark mb-1">No Orders Found</p>
                  <p className="text-[10px] text-brand-dark/40 italic">When you order your first batch, it will appear here.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <motion.div 
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 border border-brand-border bg-white hover:bg-brand-secondary/30 transition-colors group"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-dark text-white rounded-sm">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Order #{order.number}</p>
                            <p className="text-[10px] text-brand-dark/40">{new Date(order.date).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-black text-brand-dark">R{order.total}</p>
                            <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                              order.status === 'completed' ? 'bg-green-100 text-green-700' : 
                              order.status === 'processing' ? 'bg-blue-100 text-blue-700' : 'bg-brand-secondary text-brand-dark/40'
                            }`}>
                              {order.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="border-t border-brand-border pt-4">
                        <p className="text-[9px] font-black uppercase tracking-widest text-brand-dark/30 mb-2">Items</p>
                        <div className="flex flex-wrap gap-2">
                          {order.items.map((item, idx) => (
                            <span key={idx} className="text-[10px] font-bold text-brand-dark bg-brand-secondary px-2 py-1 italic">
                              {item.quantity}x {item.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'records' ? (
            <div className="space-y-12">
              {/* Activity Section */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-brand-border pb-4 flex items-center justify-between">
                  <span>Chemical Archives</span>
                  <span className="text-[10px] text-brand-dark/40 font-bold italic serif-italic">AR Deconstructions</span>
                </h3>
                
                {loadingRecords ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-dark/20" />
                  </div>
                ) : userActivity.length === 0 ? (
                  <div className="p-12 border border-dashed border-brand-border text-center">
                    <Rotate3d className="w-8 h-8 text-brand-dark/10 mx-auto mb-4" />
                    <p className="text-[10px] font-bold text-brand-dark uppercase tracking-widest">No scans recorded</p>
                    <p className="text-[9px] text-brand-dark/40 mt-1 italic serif-italic">Use the Apothecary AR Lens to deconstruct jar formulas.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userActivity.map((act) => (
                      <div key={act.id} className="p-4 border border-brand-border bg-brand-secondary/30 flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                          <div className="p-2 bg-brand-dark text-white rounded-sm">
                            {act.type === 'ar_scan' ? <Scan className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-brand-dark uppercase tracking-tight">
                              You {act.message}
                            </p>
                            <p className="text-[8px] text-brand-dark/40 uppercase tracking-widest mt-0.5">
                              {act.createdAt?.toDate?.() ? act.createdAt.toDate().toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Recently'}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-brand-dark/20 group-hover:text-brand-dark transition-colors" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Testimonials Section */}
              <div>
                <h3 className="text-sm font-black uppercase tracking-widest mb-6 border-b border-brand-border pb-4 flex items-center justify-between">
                  <span>Shared Stories</span>
                  <span className="text-[10px] text-brand-dark/40 font-bold italic serif-italic">Your Testimonials</span>
                </h3>
                
                {loadingRecords ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-brand-dark/20" />
                  </div>
                ) : userReviews.length === 0 ? (
                  <div className="p-12 border border-dashed border-brand-border text-center">
                    <MessageSquare className="w-8 h-8 text-brand-dark/10 mx-auto mb-4" />
                    <p className="text-[10px] font-bold text-brand-dark uppercase tracking-widest">No testimonials yet</p>
                    <p className="text-[9px] text-brand-dark/40 mt-1 italic serif-italic">Rate your experience via the "Share Your Story" button.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userReviews.map((rev) => (
                      <div key={rev.id} className="p-6 border border-brand-border bg-white shadow-sm relative group">
                        <div className="flex items-center gap-1 mb-3">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={`w-3 h-3 ${i < rev.rating ? 'text-brand-accent fill-brand-accent' : 'text-brand-dark/10'}`} />
                          ))}
                        </div>
                        <p className="text-xs text-brand-dark/80 leading-relaxed italic serif-italic mb-4">"{rev.text}"</p>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 italic">
                            Published via {rev.location}
                          </span>
                          <span className="text-[8px] font-bold text-brand-dark/20 uppercase">
                            {rev.createdAt?.toDate?.() ? rev.createdAt.toDate().toLocaleDateString() : 'Pending'}
                          </span>
                        </div>
                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                           <ShieldCheck className="w-4 h-4 text-brand-accent" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Lab Contributions (Future hook) */}
              <div className="p-8 border border-brand-accent/20 bg-brand-accent/5 rounded-sm">
                <div className="flex items-start gap-4">
                  <Beaker className="w-6 h-6 text-brand-accent" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">Flavor Lab Contributions</h4>
                    <p className="text-[10px] text-brand-dark/60 leading-relaxed italic">
                      Your experimental flavor profiles and recipe suggestions from the Community Lab will appear here in the next seasonal update.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'privacy' ? (
            <div className="space-y-8">
              <div className="prose prose-sm max-w-none">
                <div className="flex items-start gap-4 p-6 bg-brand-secondary rounded-sm mb-6">
                  <Info className="w-5 h-5 text-brand-dark mt-1" />
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark mb-2">South African POPIA Compliance</h4>
                    <p className="text-[11px] leading-relaxed text-brand-dark/70 mb-4">
                      The Protection of Personal Information Act (POPIA) ensures your personal data is handled responsibly. Mustard Deli is committed to:
                    </p>
                    <ul className="text-[10px] space-y-2 text-brand-dark/70 list-disc pl-4">
                      <li><strong>Transparency:</strong> We only store your email and loyalty points.</li>
                      <li><strong>Consent:</strong> We only send notifications if you explicitly opt-in.</li>
                      <li><strong>Right to Erasure:</strong> You can delete all your data instantly below.</li>
                    </ul>
                  </div>
                </div>

                <div className="border border-red-100 p-4 sm:p-8 rounded-sm">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-red-600 mb-4 flex items-center gap-2">
                    <Trash2 className="w-4 h-4" /> Danger Zone
                  </h4>
                  <p className="text-[10px] text-brand-dark/60 mb-6 leading-relaxed italic">
                    By deleting your profile, all your earned loyalty seeds, notification history, and preferences will be permanently removed from our systems. This action cannot be undone.
                  </p>
                  
                  {!showConfirmDelete ? (
                    <button 
                      onClick={() => setShowConfirmDelete(true)}
                      className="px-6 py-3 border-2 border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-colors"
                    >
                      Delete My Account & Data
                    </button>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest animate-pulse">Are you absolutely sure?</p>
                      <div className="flex gap-4">
                        <button 
                          onClick={handleDeleteData}
                          className="px-6 py-3 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest"
                        >
                          Yes, Delete Everything
                        </button>
                        <button 
                          onClick={() => setShowConfirmDelete(false)}
                          className="px-6 py-3 bg-brand-secondary text-brand-dark text-[10px] font-black uppercase tracking-widest"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="p-8 border border-brand-accent/20 bg-brand-accent/5">
                <h3 className="text-xl font-black text-brand-accent uppercase tracking-tight mb-4 text-center">Connection Guide</h3>
                <p className="text-sm text-brand-dark/60 leading-relaxed mb-8 text-center italic serif-italic">
                  "To activate the full artisanal suite (Live Map, WooCommerce Sync, and AI Sommelier), please configure your secret keys in the platform settings."
                </p>
                
                <div className="space-y-6">
                  <div className="p-6 bg-white border border-brand-border">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-2">Google Maps Platform</h4>
                    <p className="text-[10px] text-brand-dark/60 mb-3">Required for the interactive Stockist Map. Generate your key in the Google Cloud Console.</p>
                    <code className="block p-3 bg-brand-secondary text-[9px] font-mono text-brand-accent border border-brand-border">VITE_GOOGLE_MAPS_PLATFORM_KEY</code>
                  </div>
                  
                  <div className="p-6 bg-white border border-brand-border">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-2">WooCommerce API (Store Sync)</h4>
                    <p className="text-[10px] text-brand-dark/60 mb-3">Sync real-time products and customer orders. Enable REST API in WooCommerce &gt; Settings &gt; Advanced.</p>
                    <div className="space-y-2">
                       <code className="block p-3 bg-brand-secondary text-[9px] font-mono text-brand-dark border border-brand-border line-clamp-1">VITE_STORE_URL</code>
                       <code className="block p-3 bg-brand-secondary text-[9px] font-mono text-brand-dark border border-brand-border line-clamp-1">WOOCOMMERCE_KEY</code>
                       <code className="block p-3 bg-brand-secondary text-[9px] font-mono text-brand-dark border border-brand-border line-clamp-1">WOOCOMMERCE_SECRET</code>
                    </div>
                  </div>

                  <div className="p-6 bg-white border border-brand-border">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-2">Gemini AI Key</h4>
                    <p className="text-[10px] text-brand-dark/60 mb-3">Powers the Sommelier and Image Moderation. Provided automatically in your environment.</p>
                    <code className="block p-3 bg-brand-secondary text-[9px] font-mono text-brand-dark border border-brand-border">GEMINI_API_KEY</code>
                  </div>
                  
                  <div className="mt-8 flex justify-center">
                    <div className="flex gap-1.5 h-3 items-center opacity-20">
                      <div className="w-1.5 h-full bg-[#007C59]" />
                      <div className="w-1.5 h-full bg-[#E23D28]" />
                      <div className="w-1.5 h-full bg-[#002395]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-8 bg-brand-dark text-white/20 flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-[0.5em]">Mustard Deli</span>
        <span className="text-[8px] font-medium uppercase tracking-widest">© 2026 Mustard Deli South Africa</span>
      </div>
    </motion.div>
  );
};

export default MemberProfile;
