import { motion, AnimatePresence } from 'motion/react';
import { X, LogIn, LogOut, User as UserIcon, ShieldCheck, Sprout, Wheat, RefreshCw, MapPin } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { useState, useEffect } from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTabChange?: (tab: string) => void;
}

export default function AuthModal({ isOpen, onClose, onTabChange }: AuthModalProps) {
  const { 
    user, 
    profile, 
    loginWithGoogle, 
    logout, 
    signUpWithEmail, 
    signInWithEmail, 
    resetPassword,
    updateUserProfile,
    isAdmin
  } = useAuth();
  const { earnPoints, geofencingEnabled, setGeofencingEnabled } = useNotifications();
  
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot' | 'profile'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [harvestLoading, setHarvestLoading] = useState(false);
  const [harvestMessage, setHarvestMessage] = useState<string | null>(null);

  // Sync name when entering profile mode
  useEffect(() => {
    if (authMode === 'profile' && profile) {
      setName(profile.displayName || '');
    }
  }, [authMode, profile]);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      onClose();
    } catch (err: any) {
      setError('Connection failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      if (authMode === 'login') {
        await signInWithEmail(email, password);
        onClose();
      } else if (authMode === 'signup') {
        await signUpWithEmail(email, password, name);
        onClose();
      } else if (authMode === 'forgot') {
        await resetPassword(email);
        setSuccessMsg('Check your email for password reset instructions.');
      } else if (authMode === 'profile') {
        await updateUserProfile({ displayName: name });
        setSuccessMsg('Profile updated successfully!');
        setTimeout(() => setAuthMode('login'), 2000); // Switch back or just stay
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDailyHarvest = async () => {
    setHarvestLoading(true);
    setHarvestMessage(null);
    const result = await earnPoints(5, 'Daily Harvest', true);
    if (!result.success && result.message) {
      setHarvestMessage(result.message);
    } else if (result.success) {
      setHarvestMessage('Success: 5 Seeds harvested!');
    }
    setHarvestLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-sm z-[100]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[101] shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1.5 bg-brand-accent"></div>
            
            <div className="p-10 pt-12">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 text-brand-dark/20 hover:text-brand-dark transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-border overflow-hidden">
                  {user?.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={profile?.displayName || 'Member'} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserIcon className="w-6 h-6 text-brand-dark/40" />
                  )}
                </div>
                <h2 className="text-2xl font-black uppercase tracking-tight text-brand-dark mb-2">
                  {user ? 'Deli Member' : (authMode === 'signup' ? 'Join the Deli' : (authMode === 'forgot' ? 'Reset Password' : 'Welcome Back'))}
                </h2>
                <p className="text-[10px] text-brand-dark/40 font-bold uppercase tracking-[0.2em]">
                  {user ? 'Profile & Sync Management' : (authMode === 'signup' ? 'Create your artisanal account' : (authMode === 'forgot' ? 'Find your way back' : 'Access your website account & rewards'))}
                </p>
              </div>

              {user ? (
                <div className="space-y-6">
                  {authMode === 'profile' ? (
                    <form onSubmit={handleSubmit} className="space-y-4">
                      {error && (
                        <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
                          {error}
                        </div>
                      )}
                      {successMsg && (
                        <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-[10px] font-bold uppercase tracking-widest text-center">
                          {successMsg}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Display Name</label>
                        <input 
                          type="text" 
                          required
                          value={name || ''}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none transition-all"
                          placeholder="YOUR NAME"
                        />
                      </div>
                      <div className="flex gap-3">
                        <button 
                          type="button"
                          onClick={() => setAuthMode('login')}
                          className="flex-1 py-4 border border-brand-border text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-secondary transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={isLoading}
                          className="flex-[2] py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-all disabled:opacity-50"
                        >
                          {isLoading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="p-4 bg-brand-secondary border border-brand-border">
                        <div className="flex items-center gap-4">
                          <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">{profile?.displayName || user.displayName}</p>
                            <p className="text-[9px] text-brand-dark/60 font-medium">{user.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <div className="px-2 py-1 bg-green-500/10 border border-green-500/20 rounded">
                              <span className="text-[8px] font-black text-green-600 uppercase tracking-widest">Active Member</span>
                            </div>
                            <button 
                              onClick={() => setAuthMode('profile')}
                              className="text-[8px] font-bold text-brand-accent uppercase tracking-widest hover:underline"
                            >
                              Edit Profile
                            </button>
                            <button 
                              onClick={() => { onClose(); onTabChange?.('messages'); }}
                              className="text-[8px] font-bold text-brand-dark uppercase tracking-widest hover:underline mt-1"
                            >
                              My Dispatches
                            </button>
                            {isAdmin && (
                              <button 
                                onClick={() => { onClose(); onTabChange?.('admin'); }}
                                className="text-[8px] font-black text-brand-dark uppercase tracking-widest bg-brand-accent/20 px-2 py-0.5 rounded hover:bg-brand-accent/30 transition-colors mt-1"
                              >
                                Admin Panel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Geofencing Toggle */}
                      <div className="p-4 bg-brand-secondary border border-brand-border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <MapPin className={`w-4 h-4 ${geofencingEnabled ? 'text-brand-accent animate-pulse' : 'text-brand-dark/30'}`} />
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Stockist Reminders</p>
                              <p className="text-[9px] text-brand-dark/60 font-medium">Notify when within 1km of a deli</p>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setGeofencingEnabled(!geofencingEnabled)}
                            className={`relative w-10 h-5 transition-colors duration-200 ease-in-out ${geofencingEnabled ? 'bg-brand-accent' : 'bg-brand-dark/20'} rounded-full`}
                          >
                            <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${geofencingEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Point History */}
                      {profile?.pointHistory && profile.pointHistory.length > 0 && (
                        <div className="border border-brand-border bg-brand-secondary/50">
                          <p className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 px-4 py-2 border-b border-brand-border bg-brand-secondary text-center">Recent Seed Activity</p>
                          <div className="divide-y divide-brand-border">
                            {profile.pointHistory.map(entry => (
                              <div key={entry.id} className="flex items-center justify-between p-3">
                                <div className="max-w-[70%]">
                                  <p className="text-[9px] font-black uppercase text-brand-dark truncate">{entry.reason}</p>
                                  <p className="text-[7px] text-brand-dark/40 font-medium uppercase">{new Date(entry.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className="text-[10px] font-black text-brand-accent">+{entry.amount} Seeds</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col items-center justify-center p-4 border border-brand-border">
                          <span className="text-sm font-black text-brand-dark mb-1 uppercase">{profile?.tier || 'SEEDLING'}</span>
                          <span className="text-[8px] font-bold text-brand-dark/40 uppercase tracking-widest">Deli Tier</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 border border-brand-border">
                          <span className="text-sm font-black text-brand-dark mb-1">{profile?.points || 0}</span>
                          <span className="text-[8px] font-bold text-brand-dark/40 uppercase tracking-widest">Mustard Seeds</span>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="relative group/harvest">
                          <button 
                            onClick={handleDailyHarvest}
                            disabled={harvestLoading}
                            className={`w-full py-4 border-2 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 transition-all disabled:opacity-50 ${
                              harvestMessage?.includes('Success') 
                                ? 'bg-green-50 border-green-200 text-green-700' 
                                : 'bg-brand-accent/5 border-brand-accent/20 text-brand-accent hover:bg-brand-accent/10'
                            }`}
                          >
                            {harvestLoading ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Wheat className="w-3.5 h-3.5" />
                            )}
                            {harvestMessage || 'Daily Seed Harvest'}
                          </button>
                        </div>

                        <button 
                          onClick={async () => { await logout(); onClose(); }}
                          className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-all"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Logout
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-bold uppercase tracking-widest text-center">
                      {error}
                    </div>
                  )}
                  {successMsg && (
                    <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-[10px] font-bold uppercase tracking-widest text-center">
                      {successMsg}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {authMode === 'signup' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Full Name</label>
                        <input 
                          type="text" 
                          required
                          value={name || ''}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none transition-all"
                          placeholder="ARTISAN NAME"
                        />
                      </div>
                    )}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={email || ''}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none transition-all"
                        placeholder="JAR@MUSTARDDELI.CO.ZA"
                      />
                    </div>
                    {authMode !== 'forgot' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Password</label>
                        <input 
                          type="password" 
                          required
                          value={password || ''}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold focus:border-brand-accent outline-none transition-all"
                          placeholder="••••••••"
                        />
                      </div>
                    )}

                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-all disabled:opacity-50"
                    >
                      {isLoading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <LogIn className="w-3.5 h-3.5" />
                      )}
                      {authMode === 'signup' ? 'Create Account' : (authMode === 'forgot' ? 'Send Reset Link' : 'Sign In')}
                    </button>
                  </form>

                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      {authMode === 'login' ? (
                        <>
                          <button 
                            onClick={() => setAuthMode('signup')}
                            className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline"
                          >
                            New here? Join us
                          </button>
                          <button 
                            onClick={() => setAuthMode('forgot')}
                            className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-dark"
                          >
                            Forgot Password?
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setAuthMode('login')}
                          className="text-[9px] font-black uppercase tracking-widest text-brand-accent hover:underline mx-auto"
                        >
                          Already have an account? Sign In
                        </button>
                      )}
                    </div>

                    <div className="relative py-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-brand-border"></div>
                      </div>
                      <div className="relative flex justify-center text-[8px] font-black uppercase tracking-widest">
                        <span className="bg-white px-3 text-brand-dark/30">Or sync with</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleGoogleLogin}
                      disabled={isLoading}
                      className="w-full py-3.5 border-2 border-brand-border bg-white text-brand-dark text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:border-brand-dark transition-all disabled:opacity-50"
                    >
                      <img src="https://www.google.com/favicon.ico" alt="Google" className="w-3 h-3" />
                      Sync with Google
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-brand-secondary p-6 text-center border-t border-brand-border">
              <p className="text-[9px] font-bold text-brand-dark/30 uppercase tracking-[0.2em]">
                {user ? 'Mustard Deli Verified Account' : 'Artisanal Authentication System'}
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
