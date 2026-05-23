import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, ArrowRight, Share2, Sparkles, Heart, HelpCircle, Store, Award } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { STOCKISTS, Stockist } from '../constants';
import { useAuth } from '../contexts/AuthContext';

interface StockistVote {
  id: string;
  stockistId: string;
  userId: string;
  userName: string;
  month: string;
  createdAt: any;
}

interface LeaderboardItem {
  stockist: Stockist;
  votes: number;
}

interface StockistLeaderboardProps {
  onOpenAuth: () => void;
  highlightedId?: string | null;
  onSelectStockist?: (id: string) => void;
}

export default function StockistLeaderboard({ onOpenAuth, onSelectStockist }: StockistLeaderboardProps) {
  const { user, profile } = useAuth();
  const [votes, setVotes] = useState<StockistVote[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  // Dynamic current month format (e.g., "May 2026")
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  // Sync current month votes in real-time
  useEffect(() => {
    const q = query(
      collection(db, 'stockistVotes'),
      where('month', '==', currentMonth)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as StockistVote[];
      setVotes(list);
    }, (error) => {
      console.warn('Leaderboard votes loaded in offline mode or waiting initialization:', error);
    });

    return () => unsubscribe();
  }, [currentMonth]);

  // Transform raw votes into ranked stockists
  const leaderboard: LeaderboardItem[] = React.useMemo(() => {
    const counts: Record<string, number> = {};
    votes.forEach(v => {
      counts[v.stockistId] = (counts[v.stockistId] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([stockistId, votesCount]) => {
        const stockist = STOCKISTS.find(s => s.id === stockistId);
        return {
          stockist: stockist!,
          votes: votesCount
        };
      })
      .filter(item => item.stockist !== undefined) // filter out anomalies
      .sort((a, b) => b.votes - a.votes);
  }, [votes]);

  // Check if current user has voted for any stockist
  const userVotedIds = React.useMemo(() => {
    if (!user) return new Set<string>();
    return new Set(
      votes.filter(v => v.userId === user.uid).map(v => v.stockistId)
    );
  }, [votes, user]);

  // Share link generator helper
  const handleCopyLink = (stockistId: string) => {
    const rawUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${rawUrl}?vote=${stockistId}#locations`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedId(stockistId);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // Toggle user vote
  const handleToggleVote = async (stockist: Stockist) => {
    if (!user) {
      onOpenAuth();
      return;
    }

    const voteDocId = `${stockist.id}_${user.uid}`;
    const voteRef = doc(db, 'stockistVotes', voteDocId);
    const hasVoted = userVotedIds.has(stockist.id);

    try {
      if (hasVoted) {
        // Remove vote
        await deleteDoc(voteRef);
      } else {
        // Cast vote
        const newVote: Omit<StockistVote, 'id'> = {
          stockistId: stockist.id,
          userId: user.uid,
          userName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Deli Supporter',
          month: currentMonth,
          createdAt: serverTimestamp()
        };
        await setDoc(voteRef, newVote);

        // Also push a live community activity block to the server ticker!
        const activityRef = collection(db, 'activity');
        await addDoc(activityRef, {
          type: 'vote_cast',
          userId: user.uid,
          userName: newVote.userName,
          message: `placed their monthly vote of appreciation for ${stockist.name} in ${stockist.city}!`,
          createdAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `stockistVotes/${voteDocId}`);
    }
  };

  // Render top 3 podium if we have at least 1 dynamic vote
  const hasVotes = leaderboard.length > 0;
  const top1Input = leaderboard[0];
  const top2Input = leaderboard[1];
  const top3Input = leaderboard[2];

  return (
    <div className="bg-white border border-brand-border p-6 md:p-8 shadow-sm mb-8 relative overflow-hidden">
      {/* Decorative Brand Accent Lines */}
      <div className="absolute top-0 left-0 w-2 h-full bg-brand-accent" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-brand-border/60 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[9px] font-mono font-black tracking-widest text-[#A3A31F] bg-[#A3A31F]/10 px-2.5 py-1">
              🏆 SPECIAL RETAIL CONTEST
            </span>
            <button 
              onClick={() => setShowInfo(!showInfo)} 
              className="text-brand-dark/40 hover:text-brand-accent transition-colors"
              title="How does it work?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-2xl font-black uppercase text-brand-dark tracking-tight">
            Stockist of the Month — <span className="text-brand-accent">{currentMonth}</span>
          </h3>
          <p className="text-xs text-[#5B5550] mt-1.5 leading-relaxed max-w-2xl">
            Who is South Africa's favorite boutique deli or retail partner? Support local-curated counters! The stockist with the most community support gets double featured across social channels.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="bg-brand-secondary/80 border border-brand-border/60 px-4 py-3 text-center min-w-[100px]">
            <p className="text-[8px] font-mono uppercase text-[#5B5550]">Total Votes</p>
            <p className="text-xl font-black text-brand-dark">{votes.length}</p>
          </div>
          <div className="bg-brand-secondary/80 border border-brand-border/60 px-4 py-3 text-center min-w-[100px]">
            <p className="text-[8px] font-mono uppercase text-[#5B5550]">Participants</p>
            <p className="text-xl font-black text-brand-dark">{leaderboard.length}</p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showInfo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6 bg-brand-secondary/50 border border-brand-border/80 p-5 text-xs text-brand-dark/80 leading-relaxed"
          >
            <h4 className="font-black uppercase tracking-wider text-brand-dark mb-2">Competition Guidelines:</h4>
            <ul className="list-disc pl-5 space-y-1">
              <li>Members can like/unlike multiple stockists to express regional support.</li>
              <li>Every vote directly pushes live notifications and real-time community action tickers!</li>
              <li><strong>Encourage your local store:</strong> If you are a stockist, click <strong className="font-bold text-brand-accent">"🔗 Copy Voter Link"</strong> below to generate a direct-voting shortcut! Share it on your Facebook, Instagram, or email newsletter so customers can find you and support you in one-click.</li>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Podium Visualization */}
      {hasVotes ? (
        <div className="grid md:grid-cols-12 gap-8 items-center mb-8 bg-brand-secondary/20 border border-brand-border/40 p-6">
          {/* Podium Column - 5 cols */}
          <div className="md:col-span-5 flex flex-col items-center justify-end h-[240px] pt-8 border-b md:border-b-0 md:border-r border-brand-border/60 pr-0 md:pr-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#5B5550] mb-6">Current Standing Podium</span>
            <div className="flex items-end justify-center w-full gap-2">
              {/* 2nd Place */}
              {top2Input ? (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-center mb-1 max-w-[80px] truncate">
                    <p className="text-[9px] font-black uppercase text-brand-dark tracking-tight truncate leading-none">{top2Input.stockist.name}</p>
                    <p className="text-[8px] text-brand-dark/60 truncate">{top2Input.votes} votes</p>
                  </div>
                  <div className="w-14 bg-gray-300 border-t-2 border-l-2 border-r-2 border-gray-400/55 h-16 flex items-center justify-center font-black text-white text-lg shadow-sm">
                    2
                  </div>
                </div>
              ) : (
                <div className="w-14" />
              )}

              {/* 1st Place */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="text-center mb-2 max-w-[100px]">
                  <Trophy className="w-5 h-5 text-yellow-500 fill-yellow-500 mx-auto animate-bounce mb-1" />
                  <p className="text-[10px] font-black uppercase text-brand-dark tracking-tight truncate leading-none">{top1Input.stockist.name}</p>
                  <p className="text-[9px] font-bold text-brand-accent uppercase mt-0.5">{top1Input.votes} votes</p>
                </div>
                <div className="w-16 bg-yellow-400 border-t-4 border-l-2 border-r-2 border-yellow-500/55 h-24 flex items-center justify-center font-black text-yellow-900 text-2xl shadow-md relative">
                  1
                  {/* Glowing star */}
                  <div className="absolute -top-3 -right-3">
                    <Sparkles className="w-4 h-4 text-brand-accent animate-pulse" />
                  </div>
                </div>
              </div>

              {/* 3rd Place */}
              {top3Input ? (
                <div className="flex flex-col items-center flex-1">
                  <div className="text-center mb-1 max-w-[80px] truncate">
                    <p className="text-[9px] font-black uppercase text-brand-dark tracking-tight truncate leading-none">{top3Input.stockist.name}</p>
                    <p className="text-[8px] text-brand-dark/60 truncate">{top3Input.votes} votes</p>
                  </div>
                  <div className="w-14 bg-amber-600 border-t-2 border-l-2 border-r-2 border-amber-700/55 h-12 flex items-center justify-center font-black text-white text-base shadow-sm">
                    3
                  </div>
                </div>
              ) : (
                <div className="w-14" />
              )}
            </div>
          </div>

          {/* Leaders List - 7 cols */}
          <div className="md:col-span-7 flex flex-col justify-center">
            <h4 className="text-xs font-black uppercase text-brand-dark tracking-widest mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-brand-accent" />
              Real-time Standings Leaders
            </h4>
            <div className="space-y-2">
              {leaderboard.slice(0, 5).map((item, id) => {
                const isUserLiked = userVotedIds.has(item.stockist.id);
                return (
                  <div 
                    key={item.stockist.id}
                    className="flex items-center justify-between p-3 bg-white border border-brand-border hover:border-brand-accent transition-colors shadow-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-mono text-brand-dark/40 font-black w-4 text-center">
                        #{id + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase text-brand-dark truncate">
                          {item.stockist.name}
                        </p>
                        <p className="text-[9px] text-brand-dark/50 uppercase font-bold tracking-wider">
                          {item.stockist.city} • {item.stockist.province}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Vote tally badge */}
                      <span className="text-[10px] font-mono text-[#5B5550] font-black bg-brand-secondary/60 px-2 py-1">
                        {item.votes} likes
                      </span>

                      {/* Vote Action Toggle */}
                      <button
                        onClick={() => handleToggleVote(item.stockist)}
                        className={`p-2 transition-all flex items-center justify-center rounded-none border ${
                          isUserLiked 
                            ? 'bg-red-50 border-red-200 text-red-500 fill-red-500' 
                            : 'bg-white border-brand-border hover:bg-brand-secondary text-brand-dark/40 hover:text-red-500'
                        }`}
                        title={isUserLiked ? "Liked" : "Like stockist"}
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </button>

                      {/* Promo Sharer */}
                      <button
                        onClick={() => handleCopyLink(item.stockist.id)}
                        className={`text-[8px] font-black p-2 uppercase border tracking-wider transition-colors ${
                          copiedId === item.stockist.id 
                            ? 'bg-green-500 text-white border-green-600' 
                            : 'bg-white text-brand-dark/60 border-brand-border hover:bg-brand-secondary'
                        }`}
                      >
                        {copiedId === item.stockist.id ? 'Copied' : '🔗 Link'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Empty/Opening State */
        <div className="bg-brand-secondary/40 border border-brand-border/60 p-8 text-center mb-8">
          <Store className="w-8 h-8 text-brand-dark/20 mx-auto mb-3" />
          <h4 className="text-sm font-black text-brand-dark uppercase tracking-wide">Competition Open for May 2026</h4>
          <p className="text-xs text-brand-dark/60 mt-2 max-w-md mx-auto leading-relaxed">
            No votes have been recorded yet for the current month. Let's start the fire! Support your neighborhood merchant by clicking the ❤️ like icon on any stockist card below to place them proudly on the podium podium.
          </p>
        </div>
      )}
    </div>
  );
}
