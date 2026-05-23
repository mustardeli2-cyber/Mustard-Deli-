import React, { useState, useEffect } from 'react';
import { 
  Gift, 
  MapPin, 
  User, 
  Share2, 
  Check, 
  Calendar, 
  Trophy, 
  Send, 
  ExternalLink, 
  X, 
  ChevronDown, 
  Sparkles, 
  Lock, 
  AlertCircle,
  ThumbsUp,
  RefreshCw,
  Clock,
  Instagram,
  Facebook
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  addDoc, 
  updateDoc, 
  doc, 
  deleteDoc,
  serverTimestamp,
  arrayUnion,
  getDoc
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { STOCKISTS } from '../constants';

interface Giveaway {
  id: string;
  stockistName: string;
  contactEmail: string;
  cityName: string;
  suburb: string;
  title: string;
  description: string;
  prizes: string;
  socialMediaHandle?: string;
  socialPlatform?: 'Facebook' | 'X / Twitter' | 'Instagram' | 'Multiple';
  promoLink?: string;
  status: 'pending' | 'approved' | 'ended';
  createdAt: any;
  endDate: string;
  entrants: string[];
  entrantNames: string[];
  winnerId?: string;
  winnerName?: string;
  winnerDrawnAt?: any;
}

interface GiveawaysPortalProps {
  onOpenAuth: () => void;
}

export default function GiveawaysPortal({ onOpenAuth }: GiveawaysPortalProps) {
  const { user, profile, isAdmin } = useAuth();
  const { earnPoints } = useNotifications();
  
  // Tabs and general states
  const [activeTab, setActiveTab] = useState<'browse' | 'propose'>('browse');
  const [giveaways, setGiveaways] = useState<Giveaway[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Filtering & Search
  const [selectedCity, setSelectedCity] = useState<string>('All');
  
  // Form states for collaborative giveaway request
  const [formData, setFormData] = useState({
    stockistName: '',
    contactEmail: '',
    cityName: '',
    suburb: '',
    title: '',
    description: '',
    prizes: '',
    socialMediaHandle: '',
    socialPlatform: 'Multiple',
    promoLink: '',
    endDate: ''
  });

  // Admin and Draw States
  const [drawingId, setDrawingId] = useState<string | null>(null);

  // Load distinct cities from constants for filtering & options
  const existingCities = Array.from(new Set(STOCKISTS.map(s => s.city))).sort();

  const fetchGiveaways = async () => {
    setLoading(true);
    setError(null);
    try {
      const q = query(collection(db, 'giveaways'));
      const querySnapshot = await getDocs(q);
      const list: Giveaway[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Giveaway);
      });
      setGiveaways(list);
    } catch (err: any) {
      console.error(err);
      if (err.message.includes('{')) {
        try {
          const info = JSON.parse(err.message);
          setError(`Permissions error: ${info.operationType}`);
        } catch {
          setError('Failed to fetch giveaway information.');
        }
      } else {
        setError('Unable to load giveaways. Please sign in or try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
  }, [user]);

  // Handle form submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.stockistName || !formData.contactEmail || !formData.cityName || !formData.title || !formData.prizes) {
      alert('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    try {
      const newGiveaway = {
        stockistName: formData.stockistName,
        contactEmail: formData.contactEmail,
        cityName: formData.cityName,
        suburb: formData.suburb,
        title: formData.title,
        description: formData.description,
        prizes: formData.prizes,
        socialMediaHandle: formData.socialMediaHandle || null,
        socialPlatform: formData.socialPlatform,
        promoLink: formData.promoLink || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        endDate: formData.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        entrants: [],
        entrantNames: []
      };

      await addDoc(collection(db, 'giveaways'), newGiveaway);
      
      // Award loyalty points for contributing a stockist collaborative giveaway concept
      try {
        await earnPoints(25, 'Collaborative Partnership Pitch');
      } catch (ptsErr) {
        console.warn('Failed to assign loyalty points:', ptsErr);
      }
      
      setSuccessMsg('Your collaborative giveaway request has been submitted successfully! Our artisans will review it and coordinate the launch.');
      setFormData({
        stockistName: '',
        contactEmail: '',
        cityName: '',
        suburb: '',
        title: '',
        description: '',
        prizes: '',
        socialMediaHandle: '',
        socialPlatform: 'Multiple',
        promoLink: '',
        endDate: ''
      });
      // Switch back or refresh
      fetchGiveaways();
    } catch (err) {
      console.error(err);
      alert('Filing your proposal failed. Ensure you are signed in.');
    } finally {
      setSubmitting(false);
    }
  };

  // Join a giveaway
  const handleJoinGiveaway = async (giveawayId: string) => {
    if (!user) {
      onOpenAuth();
      return;
    }
    try {
      const giveawayDocRef = doc(db, 'giveaways', giveawayId);
      const docSnap = await getDoc(giveawayDocRef);
      if (!docSnap.exists()) return;
      
      const giveawayData = docSnap.data() as Giveaway;
      if (giveawayData.entrants?.includes(user.uid)) {
        alert('You have already entered this collaborative giveaway!');
        return;
      }

      const userName = profile?.displayName || user.displayName || 'App Member';
      const updatedEntrants = [...(giveawayData.entrants || []), user.uid];
      const updatedEntrantNames = [...(giveawayData.entrantNames || []), userName];

      await updateDoc(giveawayDocRef, {
        entrants: updatedEntrants,
        entrantNames: updatedEntrantNames
      });

      // Award loyalty points for engaging in local campaigns
      try {
        await earnPoints(5, 'Collaborative Campaign Entry');
      } catch (ptsErr) {
        console.warn('Failed to assign loyalty points:', ptsErr);
      }

      // Update local state instantly
      setGiveaways(prev => prev.map(g => g.id === giveawayId ? {
        ...g,
        entrants: updatedEntrants,
        entrantNames: updatedEntrantNames
      } : g));

      alert('Wonderful! You have joined this collaborative campaign & earned 5 Seeds! Keep an eye on the results!');
    } catch (err) {
      console.error('Failed to join giveaway:', err);
      alert('Error entering giveaway. Please try again.');
    }
  };

  // Admin: Approve request
  const handleApprove = async (id: string) => {
    try {
      await updateDoc(doc(db, 'giveaways', id), {
        status: 'approved'
      });
      setGiveaways(prev => prev.map(g => g.id === id ? { ...g, status: 'approved' } : g));
      alert('Giveaway request approved and released to area members!');
    } catch (err) {
      alert('Failed to approve request.');
    }
  };

  // Admin: Reject/Delete request
  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to remove this giveaway?')) return;
    try {
      await deleteDoc(doc(db, 'giveaways', id));
      setGiveaways(prev => prev.filter(g => g.id !== id));
      alert('Giveaway removed.');
    } catch (err) {
      alert('Failed to delete.');
    }
  };

  // Admin: Draw Random Winner
  const handleDrawWinner = async (giveawayId: string) => {
    const giveaway = giveaways.find(g => g.id === giveawayId);
    if (!giveaway) return;
    if (!giveaway.entrants || giveaway.entrants.length === 0) {
      alert('No entrants have joined this giveaway yet. Cannot draw.');
      return;
    }

    setDrawingId(giveawayId);

    // Simulate luxury shuffling delay for visual flair of drawing a winner
    setTimeout(async () => {
      try {
        const randomIndex = Math.floor(Math.random() * giveaway.entrants.length);
        const winnerUid = giveaway.entrants[randomIndex];
        const winnerName = giveaway.entrantNames[randomIndex] || 'Unassigned Deli Member';

        await updateDoc(doc(db, 'giveaways', giveawayId), {
          status: 'ended',
          winnerId: winnerUid,
          winnerName: winnerName,
          winnerDrawnAt: serverTimestamp()
        });

        setGiveaways(prev => prev.map(g => g.id === giveawayId ? {
          ...g,
          status: 'ended',
          winnerId: winnerUid,
          winnerName: winnerName
        } : g));

        alert(`Trophy drawn! The lucky random winner is: ${winnerName}! Updated successfully.`);
      } catch (err) {
        alert('Failed to draw winner.');
      } finally {
        setDrawingId(null);
      }
    }, 3000);
  };

  // Filter list
  const filteredList = giveaways.filter(g => {
    if (g.status === 'pending' && !isAdmin) return false;
    if (selectedCity !== 'All' && g.cityName !== selectedCity) return false;
    return true;
  });

  const activeGiveaways = filteredList.filter(g => g.status === 'approved');
  const pastGiveaways = filteredList.filter(g => g.status === 'ended');
  const pendingRequests = filteredList.filter(g => g.status === 'pending');

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 min-h-screen">
      
      {/* Editorial Header */}
      <div className="text-center mb-16 max-w-2xl mx-auto">
        <span className="text-xs font-mono tracking-[0.3em] text-brand-accent uppercase block mb-3">EXCLUSIVE COLLABORATION</span>
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-brand-dark leading-tight">
          STOCKIST GIVEAWAYS
        </h1>
        <p className="text-[#5B5550] mt-4 leading-relaxed font-normal">
          Area-specific, hyper-local collaborative campaigns hosted by our official retail stockists. Enter exclusive draws or pitch a partnership to invite more members in your community!
        </p>

        {/* Tab Controls */}
        <div className="flex justify-center mt-10 gap-x-2 border-b border-brand-border pb-1">
          <button
            onClick={() => { setActiveTab('browse'); setSuccessMsg(null); }}
            className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
              activeTab === 'browse' ? 'text-brand-dark font-black' : 'text-brand-dark/40 hover:text-brand-dark'
            }`}
          >
            Active & Past Campaigns
            {activeTab === 'browse' && (
              <motion.div layoutId="giveaway-active-tab" className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-brand-dark" />
            )}
          </button>
          <button
            onClick={() => { setActiveTab('propose'); setSuccessMsg(null); }}
            className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${
              activeTab === 'propose' ? 'text-brand-dark font-black' : 'text-brand-dark/40 hover:text-brand-dark'
            }`}
          >
            Stockist Request Form
            {activeTab === 'propose' && (
              <motion.div layoutId="giveaway-active-tab" className="absolute bottom-[-2px] left-0 right-0 h-[3px] bg-brand-dark" />
            )}
          </button>
        </div>
      </div>

      {activeTab === 'browse' ? (
        <div>
          {/* Filters shelf */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 bg-brand-secondary/30 border border-brand-border p-5 rounded-none">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-brand-accent" />
              <span className="text-xs font-black uppercase tracking-widest text-[#5B5550]">Filter by Specific Area:</span>
            </div>
            <div className="relative">
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="appearance-none bg-white border border-brand-border px-8 py-3 text-xs font-bold uppercase tracking-widest outline-none pr-12 focus:border-brand-dark"
              >
                <option value="All">All Regions / Cities</option>
                {existingCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-dark opacity-40" />
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex justify-center items-center">
              <RefreshCw className="w-8 h-8 animate-spin text-brand-accent" />
            </div>
          ) : error ? (
            <div className="p-8 border border-brand-accent/20 bg-brand-secondary/10 text-center mb-10">
              <AlertCircle className="w-8 h-8 text-brand-accent mx-auto mb-3" />
              <p className="text-sm font-bold uppercase tracking-widest text-brand-dark mb-4">{error}</p>
              <button onClick={() => { onOpenAuth(); setError(null); }} className="px-6 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors">
                Sign In / Register
              </button>
            </div>
          ) : (
            <div>
              {/* Admin Queue Section */}
              {isAdmin && pendingRequests.length > 0 && (
                <div className="mb-14 border-2 border-dashed border-brand-accent/30 p-6 md:p-8 bg-brand-secondary/10">
                  <div className="flex items-center gap-3 mb-6">
                    <Sparkles className="w-5 h-5 text-brand-accent" />
                    <h2 className="text-lg font-black uppercase tracking-wider text-brand-dark">Command Queue: Pending Giveaway Requests ({pendingRequests.length})</h2>
                  </div>
                  <div className="grid grid-cols-1 gap-6">
                    {pendingRequests.map(g => (
                      <div key={g.id} className="bg-white border border-brand-border p-6 shadow-sm">
                        <div className="md:flex md:justify-between items-start gap-4 mb-4">
                          <div>
                            <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2.5 py-1 uppercase tracking-widest font-black inline-block mb-2">Request by {g.stockistName}</span>
                            <h3 className="text-xl font-black uppercase tracking-tight">{g.title}</h3>
                            <p className="text-xs text-[#5B5550] mt-1">Area: {g.cityName} • Contact: {g.contactEmail}</p>
                          </div>
                          <div className="flex gap-2 mt-4 md:mt-0">
                            <button
                              onClick={() => handleApprove(g.id)}
                              className="px-4 py-2.5 bg-brand-dark text-white text-[9px] font-black uppercase tracking-wider hover:bg-brand-accent transition-colors"
                            >
                              Approve & Release
                            </button>
                            <button
                              onClick={() => handleDelete(g.id)}
                              className="px-4 py-2.5 border border-red-200 text-red-600 text-[9px] font-black uppercase tracking-wider hover:bg-red-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                        <div className="text-sm text-[#5B5550] space-y-2 border-t border-brand-border/60 pt-4">
                          <p><strong>Proposed Prizes:</strong> {g.prizes}</p>
                          <p><strong>Description:</strong> {g.description}</p>
                          {g.socialMediaHandle && (
                            <p className="text-xs"><strong>Stockist Social Profile:</strong> {g.socialMediaHandle} ({g.socialPlatform})</p>
                          )}
                          {g.promoLink && (
                            <p className="text-xs"><strong>Launch Link:</strong> <a href={g.promoLink} target="_blank" rel="noopener noreferrer" className="text-brand-accent hover:underline flex items-center inline-flex gap-1">{g.promoLink} <ExternalLink className="w-3 h-3" /></a></p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Campaigns */}
              <div className="mb-16">
                <div className="flex items-center gap-3 mb-6 border-b border-brand-border pb-3">
                  <Gift className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-lg font-black uppercase tracking-widest">Active Draws In Selected Areas ({activeGiveaways.length})</h2>
                </div>

                {activeGiveaways.length === 0 ? (
                  <div className="text-center py-16 border border-brand-border bg-white text-sm uppercase tracking-widest text-[#5B5550]">
                    No active collaborative giveaways found for "{selectedCity}". Check back soon!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {activeGiveaways.map(g => {
                      const hasJoined = user && g.entrants?.includes(user.uid);
                      return (
                        <motion.div 
                          key={g.id} 
                          initial={{ opacity: 0, y: 15 }} 
                          animate={{ opacity: 1, y: 0 }}
                          className="border border-brand-border bg-white p-6 md:p-8 relative flex flex-col justify-between hover:shadow-lg transition-shadow"
                        >
                          <div>
                            {/* Area Tag */}
                            <div className="flex items-center justify-between mb-4">
                              <span className="flex items-center gap-1.5 text-[10px] font-mono tracking-widest uppercase text-brand-accent">
                                <MapPin className="w-3.5 h-3.5" />
                                {g.cityName} {g.suburb && `(${g.suburb})`}
                              </span>
                              <span className="text-[10px] text-[#5B5550] font-mono font-medium flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                Ends: {g.endDate}
                              </span>
                            </div>

                            {/* Headline */}
                            <h3 className="text-2xl font-black uppercase tracking-tight text-brand-dark mb-4">{g.title}</h3>
                            <p className="text-[#5B5550] text-sm leading-relaxed mb-6">{g.description}</p>

                            {/* Prizes Highlight */}
                            <div className="bg-brand-secondary/20 border border-brand-border/60 p-4 mb-6">
                              <span className="text-[9px] font-mono tracking-widest text-brand-accent uppercase block mb-1">PROPOSED COLLABORATION PRIZES</span>
                              <p className="text-xs font-black uppercase text-brand-dark tracking-tight">{g.prizes}</p>
                            </div>

                            {/* Stockist Promo link validation */}
                            {g.promoLink && (
                              <div className="mb-6 flex items-center gap-2">
                                <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B5550]">Shared On:</span>
                                <a 
                                  href={g.promoLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] font-black uppercase text-brand-accent hover:underline flex items-center gap-1"
                                >
                                  Stockist's {g.socialPlatform || 'External'} Post <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            )}

                            {/* Entrants Pulse counter */}
                            <div className="flex items-center gap-2 mb-8 text-xs font-bold uppercase text-brand-dark/70">
                              <User className="w-4 h-4 text-brand-accent" />
                              <span>{g.entrants?.length || 0} Registered App Members Entered</span>
                            </div>
                          </div>

                          {/* Member Entry Action shelf */}
                          <div className="border-t border-brand-border/60 pt-6">
                            {hasJoined ? (
                              <div className="w-full flex items-center justify-center gap-2 bg-[#2E7D32]/10 border border-[#2E7D32]/30 py-4 text-[#2E7D32] text-[10px] font-black uppercase tracking-[0.2em]">
                                <Check className="w-4 h-4" />
                                You are entered! Share link on social channels
                              </div>
                            ) : (
                              <button
                                onClick={() => handleJoinGiveaway(g.id)}
                                className="w-full py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
                              >
                                <Gift className="w-4 h-4" />
                                Enter collaborative giveaway
                              </button>
                            )}

                            {/* Admin drawing block */}
                            {isAdmin && (
                              <div className="mt-4 pt-4 border-t border-dashed border-brand-border flex items-center justify-between">
                                <span className="text-[9px] font-mono uppercase text-[#5B5550]">Admin Command Control</span>
                                <button
                                  onClick={() => handleDrawWinner(g.id)}
                                  disabled={drawingId === g.id}
                                  className="px-4 py-2.5 bg-brand-accent text-brand-dark text-[9px] font-black uppercase tracking-wider flex items-center gap-2"
                                >
                                  {drawingId === g.id ? (
                                    <>
                                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                      Drawing random winner...
                                    </>
                                  ) : (
                                    <>
                                      <Trophy className="w-3.5 h-3.5" />
                                      Draw random winner
                                    </>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Past Campaigns */}
              <div>
                <div className="flex items-center gap-3 mb-6 border-b border-brand-border pb-3">
                  <Trophy className="w-5 h-5 text-brand-accent" />
                  <h2 className="text-lg font-black uppercase tracking-widest">Completed Collaborations & Winners ({pastGiveaways.length})</h2>
                </div>

                {pastGiveaways.length === 0 ? (
                  <div className="text-center py-12 border border-brand-border bg-white text-xs uppercase tracking-widest text-[#5B5550]/60">
                    No completed collaborative giveaways listed for "{selectedCity}".
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {pastGiveaways.map(g => (
                      <div key={g.id} className="border border-brand-border bg-brand-secondary/10 p-6 relative flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-center mb-3">
                            <span className="text-[9px] font-mono text-brand-accent uppercase tracking-widest">{g.cityName}</span>
                            <span className="text-[9px] bg-brand-dark/10 text-brand-dark px-2 py-0.5 font-bold uppercase tracking-wider rounded-none">Ended</span>
                          </div>
                          
                          <h4 className="text-lg font-black uppercase tracking-tight mb-2 text-brand-dark">{g.title}</h4>
                          <p className="text-xs text-[#5B5550] mb-4">Hosted alongside: <strong>{g.stockistName}</strong></p>
                        </div>

                        {/* Winner Announcement */}
                        <div className="border-t border-brand-border/60 pt-4 flex items-start gap-3 bg-white p-3 border border-brand-border">
                          <Trophy className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
                          <div>
                            <span className="text-[8px] font-mono tracking-widest uppercase text-[#5B5550] block">WINNING MEMBER DRAWN</span>
                            <p className="text-xs font-black uppercase text-brand-dark tracking-tight">{g.winnerName || 'Unassigned Deli Member'}</p>
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
      ) : (
        /* Pitch / Proposal Form for Retail Partners and Stockists */
        <div className="max-w-2xl mx-auto">
          {successMsg ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-brand-secondary/20 border border-brand-border p-8 text-center"
            >
              <Sparkles className="w-12 h-12 text-brand-accent mx-auto mb-4" />
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-dark mb-4">Proposal Filed Successfully</h2>
              <p className="text-sm text-[#5B5550] leading-relaxed mb-8">
                {successMsg}
              </p>
              
              <div className="bg-white border border-brand-border p-5 text-left mb-8">
                <h4 className="text-xs font-mono font-black uppercase tracking-widest text-brand-dark mb-2">PITCH PRO-TIPS FOR GREATER PARTICIPATION:</h4>
                <ul className="text-xs text-[#5B5550] space-y-2 list-disc pl-4 leading-relaxed">
                  <li><strong>Encourage New Readers:</strong> Post the cooperative giveaway link on FB, X/Twitter or Instagram tagging @MustardDeli.</li>
                  <li><strong>Direct Downloads:</strong> Instruct audiences they must register on the app to entered into the draw.</li>
                  <li><strong>Area Restriction:</strong> Our team will configure coordinates and target users in your localized region.</li>
                </ul>
              </div>

              <button 
                onClick={() => { setActiveTab('browse'); setSuccessMsg(null); }}
                className="px-8 py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors"
              >
                Return to Campaign Directory
              </button>
            </motion.div>
          ) : (
            <div>
              <div className="bg-brand-secondary/10 border border-brand-border p-6 md:p-8 mb-8 text-left">
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-dark mb-4">PITCH A PARTNER COLLABORATIVE GIVEAWAY</h3>
                <p className="text-xs text-[#5B5550] leading-relaxed mb-4">
                  Are you an official partner store listing Mustard Deli? Submit your proposed giveaway layout. Once approved:
                </p>
                <div className="space-y-2.5 text-xs text-[#5B5550]">
                  <p className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>The draw becomes visible on our <strong>Giveaway Hub</strong> specifically for verified app members in your city/area.</span>
                  </p>
                  <p className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>You promote the link on Facebook/X, encouraging people to register inside the app to enter.</span>
                  </p>
                  <p className="flex gap-2 items-start">
                    <Check className="w-4 h-4 text-brand-accent shrink-0 mt-0.5" />
                    <span>We randomly pull a winner from your filtered list once the submission closes!</span>
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmitRequest} className="space-y-8 bg-white border border-brand-border p-6 md:p-10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5550] block border-b border-brand-border pb-3 uppercase">Stockist & Launch Details</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Official Stockist Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Infood Deli"
                      value={formData.stockistName}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockistName: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Contact Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. partner@infooddeli.co.za"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-mono outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Select City / Region *</label>
                    <div className="relative">
                      <select
                        required
                        value={formData.cityName}
                        onChange={(e) => setFormData(prev => ({ ...prev, cityName: e.target.value }))}
                        className="appearance-none w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none pr-12 focus:border-brand-dark"
                      >
                        <option value="">Select Region</option>
                        {existingCities.map(city => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-dark opacity-40" />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Suburb / Specific Neighborhood</label>
                    <input
                      type="text"
                      placeholder="e.g. Jeffreys Bay"
                      value={formData.suburb}
                      onChange={(e) => setFormData(prev => ({ ...prev, suburb: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-dark transition-all"
                    />
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5550]/60 block border-b border-brand-border pb-3 pt-4 uppercase">Giveaway Proposed Concept</span>

                <div className="space-y-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Giveaway Title Headline *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Artisanal Delicacy Tasting Giveaway"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Collaboration Description & Pitch Details</label>
                    <textarea
                      rows={4}
                      placeholder="Detail how you will collaborate, duration of giveaway, etc."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-medium outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Prizes Involved *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 1 x Mustard Deli Tasting Set & 1 x Gourmet Grazing Platter (Total value R950)"
                      value={formData.prizes}
                      onChange={(e) => setFormData(prev => ({ ...prev, prizes: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-dark transition-all"
                    />
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5550]/60 block border-b border-brand-border pb-3 pt-4 uppercase">Social Media Marketing Plan</span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Primary Share Social Handle</label>
                    <input
                      type="text"
                      placeholder="e.g. @infood_deli"
                      value={formData.socialMediaHandle}
                      onChange={(e) => setFormData(prev => ({ ...prev, socialMediaHandle: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-mono outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Primary Social Platform</label>
                    <div className="relative">
                      <select
                        value={formData.socialPlatform}
                        onChange={(e: any) => setFormData(prev => ({ ...prev, socialPlatform: e.target.value }))}
                        className="appearance-none w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none pr-12 focus:border-brand-dark"
                      >
                        <option value="Instagram">Instagram</option>
                        <option value="Facebook">Facebook</option>
                        <option value="X / Twitter">X / Twitter</option>
                        <option value="Multiple">Multiple Platforms</option>
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-dark opacity-40" />
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Link to Social Campaign Announcement Post (Optional)</label>
                    <input
                      type="url"
                      placeholder="e.g. https://www.instagram.com/p/C..."
                      value={formData.promoLink}
                      onChange={(e) => setFormData(prev => ({ ...prev, promoLink: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-mono outline-none focus:border-brand-dark transition-all"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark m-1 block">Draw Date / End Campaign *</label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full bg-brand-bg border border-brand-border px-5 py-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-brand-dark transition-all"
                    />
                  </div>
                </div>

                <div className="flex gap-4 items-start bg-brand-secondary/20 p-5 border border-brand-border">
                  <input
                    type="checkbox"
                    required
                    id="agreement"
                    className="mt-1 w-4 h-4 border border-brand-border rounded-none focus:ring-0 checked:bg-brand-dark shrink-0"
                  />
                  <label htmlFor="agreement" className="text-xs text-[#5B5550] leading-relaxed select-none">
                    * I agree to share this exciting collaborative draw on our social media channel, specifically encouraging followers to register as verified members inside our Mustard Deli mobile/web application in order to enter.
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-5 bg-brand-dark text-white text-[11px] font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-colors flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      SUBMITTING COLLABORATION PITCH...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      SUBMIT JOINT GIVEAWAY REQUEST
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
