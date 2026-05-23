import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BarChart3, 
  Activity, 
  Settings, 
  Search, 
  ArrowUpRight, 
  ArrowDownRight,
  RefreshCw,
  Bell,
  CheckCircle2,
  AlertCircle,
  Mail
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy, 
  limit, 
  where,
  Timestamp,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { motion } from 'motion/react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import MessagingCenter from './MessagingCenter';

interface Stats {
  totalUsers: number;
  totalSuggestions: number;
  totalGallery: number;
  totalActivities: number;
  membersByTier: { [key: string]: number };
}

export default function AdminDashboard() {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'messaging' | 'gallery'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [recentGallery, setRecentGallery] = useState<any[]>([]);
  const [pendingGallery, setPendingGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [sendingNotification, setSendingNotification] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const suggestionsSnap = await getDocs(collection(db, 'suggestions'));
      const gallerySnap = await getDocs(collection(db, 'gallery'));
      const activitySnap = await getDocs(query(collection(db, 'activity'), limit(50)));

      const tierCount: { [key: string]: number } = { Seedling: 0, Sprout: 0, Harvest: 0 };
      const users: any[] = [];
      usersSnap.forEach(doc => {
        const data = doc.data();
        tierCount[data.tier || 'Seedling'] = (tierCount[data.tier || 'Seedling'] || 0) + 1;
        users.push({ id: doc.id, ...data });
      });

      setStats({
        totalUsers: usersSnap.size,
        totalSuggestions: suggestionsSnap.size,
        totalGallery: gallerySnap.size,
        totalActivities: activitySnap.size,
        membersByTier: tierCount
      });

      // Recent users sorted by updatedAt
      setRecentUsers(users.sort((a, b) => (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)).slice(0, 10));

      const gallery: any[] = [];
      gallerySnap.forEach(doc => gallery.push({ id: doc.id, ...doc.data() }));
      
      const sortedGallery = gallery.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setRecentGallery(sortedGallery.slice(0, 5));
      setPendingGallery(gallery.filter(item => item.status === 'pending').sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));

    } catch (err: any) {
      console.error(err);
      if (err.message.includes('{')) {
        // Likely our custom JSON error
        try {
          const info = JSON.parse(err.message);
          setError(`Permission Error: ${info.operationType} at ${info.path}`);
        } catch {
          setError('Permission Error: Access Denied to Command Center.');
        }
      } else {
        setError('Failed to fetch stats. Check console for details.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const sendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationMsg.trim()) return;
    setSendingNotification(true);
    try {
      await addDoc(collection(db, 'notifications'), {
        title: 'Admin Announcement',
        message: notificationMsg,
        type: 'post',
        createdAt: serverTimestamp(),
      });
      setNotificationMsg('');
      alert('Notification sent to all users!');
    } catch (err) {
      alert('Failed to send notification.');
    } finally {
      setSendingNotification(false);
    }
  };

  const updateGalleryStatus = async (id: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'gallery', id), { 
        status,
        updatedAt: serverTimestamp() 
      });
      setPendingGallery(prev => prev.filter(item => item.id !== id));
      // Update the status in recentGallery too if it's there
      setRecentGallery(prev => prev.map(item => item.id === id ? { ...item, status } : item));
      alert(`Submission ${status}!`);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen pt-32 px-6 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-brand-accent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-32 pb-20 px-6 md:px-12 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-4 block">Command Center</span>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-brand-dark leading-none">Admin <br/><span className="serif-italic lowercase text-brand-accent">Dashboard</span></h1>
          </div>
          <button 
            onClick={fetchStats}
            className="px-6 py-3 bg-white border border-brand-border text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-brand-secondary transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex border-b border-brand-border mb-12 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: BarChart3 },
            { id: 'messaging', label: 'Advanced Messaging', icon: Mail },
            { id: 'gallery', label: 'Gallery Moderation', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                activeSubTab === tab.id 
                  ? 'border-brand-dark text-brand-dark' 
                  : 'border-transparent text-brand-dark/40 hover:text-brand-dark'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === 'messaging' ? (
          <div className="h-[700px] border border-brand-border mb-12">
            <MessagingCenter />
          </div>
        ) : activeSubTab === 'gallery' ? (
          <div className="bg-white border border-brand-border p-8 min-h-[400px] mb-12">
             <div className="flex items-center justify-between mb-8">
               <h2 className="text-2xl font-black uppercase tracking-tight text-brand-dark">Pending Approvals</h2>
               <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent px-3 py-1 bg-brand-accent/10">
                 {pendingGallery.length} Items Waiting
               </span>
             </div>
             {pendingGallery.length > 0 ? (
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {pendingGallery.map(img => (
                    <div key={img.id} className="border border-brand-border overflow-hidden flex flex-col">
                      <div className="aspect-video relative bg-brand-secondary">
                        <img src={img.imageUrl} className="w-full h-full object-cover" />
                        <div className="absolute top-2 right-2">
                           <span className="px-2 py-1 bg-brand-dark/80 text-white text-[7px] font-black uppercase tracking-[0.2em] backdrop-blur-sm">Pending</span>
                        </div>
                      </div>
                      <div className="p-4 bg-brand-secondary/30 flex-1 flex flex-col">
                        <p className="text-[10px] font-black uppercase mb-1">{img.userName}</p>
                        <p className="text-[10px] text-brand-dark/60 mb-6 italic flex-1">{img.caption ? `"${img.caption}"` : 'No caption provided'}</p>
                        <div className="flex gap-2">
                           <button 
                             onClick={() => updateGalleryStatus(img.id, 'approved')}
                             className="flex-1 py-2.5 bg-green-600 text-white text-[8px] font-black uppercase tracking-widest hover:bg-green-700 transition-colors shadow-lg shadow-green-600/10"
                           >
                             Approve
                           </button>
                           <button 
                             onClick={() => updateGalleryStatus(img.id, 'rejected')}
                             className="flex-1 py-2.5 bg-brand-dark text-white text-[8px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors shadow-lg"
                           >
                             Reject
                           </button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             ) : (
               <div className="h-[300px] flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center mb-4">
                    <CheckCircle2 className="w-6 h-6 text-brand-dark/20" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-brand-dark/40">Queue Clear</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/20 mt-1">All mustard moments are moderated.</p>
               </div>
             )}
          </div>
        ) : (
          <>
            {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-600 flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Members', value: stats?.totalUsers, icon: Users, trend: '+12%', up: true },
            { label: 'Artisanal Suggestions', value: stats?.totalSuggestions, icon: Activity, trend: '+5%', up: true },
            { label: 'Gallery Submissions', value: stats?.totalGallery, icon: BarChart3, trend: '-2%', up: false },
            { label: 'Live Activities', value: stats?.totalActivities, icon: Activity, trend: '+40%', up: true },
          ].map((stat, i) => (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 border border-brand-border shadow-sm group hover:border-brand-accent transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-brand-secondary rounded-lg">
                  <stat.icon className="w-5 h-5 text-brand-dark" />
                </div>
                <div className={`flex items-center gap-1 text-[10px] font-bold ${stat.up ? 'text-green-600' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              </div>
              <h3 className="text-3xl font-black text-brand-dark mb-1">{stat.value}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">{stat.label}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Members */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white border border-brand-border shadow-sm overflow-hidden">
              <div className="p-6 border-b border-brand-border flex items-center justify-between">
                <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark">Recent Members</h3>
                <span className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-widest">Active Database Sync</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-brand-secondary">
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/40 border-b border-brand-border">Member</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/40 border-b border-brand-border">Tier</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/40 border-b border-brand-border">Seeds</th>
                      <th className="p-4 text-[10px] font-black uppercase tracking-widest text-brand-dark/40 border-b border-brand-border">Last Sync</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-brand-secondary/50 transition-colors">
                        <td className="p-4 border-b border-brand-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                              <span className="text-[10px] font-bold text-brand-accent">{user.displayName ? user.displayName[0] : 'U'}</span>
                            </div>
                            <div>
                                <p className="text-[11px] font-black text-brand-dark uppercase tracking-wide">{user.displayName || 'Anon'}</p>
                                <p className="text-[9px] text-brand-dark/40 font-medium">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 border-b border-brand-border">
                          <span className={`px-2 py-1 text-[8px] font-black uppercase tracking-widest rounded ${
                            user.tier === 'Harvest' ? 'bg-brand-accent text-white' : 
                            user.tier === 'Sprout' ? 'bg-brand-secondary text-brand-dark border border-brand-border' : 
                            'bg-gray-100 text-gray-400'
                          }`}>
                            {user.tier || 'Seedling'}
                          </span>
                        </td>
                        <td className="p-4 border-b border-brand-border text-[11px] font-bold text-brand-dark">{user.points || 0}</td>
                        <td className="p-4 border-b border-brand-border text-[10px] text-brand-dark/40 font-medium">
                          {user.updatedAt ? new Date(user.updatedAt.seconds * 1000).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Gallery Moderation */}
            <div className="bg-white border border-brand-border shadow-sm p-6">
              <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-6">Recent Gallery Submissions</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {recentGallery.map((img) => (
                  <div key={img.id} className="relative aspect-square group overflow-hidden border border-brand-border">
                    <img 
                      src={img.imageUrl} 
                      alt={img.caption} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-brand-dark/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4">
                      <p className="text-[10px] font-bold text-white text-center mb-2">{img.userName}</p>
                      <span className={`px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded ${
                        img.status === 'approved' ? 'bg-green-500' : 'bg-orange-500'
                      } text-white animate-pulse`}>
                        {img.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {/* Global Communication */}
            <div className="bg-white border border-brand-border shadow-sm p-8">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="w-5 h-5 text-brand-accent" />
                <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark">Deli Broadcast</h3>
              </div>
              <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest mb-6 border-l-2 border-brand-accent pl-4">
                Post an announcement to the harvest ticker and notification bridge.
              </p>
              <form onSubmit={sendNotification} className="space-y-4">
                <textarea 
                  value={notificationMsg}
                  onChange={(e) => setNotificationMsg(e.target.value)}
                  placeholder="The new Dijon batch has arrived..."
                  className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none min-h-[120px] transition-all"
                />
                <button 
                  type="submit"
                  disabled={sendingNotification}
                  className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-all disabled:opacity-50"
                >
                  {sendingNotification ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpRight className="w-4 h-4" />}
                  Send Broadcast
                </button>
              </form>
            </div>

            {/* Member Tiers Distribution */}
            <div className="bg-white border border-brand-border shadow-sm p-8">
              <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-6">Tier Distribution</h3>
              <div className="space-y-4">
                {[
                  { label: 'Harvest', color: 'bg-brand-accent', count: stats?.membersByTier.Harvest || 0 },
                  { label: 'Sprout', color: 'bg-brand-dark', count: stats?.membersByTier.Sprout || 0 },
                  { label: 'Seedling', color: 'bg-brand-secondary', count: stats?.membersByTier.Seedling || 0 },
                ].map((tier) => (
                  <div key={tier.label}>
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                        <span>{tier.label}</span>
                        <span>{tier.count}</span>
                    </div>
                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${(tier.count / (stats?.totalUsers || 1)) * 100}%` }}
                        className={`h-full ${tier.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-brand-dark p-8 shadow-xl">
              <h3 className="text-lg font-black uppercase tracking-tight text-white mb-6">System Health</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-white/60">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Firestore Status</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-white/60">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Live Activity Bridge</span>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <div className="flex items-center justify-between text-white/60">
                    <span className="text-[10px] font-bold uppercase tracking-widest">Sync Queue</span>
                    <span className="text-[10px] font-black text-brand-accent">IDLE</span>
                </div>
              </div>
            </div>
            </div>
          </div>
        </>
      )}
    </div>
  </div>
);
}
