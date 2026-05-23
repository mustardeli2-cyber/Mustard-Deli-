import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Sparkles, 
  Plus, 
  Star, 
  Heart,
  HelpCircle, 
  Flame, 
  Calendar, 
  Check, 
  Loader2, 
  ArrowRight,
  Smile,
  Frown,
  Meh,
  Search,
  Book,
  Compass,
  Award
} from 'lucide-react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp,
  increment,
  updateDoc,
  doc
} from 'firebase/firestore';
import confetti from 'canvas-confetti';

interface DiaryEntry {
  id: string;
  userId: string;
  userName: string;
  recipeName: string;
  mustardUsed: string;
  usedWhatsForMeal: boolean;
  difficulty: 'Easy' | 'Moderate' | 'Hard';
  stars: number;
  surprisedBy: string;
  experience: string;
  cookedAt: string;
  createdAt: any;
  likes?: number;
  likedBy?: string[];
}

const MUSTARDS_LIST = [
  'Smoked Apricot Braaibroodjie Mustard',
  'Green Fig and Balsamic Mustard',
  'Honey and Whisky Mustard',
  'Sugar-Free Artisan Mustard',
  'Craft Beer Artisan Mustard',
  'Fiery Reaper Mustard',
  'Spicy Jalapeno Mustard',
  'Sugar free Spicy Jalapeno Mustard',
  'Classic Dijon Mustard',
  'Champagne Mustard',
  'Honey Mustard'
];

const PRELOADED_DIARY_ENTRIES: DiaryEntry[] = [
  {
    id: 'pre-1',
    userId: 'mock-1',
    userName: 'Kobus van der Merwe',
    recipeName: 'Slow-Smoked Karoo Pork Ribs with Apricot glaze',
    mustardUsed: 'Smoked Apricot Braaibroodjie Mustard',
    usedWhatsForMeal: true,
    difficulty: 'Hard',
    stars: 5,
    surprisedBy: 'The subtle wood-smoke flavor in the mustard married perfectly with local pork cuts!',
    experience: 'I ran the "What\'s For Meal" generator to force myself to cook something out of my comfort zone. It proposed smoked sweet apricot with grilled meats. Smoldered for 4 hours with peachwood, then brushed with a deep emulsion of the apricot mustard. Outstanding!',
    cookedAt: '2026-05-20',
    createdAt: null,
    likes: 12,
    likedBy: []
  },
  {
    id: 'pre-2',
    userId: 'mock-2',
    userName: 'Zola Mokoena',
    recipeName: 'Balsamic Sourdough Grilled Cheese with Camembert & Fig',
    mustardUsed: 'Green Fig and Balsamic Mustard',
    usedWhatsForMeal: false,
    difficulty: 'Easy',
    stars: 4,
    surprisedBy: 'How a tiny spoon of whole-grain green fig brings out the richness of ripe cheese.',
    experience: 'Decided to simplify my afternoon. Spread sourdough sliced bread with rich butter on the outside, and a lush, thick coating of Green Fig & Balsamic Mustard on the inside, stuffed with ripe brie and camembert. Gqeberha culinary gold!',
    cookedAt: '2026-05-18',
    createdAt: null,
    likes: 8,
    likedBy: []
  },
  {
    id: 'pre-3',
    userId: 'mock-3',
    userName: 'Catelyn Smith',
    recipeName: 'Whisky-Honey Mustard Glazed Karoo Salmon Trout',
    mustardUsed: 'Honey and Whisky Mustard',
    usedWhatsForMeal: true,
    difficulty: 'Moderate',
    stars: 5,
    surprisedBy: 'The sharp bite in the mustard completely elevated the buttery, rich oils of the trout!',
    experience: 'Never cooked fresh inland trout with sweet alcohol bases before. Triggered the Flavor Finder and received the Honey Whisky pairing recipe. Easy to pan-sear, finished with a generous layer of honey whisky mustard. Extremely delicious and refined.',
    cookedAt: '2026-05-15',
    createdAt: null,
    likes: 15,
    likedBy: []
  }
];

export default function FoodieDiary() {
  const { user } = useAuth();
  const { earnPoints } = useNotifications();
  
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [activeTab, setActiveTab] = useState<'feed' | 'log' | 'my-log'>('feed');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [recipeName, setRecipeName] = useState('');
  const [mustardUsed, setMustardUsed] = useState(MUSTARDS_LIST[0]);
  const [usedWhatsForMeal, setUsedWhatsForMeal] = useState(false);
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [stars, setStars] = useState(5);
  const [surprisedBy, setSurprisedBy] = useState('');
  const [experience, setExperience] = useState('');
  const [cookedAt, setCookedAt] = useState(new Date().toISOString().split('T')[0]);

  // Load entries from Firestore
  useEffect(() => {
    const q = query(
      collection(db, 'foodieDiary'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const liveData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DiaryEntry[];

      // Merge preloaded so the board always feels populated and inspiring
      setEntries([...liveData, ...PRELOADED_DIARY_ENTRIES]);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'foodieDiary');
      // Fallback to preloaded on error
      setEntries(PRELOADED_DIARY_ENTRIES);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName || !experience) return;

    if (!user) {
      alert('To lock in your Culinary Adventure Diary, please sync or sign up using your Digital Member account first! (Click the Profile icon in the top bar.)');
      return;
    }

    setIsSubmitting(true);
    try {
      const newDoc = {
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        recipeName,
        mustardUsed,
        usedWhatsForMeal,
        difficulty,
        stars,
        surprisedBy,
        experience,
        cookedAt,
        createdAt: serverTimestamp(),
        likes: 0,
        likedBy: []
      };

      const docRef = await addDoc(collection(db, 'foodieDiary'), newDoc);

      // Create a community pulse activity
      await addDoc(collection(db, 'activity'), {
        type: 'alchemy_transmuted',
        userId: user.uid,
        userName: user.displayName || 'Artisanal Member',
        message: `completed a culinary quest: "${recipeName}" with ${mustardUsed}!`,
        targetId: docRef.id,
        createdAt: serverTimestamp()
      });

      // Award high loyalty seeds for journaling
      try {
        await earnPoints(15, 'Adventurer Kitchen Journal entry');
      } catch (ptsErr) {
        console.warn('Failed to award loyalty points:', ptsErr);
      }

      // Celebrate success
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#A3A31F', '#F4F1EA', '#23231F']
      });

      // Reset form & redirect
      setRecipeName('');
      setSurprisedBy('');
      setExperience('');
      setStars(5);
      setDifficulty('Moderate');
      setUsedWhatsForMeal(false);
      
      setActiveTab('feed');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'foodieDiary');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (entryId: string) => {
    if (entryId.startsWith('pre-')) {
      // Offline local feedback for mock data
      setEntries(prev => prev.map(item => {
        if (item.id === entryId) {
          return { ...item, likes: (item.likes || 0) + 1 };
        }
        return item;
      }));
      return;
    }

    if (!user) {
      alert('Sign Up / Login to like community foodie diaries and support dynamic pairings!');
      return;
    }

    try {
      const itemRef = doc(db, 'foodieDiary', entryId);
      await updateDoc(itemRef, {
        likes: increment(1)
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `foodieDiary/${entryId}`);
    }
  };

  // Filtering
  const filteredEntries = entries.filter(item => {
    const queryLower = searchQuery.toLowerCase();
    return (
      item.recipeName.toLowerCase().includes(queryLower) ||
      item.experience.toLowerCase().includes(queryLower) ||
      item.mustardUsed.toLowerCase().includes(queryLower) ||
      item.userName.toLowerCase().includes(queryLower)
    );
  });

  const myEntries = entries.filter(item => item.userId === user?.uid);

  return (
    <section id="apothecary-diary" className="py-24 px-6 md:px-12 bg-brand-secondary/40 border-y border-brand-border scroll-mt-20">
      <div className="max-w-7xl mx-auto">
        
        {/* Header HUD layout */}
        <div className="grid lg:grid-cols-12 gap-12 items-center mb-16">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-amber-600">
                Culinary Exploration
              </span>
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-brand-dark uppercase leading-none">
              THE ADVENTUROUS FOODIE <br />
              <span className="text-amber-600 serif-italic normal-case font-normal">Kitchen Journal</span>
            </h2>
            <p className="text-[#5B5550] text-xs uppercase tracking-widest mt-4 max-w-2xl leading-relaxed">
              Every jar is built to break boundaries. Document your daring recipes, experimental combinations, 
              and bold discoveries using our products & digital tools. Tap into our creative community below!
            </p>
          </div>
          
          <div className="lg:col-span-4 bg-white p-6 border border-brand-border flex items-start gap-4">
            <Award className="w-8 h-8 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-dark mb-1">
                Adventure Incentives
              </h4>
              <p className="text-[11px] text-[#5B5550] leading-relaxed italic serif-italic">
                "Submit an adventurous diary entry incorporating our "What's For Meal" tool configurations to earn <strong className="text-amber-600">15 loyalty seeds</strong> directly into your profile balance."
              </p>
            </div>
          </div>
        </div>

        {/* Dashboard Tabs & Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-8 border-b border-brand-border pb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                activeTab === 'feed'
                  ? 'border-brand-dark bg-brand-dark text-white shadow-md'
                  : 'border-brand-border bg-white hover:border-brand-dark/40 text-brand-dark'
              }`}
            >
              <div className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>The Community Log</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab('log')}
              className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                activeTab === 'log'
                  ? 'border-brand-dark bg-brand-dark text-white shadow-md'
                  : 'border-brand-border bg-white hover:border-brand-dark/40 text-brand-dark'
              }`}
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5" />
                <span>Log a Culinary Adventure</span>
              </div>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('my-log')}
                className={`px-6 py-3 text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${
                  activeTab === 'my-log'
                    ? 'border-brand-dark bg-brand-dark text-white shadow-md'
                    : 'border-brand-border bg-white hover:border-brand-dark/40 text-brand-dark'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Book className="w-3.5 h-3.5" />
                  <span>My Kitchen Logbook ({myEntries.length})</span>
                </div>
              </button>
            )}
          </div>

          {/* Search bar inside diary */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              placeholder="Search dishes or ingredients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-brand-border bg-white text-xs text-brand-dark focus:outline-none focus:border-brand-dark uppercase tracking-wider font-semibold placeholder:text-brand-dark/30"
            />
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-brand-dark/30" />
          </div>
        </div>

        {/* Dynamic Inner Section */}
        <AnimatePresence mode="wait">
          
          {/* 1. COMMUNITY FEED TAB */}
          {activeTab === 'feed' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {filteredEntries.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-white border border-brand-border">
                  <Smile className="w-8 h-8 text-brand-dark/30 mx-auto mb-3" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark">No entries match your search</h4>
                  <p className="text-[11px] text-[#5B5550] italic serif-italic mt-1">Be the first to write a magnificent culinary log with this term!</p>
                </div>
              ) : (
                filteredEntries.map((entry, idx) => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-white border border-brand-border p-6 md:p-8 flex flex-col justify-between hover:shadow-xl transition-all duration-300"
                  >
                    <div>
                      {/* Header metadata */}
                      <div className="flex justify-between items-start gap-4 mb-4 border-b border-brand-border/40 pb-4">
                        <div>
                          <span className="text-[7px] font-black uppercase text-amber-600 tracking-widest bg-amber-50 px-2 py-0.5 inline-block mb-1">
                            {entry.difficulty} Quest
                          </span>
                          <h4 className="text-[11px] font-black uppercase tracking-tight text-brand-dark">
                            {entry.userName}
                          </h4>
                        </div>
                        <div className="flex items-center gap-1 bg-brand-secondary/30 px-2 py-1 text-[9px] font-black text-brand-dark">
                          <Calendar className="w-3 h-3 text-brand-dark/40" />
                          <span>{entry.cookedAt}</span>
                        </div>
                      </div>

                      {/* Main Title */}
                      <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-2">
                        {entry.recipeName}
                      </h3>

                      {/* Mustard Used tag */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-4">
                        <span className="text-[8px] font-black uppercase text-brand-dark/40 tracking-wider">
                          Mustard Base:
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-brand-dark bg-[#A3A31F]/10 px-2 py-0.5 border border-[#A3A31F]/20">
                          {entry.mustardUsed}
                        </span>
                      </div>

                      {/* Experience Text */}
                      <p className="text-[#5B5550] text-[11px] leading-relaxed italic serif-italic mb-6 line-clamp-4 hover:line-clamp-none transition-all duration-300 cursor-pointer">
                        "{entry.experience}"
                      </p>

                      {/* Surprised By Box */}
                      {entry.surprisedBy && (
                        <div className="p-3.5 bg-brand-secondary/30 border border-brand-border mb-6">
                          <span className="text-[7px] font-black uppercase tracking-widest text-[#5B5550] block mb-1">
                            ✨ THE SURPRISE FACTOR:
                          </span>
                          <p className="text-[10px] font-bold text-brand-dark/80 uppercase tracking-tight leading-normal">
                            {entry.surprisedBy}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom stats shelf */}
                    <div className="border-t border-brand-border/40 pt-4 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
                              i < entry.stars ? 'text-amber-500 fill-amber-500' : 'text-brand-dark/10'
                            }`} 
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-3">
                        {entry.usedWhatsForMeal && (
                          <span 
                            title="Selected using What's For Meal Generator"
                            className="text-[8px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 flex items-center gap-1 uppercase tracking-widest"
                          >
                            <Compass className="w-2.5 h-2.5 animate-spin-slow" />
                            <span>Tool Assisted</span>
                          </span>
                        )}

                        <button
                          onClick={() => handleLike(entry.id)}
                          className="flex items-center gap-1.5 text-brand-dark/40 hover:text-red-500 transition-colors"
                        >
                          <Heart className="w-3.5 h-3.5 hover:fill-red-500 transition-colors" />
                          <span className="text-[10px] font-black">{entry.likes || 0}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {/* 2. LOG ADVENTURE FORM TAB */}
          {activeTab === 'log' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto bg-white border border-brand-border p-8 md:p-12"
            >
              <div className="border-b border-brand-border pb-6 mb-8 text-center">
                <span className="text-[9px] font-black uppercase text-amber-600 tracking-widest block mb-1">
                  Journal Entry Form • Gqeberha Botanical Lab
                </span>
                <h3 className="text-3xl font-black uppercase text-brand-dark tracking-tight">
                  Document Your Creation
                </h3>
              </div>

              {!user ? (
                <div className="p-8 bg-amber-50 border border-amber-200 text-center space-y-4">
                  <HelpCircle className="w-8 h-8 text-amber-600 mx-auto" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#23231F]">
                    Digital Membership Profile Required!
                  </h4>
                  <p className="text-[11px] text-[#5B5550] leading-relaxed max-w-md mx-auto italic serif-italic">
                    To prevent automated kitchen logs and award real dynamic loyalty seeds to official profiles, you must be securely signed up and authenticated.
                  </p>
                  <p className="text-[10px] font-bold text-[#A3A31F] uppercase tracking-wider">
                    Click the profile button at the top header to write entries instantly!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* Recipe Name */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                      What culinary masterpiece did you create? *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., Honey-Whisky Trout over Sautéed Asparagus"
                      value={recipeName}
                      onChange={(e) => setRecipeName(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-brand-dark focus:bg-amber-50/5"
                    />
                  </div>

                  {/* Mustard Selection */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                        Artisanal Mustard Incorporated
                      </label>
                      <select
                        value={mustardUsed}
                        onChange={(e) => setMustardUsed(e.target.value)}
                        className="w-full px-4 py-3 border border-brand-border text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-brand-dark"
                      >
                        {MUSTARDS_LIST.map((mustard) => (
                          <option key={mustard} value={mustard}>
                            {mustard}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                        When did you cook this?
                      </label>
                      <input
                        type="date"
                        required
                        value={cookedAt}
                        onChange={(e) => setCookedAt(e.target.value)}
                        className="w-full px-4 py-3 border border-brand-border text-xs focus:outline-none focus:border-brand-dark font-mono"
                      />
                    </div>
                  </div>

                  {/* Tool Assistant & Tier */}
                  <div className="grid sm:grid-cols-2 gap-6 p-4 bg-brand-secondary/35 border border-brand-border/60">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-1">
                        What's For Meal Assist:
                      </label>
                      <span className="text-[8px] italic serif-italic text-[#5B5550] block mb-3">
                        Did you select this matching formula with our online layout generator?
                      </span>
                      <label className="relative flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={usedWhatsForMeal}
                          onChange={(e) => setUsedWhatsForMeal(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-brand-dark/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                        <span className="text-[9px] font-black uppercase text-brand-dark tracking-widest">
                          {usedWhatsForMeal ? 'Yes, Tool Propelled!' : 'Custom Original Idea'}
                        </span>
                      </label>
                    </div>

                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-1">
                        Quest Difficulty Tier:
                      </label>
                      <span className="text-[8px] italic serif-italic text-[#5B5550] block mb-3">
                        Rate the labor or culinary skills demanded:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {(['Easy', 'Moderate', 'Hard'] as const).map((tier) => (
                          <button
                            key={tier}
                            type="button"
                            onClick={() => setDifficulty(tier)}
                            className={`py-2 text-[8px] font-black uppercase tracking-widest border transition-colors ${
                              difficulty === tier
                                ? 'border-brand-dark bg-brand-dark text-white'
                                : 'border-brand-border bg-white hover:bg-brand-secondary/40 text-brand-dark'
                            }`}
                          >
                            {tier}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stars Rating */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                      Recipe Enjoyment & Taste Rating:
                    </label>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: 5 }).map((_, idx) => {
                        const score = idx + 1;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setStars(score)}
                            className="p-1 focus:outline-none hover:scale-110 transition-transform"
                          >
                            <Star 
                              className={`w-6 h-6 ${
                                score <= stars
                                  ? 'text-amber-500 fill-amber-500'
                                  : 'text-brand-dark/15 hover:text-amber-500'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Surprise Factor */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                      What surprised you the most about this flavor quest? *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., The whiskey fumes cut through raw fat beautifully, zero bitterness"
                      value={surprisedBy}
                      onChange={(e) => setSurprisedBy(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-brand-dark"
                    />
                  </div>

                  {/* Experience description */}
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60 block mb-2">
                      Write your experience / notes with other foodies *
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder="Share your kitchen journey, how easily it came together, what did you pair it with? Let others feel the courage to copy you!"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border text-xs uppercase tracking-wider font-semibold focus:outline-none focus:border-brand-dark min-h-[120px]"
                    />
                  </div>

                  {/* Submission Button */}
                  <div className="pt-4 border-t border-brand-border">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-[#A3A31F] text-white text-[10px] font-black uppercase tracking-widest hover:bg-[#8D8D1A] transition-colors flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Publishing to Culinary Ledger...</span>
                        </>
                      ) : (
                        <>
                          <span>Save Adventure Journal (+15 seeds)</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>

                </form>
              )}
            </motion.div>
          )}

          {/* 3. MY LOGBOOK TAB */}
          {activeTab === 'my-log' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {myEntries.length === 0 ? (
                <div className="md:col-span-2 lg:col-span-3 text-center py-20 bg-white border border-brand-border">
                  <BookOpen className="w-8 h-8 text-brand-dark/30 mx-auto mb-3" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-brand-dark">Your journal is currently blank</h4>
                  <p className="text-[11px] text-[#5B5550] italic serif-italic mt-1">Ready for your first bold recipe test? Go to the "Log a Culinary Adventure" tab and catalog it!</p>
                </div>
              ) : (
                myEntries.map((entry, idx) => (
                  <div
                    key={entry.id}
                    className="bg-white border border-brand-dark p-6 md:p-8 flex flex-col justify-between shadow-sm relative overflow-hidden"
                  >
                    {/* Tiny badge indicating user is creator */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-brand-dark text-white translate-x-12 -translate-y-12 rotate-45 flex items-end justify-center pb-2">
                      <span className="text-[7px] font-black uppercase tracking-wider">MINE</span>
                    </div>

                    <div>
                      {/* Header metadata */}
                      <div className="flex justify-between items-start gap-4 mb-4 border-b border-brand-border/40 pb-4">
                        <div>
                          <span className="text-[7px] font-black uppercase text-brand-accent bg-brand-dark px-2 py-0.5 inline-block mb-1">
                            {entry.difficulty}
                          </span>
                          <h4 className="text-[11px] font-black uppercase tracking-tight text-brand-dark">
                            Cooked on {entry.cookedAt}
                          </h4>
                        </div>
                      </div>

                      {/* Main Title */}
                      <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-2">
                        {entry.recipeName}
                      </h3>

                      {/* Mustard Tag */}
                      <span className="text-[8px] font-black uppercase text-[#A3A31F] border border-[#A3A31F]/30 bg-[#A3A31F]/5 px-2.5 py-1 inline-block mb-4">
                        {entry.mustardUsed}
                      </span>

                      <p className="text-[#5B5550] text-[11px] leading-relaxed italic serif-italic mb-6">
                        "{entry.experience}"
                      </p>
                    </div>

                    {/* Bottom layout */}
                    <div className="border-t border-brand-border/40 pt-4 flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${
                              i < entry.stars ? 'text-amber-500 fill-amber-500' : 'text-brand-dark/10'
                            }`} 
                          />
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
                        <span className="text-[10px] font-black text-brand-dark/60">{entry.likes || 0} Likes</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </section>
  );
}
