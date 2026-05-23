import { useState } from 'react';
import { Bell, X, Info, Settings, Trash2, CheckCircle2, Star, CreditCard, User } from 'lucide-react';
import { useNotifications, Notification } from '../contexts/NotificationContext';
import { signInWithPopup, GoogleAuthProvider, signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { motion, AnimatePresence } from 'motion/react';
import MemberProfile from './MemberProfile';

const NotificationCenter = () => {
  const { 
    user, 
    profile, 
    notifications, 
    unreadCount, 
    pushSupported,
    pushEnabled,
    requestPushPermission,
    updatePreferences, 
    markAsRead,
    earnPoints
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFullProfile, setShowFullProfile] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);

  const handleEarnPoints = async () => {
    setIsCollecting(true);
    setHarvestMessage(null);
    const result = await earnPoints(5, 'Daily Harvest', true);
    if (!result.success && result.message) {
      setHarvestMessage(result.message);
    } else if (result.success) {
      setHarvestMessage('Harvest successful! 5 seeds added to your archive.');
    }
    setTimeout(() => setIsCollecting(false), 2000);
    // Auto-hide after 10s instead of 5s to give more time to read
    setTimeout(() => setHarvestMessage(null), 10000);
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed', error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    setIsOpen(false);
  };

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) markAsRead();
  };

  return (
    <div className="relative">
      <button 
        id="notification-bell"
        onClick={toggleOpen}
        className="relative p-2 rounded-full hover:bg-brand-secondary transition-colors group"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-brand-dark group-hover:text-brand-accent transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-brand-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-20 sm:top-full mt-2 sm:w-96 bg-white border border-brand-border shadow-2xl z-50 overflow-hidden rounded-sm"
            >
              {/* Header */}
              <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-secondary">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-brand-accent" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-brand-dark">Member Portal</h3>
                </div>
                <div className="flex items-center gap-2">
                  {user && (
                    <>
                      <button 
                        onClick={() => setShowFullProfile(true)}
                        className="p-1 hover:bg-brand-border rounded-full transition-colors"
                        title="Account Profile"
                      >
                        <User className="w-3.5 h-3.5 text-brand-dark/60" />
                      </button>
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-1 hover:bg-brand-border rounded-full transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-3.5 h-3.5 text-brand-dark/60" />
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-brand-border rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5 text-brand-dark/60" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {!user ? (
                  <div className="p-8 text-center">
                    <p className="text-xs text-brand-dark/60 mb-4 font-medium italic">
                      Join the Mustard Deli members portal for exclusive recipes, early access to new products, and special events.
                    </p>
                    <button 
                      onClick={handleLogin}
                      className="w-full py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
                    >
                      Sign In with Google
                    </button>
                    <p className="text-[9px] text-brand-dark/40 mt-4 leading-relaxed">
                      By signing in, you agree to our Terms of Service and Privacy Policy. We respect POPIA regulations.
                    </p>
                  </div>
                ) : showSettings ? (
                  <div className="p-4 space-y-4">
                    <div className="bg-brand-secondary p-4 border border-brand-border">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-3">Privacy & POPIA Compliance</h4>
                      <p className="text-[10px] text-brand-dark/60 mb-4 leading-relaxed">
                        We only send notifications for major updates. You can opt-out at any time, and your data remains private.
                      </p>
                      
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center h-5">
                          <input 
                            type="checkbox"
                            checked={profile?.wantsNotifications || false}
                            onChange={(e) => updatePreferences(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-10 h-5 rounded-full transition-colors ${profile?.wantsNotifications ? 'bg-brand-accent' : 'bg-brand-dark/20'}`} />
                          <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${profile?.wantsNotifications ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                        <span className="text-[10px] font-bold text-brand-dark leading-tight">
                          Receive in-app notifications
                        </span>
                      </label>

                      {pushSupported && !pushEnabled && (
                        <div className="mt-4 pt-4 border-t border-brand-border">
                          <p className="text-[9px] text-brand-dark/60 mb-3 italic">
                            For real-time delivery of Recipes, Stockists and Event updates even when the Deli app is closed, please enable push notifications.
                          </p>
                          <button 
                            onClick={requestPushPermission}
                            className="w-full py-1.5 bg-brand-accent text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark transition-colors"
                          >
                            Enable Push Notifications
                          </button>
                        </div>
                      )}

                      {pushEnabled && (
                        <div className="mt-2 flex items-center gap-2 text-[9px] text-green-600 font-bold uppercase tracking-tight">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          Push Notifications Enabled
                        </div>
                      )}
                    </div>
                    
                    <button 
                      onClick={handleLogout}
                      className="w-full py-2 border border-brand-dark/10 text-[9px] font-black uppercase tracking-widest text-brand-dark/60 hover:text-brand-accent hover:border-brand-accent transition-all"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-brand-border">
                    {/* Mustard Club Card */}
                    <div className="p-4 bg-brand-secondary">
                      <div className="bg-brand-dark text-white p-4 rounded-sm relative overflow-hidden group mb-4">
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white/20 to-transparent scale-150 animate-pulse" />
                        </div>
                        <div className="relative z-10">
                          <div className="flex justify-between items-start mb-6">
                            <div>
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-1">Mustard Club</h4>
                              <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest flex items-center gap-1">
                                <CreditCard className="w-2.5 h-2.5" /> Digital Member
                              </p>
                            </div>
                            <div className="text-right">
                              <span className="text-[12px] font-black italic uppercase tracking-tighter bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-sm">
                                {profile?.tier || 'Seedling'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex justify-between items-end">
                            <div>
                              <p className="text-[20px] font-black tracking-tighter mb-0.5">
                                {profile?.points || 0} 
                                <span className="text-[9px] opacity-60 uppercase font-black tracking-widest pl-1.5">Seeds</span>
                              </p>
                              <p className="text-[8px] font-medium opacity-40 uppercase tracking-widest truncate max-w-[150px]">
                                {user.email}
                              </p>
                            </div>
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:bg-brand-accent transition-colors">
                              <Star className={`w-5 h-5 text-white ${isCollecting ? 'animate-bounce' : ''}`} />
                            </div>
                          </div>
                        </div>
                      </div>

                      <button 
                        onClick={handleEarnPoints}
                        disabled={isCollecting}
                        className={`w-full py-2.5 border-2 border-brand-dark text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${isCollecting ? 'bg-brand-dark text-white' : 'hover:bg-brand-dark hover:text-white'}`}
                      >
                        {isCollecting ? (
                          <>Collecting Seeds...</>
                        ) : (
                          <>
                            <Star className="w-3 h-3 fill-current" />
                            Daily Harvest (+5 Seeds)
                          </>
                        )}
                      </button>

                      <AnimatePresence>
                        {harvestMessage && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="mt-3 p-3 bg-brand-accent/10 border border-brand-accent/20 rounded-sm relative"
                          >
                            <p className="text-[9px] font-bold text-brand-dark leading-tight italic pr-8">
                              {harvestMessage}
                            </p>
                            <button 
                              onClick={() => setHarvestMessage(null)}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-brand-accent/10 rounded-full text-brand-accent hover:bg-brand-accent hover:text-white transition-all shadow-sm"
                              aria-label="Close message"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Notifications Section */}
                    <div className="bg-white">
                      <div className="px-4 py-2 border-b border-brand-border bg-brand-secondary/50">
                        <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Latest Updates</span>
                      </div>

                      {pushSupported && !pushEnabled && profile?.wantsNotifications && (
                        <div className="m-4 p-4 bg-brand-accent/5 border border-dashed border-brand-accent rounded-sm">
                          <p className="text-[10px] font-bold text-brand-dark mb-2 uppercase tracking-tight">Enable Real-Time Updates</p>
                          <p className="text-[9px] text-brand-dark/60 mb-3 leading-relaxed italic">
                            Don't miss a harvest! Enable push notifications to get recipes and events even when you're away from the Deli.
                          </p>
                          <button 
                            onClick={requestPushPermission}
                            className="w-full py-2 bg-brand-accent text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark transition-colors shadow-sm"
                          >
                            Enable Push Notifications
                          </button>
                        </div>
                      )}

                      {!profile?.wantsNotifications ? (
                        <div className="p-8 text-center bg-white">
                          <div className="w-12 h-12 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                            <Bell className="w-6 h-6 text-brand-dark/20" />
                          </div>
                          <h4 className="text-xs font-bold text-brand-dark mb-2">Notifications Paused</h4>
                          <p className="text-[10px] text-brand-dark/60 mb-4 italic">
                            Enable notifications in settings to stay up to date with the Deli.
                          </p>
                          <button 
                            onClick={() => setShowSettings(true)}
                            className="px-6 py-2 bg-brand-dark text-white text-[9px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors"
                          >
                            Enable Updates
                          </button>
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-8 text-center text-brand-dark/40 italic text-xs bg-white">
                          No new messages at this time.
                        </div>
                      ) : (
                        <div className="divide-y divide-brand-border">
                          {notifications.map((note) => (
                            <div key={note.id} className="p-4 hover:bg-brand-secondary transition-colors group cursor-default">
                              <div className="flex items-start gap-3">
                                <div className="mt-1">
                                  {note.type === 'recipe' && <Info className="w-3.5 h-3.5 text-brand-accent" />}
                                  {note.type === 'product' && <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />}
                                  {note.type === 'event' && <Bell className="w-3.5 h-3.5 text-amber-600" />}
                                  {note.type === 'post' && <Info className="w-3.5 h-3.5 text-blue-600" />}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark">{note.type}</span>
                                    <span className="text-[8px] text-brand-dark/30">{note.createdAt?.toDate?.() ? note.createdAt.toDate().toLocaleDateString() : 'Just now'}</span>
                                  </div>
                                  <h4 className="text-[11px] font-bold text-brand-dark mb-1 leading-tight group-hover:text-brand-accent transition-colors">
                                    {note.title}
                                  </h4>
                                  <p className="text-[10px] text-brand-dark/60 leading-relaxed italic">
                                    {note.message}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2 bg-brand-dark flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Mustard Deli Members</span>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Live Feed</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showFullProfile && (
          <MemberProfile onClose={() => setShowFullProfile(false)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationCenter;
