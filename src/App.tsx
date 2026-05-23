/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, ExternalLink, Heart, ShoppingBag, Share2, Search } from 'lucide-react';
import { NotificationProvider, useNotifications } from './contexts/NotificationContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Breadcrumbs from './components/Breadcrumbs';
import Hero from './components/Hero';
import MustardSommelier from './components/MustardSommelier';
import AwardsSection from './components/AwardsSection';
import ProcessSection from './components/ProcessSection';
import ProductGrid from './components/ProductGrid';
import RecipeSection from './components/RecipeSection';
import TestimonialSlider from './components/TestimonialSlider';
import LeadMagnet from './components/LeadMagnet';
import StockistMap from './components/StockistMap';
import StockistLeaderboard from './components/StockistLeaderboard';
import FlavourAssistant from './components/FlavourAssistant';
import Footer from './components/Footer';
import ShoppingBagDrawer from './components/ShoppingBag';
import Checkout from './components/Checkout';
import BundleBuilder from './components/BundleBuilder';
import NewsletterModal from './components/NewsletterModal';
import { STOCKISTS, EVENTS, Stockist, Product, PRODUCTS } from './constants';
import { db } from './lib/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot, deleteDoc, addDoc } from 'firebase/firestore';

import HarvestTicker from './components/HarvestTicker';
import CommunityLab from './components/CommunityLab';
import PairingCompass from './components/PairingCompass';
import MustardPulseTicker from './components/MustardPulseTicker';
import CommunityGallery from './components/CommunityGallery';
import TasteAlchemist from './components/TasteAlchemist';
import BottomNav from './components/BottomNav';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import MessagingCenter from './components/MessagingCenter';
import GiveawaysPortal from './components/GiveawaysPortal';
import GeofenceManager from './components/GeofenceManager';
import Laboratory from './components/Laboratory';
import TasteQuiz from './components/TasteQuiz';
import ApothecaryAR from './components/ApothecaryAR';
import WhatsForMeal from './components/WhatsForMeal';
import HealthBenefits from './components/HealthBenefits';
import FoodieDiary from './components/FoodieDiary';
// import StockistMap from './components/StockistMap'; // Removed duplicate

import { fetchWithRetry } from './lib/fetchUtils';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, profile, loading: authLoading } = useAuth();
  const { earnPoints } = useNotifications();
  const [selectedProvince, setSelectedProvince] = useState<string | 'All'>('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [hoveredStockist, setHoveredStockist] = useState<Stockist | null>(null);
  const [stockistSearch, setStockistSearch] = useState('');
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('mustard_wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  const [cart, setCart] = useState<{ id: string; quantity: number }[]>(() => {
    const saved = localStorage.getItem('mustard_cart');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeCategoryLabel, setActiveCategoryLabel] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isBagOpen, setIsBagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: 'add' | 'remove' | 'bag' | 'info' }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState<string | null>(null);
  const [localGiveaways, setLocalGiveaways] = useState<any[]>([]);
  const [currentVotes, setCurrentVotes] = useState<any[]>([]);
  const isInitialMount = useRef(true);
  const hasRemindedAbandoned = useRef(false);

  const currentMonth = useMemo(() => new Date().toLocaleString('default', { month: 'long', year: 'numeric' }), []);

  const userVotedIds = useMemo(() => {
    if (!user) return new Set<string>();
    return new Set<string>(
      currentVotes.filter(v => v.userId === user.uid).map(v => v.stockistId)
    );
  }, [currentVotes, user]);

  const voteCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    currentVotes.forEach(v => {
      counts[v.stockistId] = (counts[v.stockistId] || 0) + 1;
    });
    return counts;
  }, [currentVotes]);

  // Sync current month stockist votes from cloud inside real-time listener
  useEffect(() => {
    const q = query(collection(db, 'stockistVotes'), where('month', '==', currentMonth));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setCurrentVotes(list);
    }, (error) => {
      console.warn('Syncing stockist votes loaded in offline fallback:', error);
    });
    return () => unsubscribe();
  }, [currentMonth]);

  // Hook to watch URL parameter for social voting redirections
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const voteStockistId = params.get('vote');
    if (voteStockistId) {
      const matched = STOCKISTS.find(s => s.id === voteStockistId);
      if (matched) {
        setStockistSearch(matched.name);
        // Dispatch instant smooth scrolling trigger for locations anchor
        setTimeout(() => {
          const section = document.getElementById('locations');
          if (section) {
            section.scrollIntoView({ behavior: 'smooth' });
          }
        }, 1200);
      }
    }
  }, []);

  // Sync approved giveaways from cloud to show under stockists in real-time
  useEffect(() => {
    const q = query(collection(db, 'giveaways'), where('status', '==', 'approved'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      setLocalGiveaways(list);
    }, (error) => {
      console.warn('Giveaways fetching skipped or loaded offline:', error);
    });
    return () => unsubscribe();
  }, []);

  const fetchProducts = () => {
    setLoadingProducts(true);
    setProductError(null);
    fetchWithRetry('/api/products')
      .then(res => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const merged = data.map(apiProduct => {
            const local = PRODUCTS.find(p => p.id === apiProduct.id) || 
                         PRODUCTS.find(p => apiProduct.name.toLowerCase().includes(p.name.toLowerCase()));
            return {
              ...apiProduct,
              pairings: local?.pairings || [],
              attributes: local?.attributes || apiProduct.attributes || [],
              nutrition: local?.nutrition || { calories: 'N/A', fat: 'N/A', sugar: 'N/A', protein: 'N/A' },
              isMemberOnly: local?.isMemberOnly || false
            };
          });
          setProducts(merged);
        } else {
          setProducts(PRODUCTS);
        }
      })
      .catch(err => {
        console.error('Failed to fetch products:', err);
        setProductError(err.message);
        setProducts(PRODUCTS);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Firestore Sync Logic
  useEffect(() => {
    async function syncFromCloud() {
      if (user && !authLoading) {
        try {
          const syncDoc = await getDoc(doc(db, 'users', user.uid));
          if (syncDoc.exists()) {
            const data = syncDoc.data();
            // Merge or replace? We'll merge by preferring cloud for this artisanal app
            if (data.cart) setCart(data.cart);
            if (data.wishlist) setWishlist(data.wishlist);
            
            // Abandoned cart reminder
            if (data.cart && data.cart.length > 0 && !hasRemindedAbandoned.current) {
              addToast('Welcome back! Your bag is waiting.', 'info');
              hasRemindedAbandoned.current = true;
            }
          }
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        }
      }
    }
    syncFromCloud();
  }, [user, authLoading]);

  useEffect(() => {
    localStorage.setItem('mustard_wishlist', JSON.stringify(wishlist));
    
    if (user && !isInitialMount.current) {
      const syncRef = doc(db, 'users', user.uid);
      setDoc(syncRef, {
        wishlist,
        cart,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => console.error('Wishlist sync failed:', err));
    }
  }, [wishlist, user]);

  useEffect(() => {
    localStorage.setItem('mustard_cart', JSON.stringify(cart));
    
    if (user && !isInitialMount.current) {
      const syncRef = doc(db, 'users', user.uid);
      setDoc(syncRef, {
        cart,
        wishlist,
        updatedAt: serverTimestamp()
      }, { merge: true }).catch(err => console.error('Cart sync failed:', err));
    }
    
    isInitialMount.current = false;
  }, [cart, user]);

  const addToast = (message: string, type: 'add' | 'remove' | 'bag' | 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const trackEvent = (action: string, category: string, label: string) => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action, {
        event_category: category,
        event_label: label,
      });
    }
  };

  // Track PWA Installation
  useEffect(() => {
    const handleAppInstalled = () => {
      trackEvent('app_installed', 'engagement', 'pwa_install');
    };
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => window.removeEventListener('appinstalled', handleAppInstalled);
  }, []);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === productId);
      if (existing) {
        return prev.map(item => 
          item.id === productId ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      trackEvent('add_to_cart', 'ecommerce', productId);
      addToast('Added to bag', 'bag');
      return [...prev, { id: productId, quantity: 1 }];
    });
  };

  const handleToggleStockistVote = async (stockist: Stockist) => {
    if (!user) {
      setIsAuthModalOpen(true);
      return;
    }

    const voteDocId = `${stockist.id}_${user.uid}`;
    const voteRef = doc(db, 'stockistVotes', voteDocId);
    const hasVoted = userVotedIds.has(stockist.id);

    try {
      if (hasVoted) {
        await deleteDoc(voteRef);
        addToast(`Removed vote for ${stockist.name}`, 'info');
      } else {
        const newVote = {
          stockistId: stockist.id,
          userId: user.uid,
          userName: profile?.displayName || user.displayName || user.email?.split('@')[0] || 'Deli Supporter',
          month: currentMonth,
          createdAt: serverTimestamp()
        };
        await setDoc(voteRef, newVote);
        addToast(`Voted for ${stockist.name}!`, 'info');

        // Also push live community activity
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
      console.error('Failed to toggle vote:', error);
    }
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
    addToast('Removed from bag', 'remove');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item => 
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const toggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const isRemoving = prev.includes(productId);
      if (isRemoving) {
        addToast('Removed from wishlist', 'remove');
        return prev.filter(id => id !== productId);
      } else {
        trackEvent('add_to_wishlist', 'engagement', productId);
        addToast('Added to wishlist', 'add');
        return [...prev, productId];
      }
    });
  };

  const handleExplore = () => {
    setActiveTab('home');
    const el = document.getElementById('shop');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleFindStockist = () => {
    setActiveTab('home');
    const el = document.getElementById('locations');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleGoToBundles = () => {
    setActiveTab('home');
    const el = document.getElementById('bundles');
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const provinces = useMemo(() => ['All', ...new Set(STOCKISTS.map(s => s.province))], []);
  
  const cities = useMemo(() => {
    if (selectedProvince === 'All') return ['All', ...new Set(STOCKISTS.map(s => s.city))];
    const cityList = STOCKISTS.filter(s => s.province === selectedProvince).map(s => s.city);
    return ['All', ...new Set(cityList)];
  }, [selectedProvince]);
  
  const filteredStockists = useMemo(() => {
    let result = STOCKISTS;
    if (selectedProvince !== 'All') {
      result = result.filter(s => s.province === selectedProvince);
    }
    if (selectedCity !== 'All') {
      result = result.filter(s => s.city === selectedCity);
    }
    if (stockistSearch.trim()) {
      const q = stockistSearch.toLowerCase();
      result = result.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.location.toLowerCase().includes(q) || 
        s.city.toLowerCase().includes(q)
      );
    }
    return result;
  }, [selectedProvince, selectedCity, stockistSearch]);

  // Reset city when province changes
  useEffect(() => {
    setSelectedCity('All');
    if (selectedProvince !== 'All') {
      trackEvent('filter_province', 'engagement', selectedProvince);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedCity !== 'All') {
      trackEvent('filter_city', 'engagement', `${selectedProvince} - ${selectedCity}`);
    }
  }, [selectedCity]);

  return (
    <div className="min-h-screen selection:bg-olive-800 selection:text-white">
      <HarvestTicker />
      <MustardSommelier />
      <GeofenceManager />
      
      {/* Loyalty & Rewards Marquee */}
      <div className="bg-brand-accent/5 border-b border-brand-border py-4 overflow-hidden relative group cursor-default">
        <motion.div 
          animate={{ x: [0, -1000] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="flex items-center gap-16 whitespace-nowrap"
        >
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-12">
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark">Share any artisanal formula</span>
                <span className="text-[10px] font-black text-brand-accent">+5 SEEDS</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark">Complete a purchase</span>
                <span className="text-[10px] font-black text-brand-accent">+10 SEEDS</span>
              </div>
              <div className="flex items-center gap-4 text-brand-dark/40">
                <Share2 className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Synthesize exclusive discounts via your member profile</span>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <NewsletterModal />
      <Navigation 
        wishlistCount={wishlist.length} 
        bagCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onTabChange={setActiveTab}
        allProducts={products}
        onAddToCart={addToCart}
      />
      
      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onTabChange={setActiveTab}
      />

      <ShoppingBagDrawer 
        isOpen={isBagOpen} 
        onClose={() => setIsBagOpen(false)}
        items={cart}
        allProducts={products}
        onUpdateQuantity={updateQuantity}
        onRemove={removeFromCart}
        onCheckout={() => {
          setIsBagOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      <AnimatePresence>
        {isCheckoutOpen && (
          <Checkout 
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            items={cart}
            allProducts={products}
            onAddToCart={addToCart}
            onComplete={() => {
              setCart([]);
              earnPoints(10, 'Referral Reward');
              addToast('Order sequence finalized', 'info');
            }}
          />
        )}
      </AnimatePresence>
      
      {/* Toast Notifications */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`px-6 py-3 rounded-none border shadow-2xl flex items-center gap-3 backdrop-blur-md ${
                toast.type === 'add' 
                  ? 'bg-brand-dark text-white border-brand-dark' 
                  : 'bg-white text-brand-dark border-brand-border'
              }`}
            >
              <div className="flex items-center gap-3">
                {toast.type === 'info' ? (
                  <ShoppingBag className="w-3.5 h-3.5 text-brand-accent animate-bounce" />
                ) : (
                  <Heart className={`w-3.5 h-3.5 ${toast.type === 'add' ? 'fill-brand-accent text-brand-accent animate-pulse' : toast.type === 'bag' ? 'text-brand-accent' : 'text-brand-dark opacity-40'}`} />
                )}
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{toast.message}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <main className="w-full">
        <Hero onAddToCart={addToCart} onExplore={handleExplore} onFindStockist={handleFindStockist} onGoToBundles={handleGoToBundles} />

        <Breadcrumbs 
          paths={[
            ...(activeSection ? [{ label: activeSection, onClick: () => {
              const el = document.getElementById(activeSection.toLowerCase().replace(' ', '-'));
              el?.scrollIntoView({ behavior: 'smooth' });
            }}] : []),
            ...(activeCategoryLabel && activeCategoryLabel !== 'All' ? [{ label: activeCategoryLabel, active: true }] : [])
          ]}
        />

        <section id="shop" onMouseEnter={() => setActiveSection('Shop')}>
          <ProductGrid 
            wishlist={wishlist} 
            onToggleWishlist={toggleWishlist} 
            onAddToCart={addToCart}
            allProducts={products}
            onCategoryChange={setActiveCategoryLabel}
            isLoading={loadingProducts}
            error={productError}
            onRefresh={fetchProducts}
          />
        </section>

        <section id="bundles" onMouseEnter={() => { setActiveSection('Bundles'); setActiveCategoryLabel(null); }}>
          <BundleBuilder onAddToCart={addToCart} />
        </section>
        
        {/* Story Section */}
        <section id="our-story" className="py-20 md:py-32 px-8 md:px-12 bg-white" onMouseEnter={() => { setActiveSection('Story'); setActiveCategoryLabel(null); }}>
          <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 md:gap-24 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="border border-brand-border p-6 md:p-8 bg-brand-secondary">
                <img 
                  src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=800" 
                  alt="Deli artisan" 
                  referrerPolicy="no-referrer"
                  className="aspect-[4/5] object-cover grayscale opacity-80"
                />
              </div>
              <div className="absolute -bottom-6 md:-bottom-8 -right-6 md:-right-8 bg-brand-dark text-white p-6 md:p-10 flex flex-col items-center justify-center text-center shadow-xl">
                 <span className="text-[8px] md:text-[10px] uppercase tracking-[0.3em] opacity-50 mb-2">Since</span>
                 <span className="text-2xl md:text-3xl font-black italic serif-italic text-brand-accent">2012</span>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-4 md:6 block">Our Craft</span>
              <h2 className="text-4xl md:text-6xl font-black tracking-tighter text-brand-dark leading-tight mb-8 uppercase">
                Tradition meets <span className="serif-italic lowercase">innovation</span>
              </h2>
              <div className="space-y-4 md:6 text-[#5B5550] leading-relaxed font-normal text-sm md:base">
                 <p>
                  Started in a small kitchen in Port Elizabeth with a single recipe, Mustard Deli has grown into a beloved 
                  South African staple. Proudly based in Gqeberha, we supply our artisan jars to fine grocers across the country.
                </p>
                <p>
                  Every jar is handcrafted using non-GMO seeds, local ingredients, and absolutely 
                  no preservatives. Our unique flavor profiles like Smoked Apricot and Green Fig 
                  are designed to surprise and delight your palate.
                </p>
              </div>
              
              <div className="mt-8 md:12 grid grid-cols-2 gap-8 md:12 border-t border-brand-border pt-8 md:12">
                <div>
                  <h4 className="text-3xl md:4xl font-black text-brand-dark mb-1">12+</h4>
                  <p className="text-[9px] md:10px uppercase tracking-widest text-[#5B5550] font-bold">Unique Blends</p>
                </div>
                <div>
                  <h4 className="text-3xl md:4xl font-black text-brand-dark mb-1">100%</h4>
                  <p className="text-[9px] md:10px uppercase tracking-widest text-[#5B5550] font-bold">Preservative Free</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <AwardsSection />
        <ProcessSection />
        <HealthBenefits />

        <section id="compass" onMouseEnter={() => { setActiveSection('Compass'); setActiveCategoryLabel(null); }}>
          <PairingCompass />
        </section>

        <TasteAlchemist onAddToCart={addToCart} />

        <section id="lab" onMouseEnter={() => { setActiveSection('Lab'); setActiveCategoryLabel(null); }}>
          <CommunityLab />
        </section>

        <section id="recipes" onMouseEnter={() => { setActiveSection('Recipes'); setActiveCategoryLabel(null); }}>
          <RecipeSection onAddToCart={addToCart} />
        </section>

        <CommunityGallery />

        {/* Laboratory / First Taste */}
        <section id="laboratory" className="scroll-mt-20">
          <Laboratory />
        </section>

        {/* Stockist Discovery */}
        <section id="locations" className="py-24 px-4 bg-brand-secondary scroll-mt-20">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
              <div className="max-w-xl">
                <p className="text-[10px] font-black uppercase text-brand-accent tracking-[0.4em] mb-4">Retail Network</p>
                <h2 className="text-4xl md:text-6xl font-black text-brand-dark uppercase leading-none mb-6">
                  Find Your <span className="text-brand-accent underline decoration-brand-dark/20">Closest</span> Reserve
                </h2>
                <div className="relative group w-full md:w-96 mb-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/30 group-focus-within:text-brand-accent transition-colors" />
                    <input 
                      type="text"
                      placeholder="Search store name or area..."
                      value={stockistSearch || ''}
                      onChange={(e) => setStockistSearch(e.target.value)}
                      className="w-full bg-white border border-brand-border p-4 pl-12 text-[11px] font-bold uppercase tracking-widest outline-none focus:border-brand-accent transition-all shadow-sm"
                    />
                </div>
                <p className="text-sm font-medium text-brand-dark/60 leading-relaxed uppercase tracking-widest">
                  Explore our nationwide map of boutique delis, artisanal butchers, and specialty markets stocking the Mustard Deli range.
                </p>
              </div>
              
              <div className="flex items-center gap-4 text-brand-dark/40 bg-white/50 backdrop-blur border border-brand-border p-4">
                 <div className="text-right">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">Live Inventory</p>
                    <p className="text-[11px] font-medium leading-none italic uppercase">Last sync: Just now</p>
                 </div>
                 <div className="w-10 h-10 border border-brand-border flex items-center justify-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                 </div>
              </div>
            </div>
            
            {/* Active Local Giveaways Banner */}
            {localGiveaways.length > 0 && (
              <div className="mb-10 bg-[#4B5320]/10 border border-[#4B5320]/30 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <span className="text-[9px] font-mono font-black tracking-widest text-brand-dark bg-[#A3A31F]/30 px-2.5 py-1 uppercase inline-block mb-3 rounded-none">
                    🎁 ACTIVE RETAIL COLLABORATION draws
                  </span>
                  <h3 className="text-xl font-black uppercase text-brand-dark tracking-tight">
                    Win Co-Branded Tasting Jars Nearby!
                  </h3>
                  <p className="text-xs text-[#5B5550] mt-1.5 leading-relaxed max-w-xl">
                    Our verified partners in cities across South Africa are hosting collaborative giveaways. Register inside the app today to join the drawing pool and support boutique local deli counters!
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab('giveaways');
                    document.getElementById('giveaways')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-4 bg-brand-dark hover:bg-brand-accent text-white text-[9px] font-black uppercase tracking-[0.2em] transition-colors shrink-0 shadow-lg"
                >
                  Enter Giveaway Portal (+5 SEEDS)
                </button>
              </div>
            )}

            <StockistLeaderboard onOpenAuth={() => setIsAuthModalOpen(true)} />

            <div className="grid lg:grid-cols-12 gap-8 mb-12">
              <div className="lg:col-span-12">
                <StockistMap />
              </div>
              
              <div className="lg:col-span-12 mt-4">
                {filteredStockists.length === 0 ? (
                  /* High comfort, direct-to-door sales priority for unserved cities */
                  <div className="bg-white border-2 border-dashed border-brand-accent p-8 md:p-12 text-center max-w-3xl mx-auto my-4 shadow-xl">
                    <span className="text-brand-accent text-[11px] font-black tracking-[0.3em] uppercase block mb-3">NATIONWIDE DIRECT EXPRESS COURIER</span>
                    <h3 className="text-3xl font-black uppercase tracking-tight text-brand-dark mb-4">No Stockists In Your Neighborhood?</h3>
                    <p className="text-sm text-[#5B5550] leading-relaxed max-w-xl mx-auto mb-8">
                      We've got you covered! Mustard Deli ships fresh, stone-ground reserves directly from our South African kitchen directly to your doorstep. Satisfy your savory cravings with express delivery convenience.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8 text-left">
                      <div className="p-4 bg-brand-secondary/40 border border-brand-border/60">
                        <span className="text-[9px] font-mono uppercase text-[#5B5550] block mb-1">FREE delivery Option</span>
                        <p className="text-xs font-black uppercase text-brand-dark">For all orders above R450</p>
                      </div>
                      <div className="p-4 bg-brand-secondary/40 border border-brand-border/60">
                        <span className="text-[9px] font-mono uppercase text-[#5B5550] block mb-1">Supercharged Dispatch</span>
                        <p className="text-xs font-black uppercase text-brand-dark">Shipped within 24 Hours</p>
                      </div>
                      <div className="p-4 bg-brand-secondary/40 border border-brand-border/60">
                        <span className="text-[9px] font-mono uppercase text-[#5B5550] block mb-1">Nationwide Tracking</span>
                        <p className="text-xs font-black uppercase text-brand-dark">Detailed tracking via SMS</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                      className="px-10 py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-colors shadow-2xl"
                    >
                      Bypass Map & Shop Online Now
                    </button>
                  </div>
                ) : (
                  <div>
                    {/* Footnote encouraging direct online shipping if they are remote */}
                    <div className="mb-6 flex flex-col md:flex-row items-center justify-between border border-brand-border bg-brand-bg/60 p-4">
                      <p className="text-xs font-medium text-brand-dark/70 mb-2 md:mb-0">
                        📍 Located relatively far away? We deliver our complete range anywhere in South Africa with free shipping on orders over R450.
                      </p>
                      <button 
                        onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-[10px] font-black uppercase text-brand-accent hover:underline"
                      >
                        Shop Online Direct →
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                      {filteredStockists.map(s => (
                        <div key={s.id} className="p-5 bg-white border border-brand-border shadow-sm group hover:border-brand-accent transition-colors flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[8px] font-black uppercase tracking-widest text-[#A3A31F]">
                                {s.type} • {s.city}
                              </span>
                              <span className="text-[8px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5">
                                Support Local-Curated
                              </span>
                            </div>
                            <h4 className="text-base font-black uppercase tracking-tight text-brand-dark mb-1">{s.name}</h4>
                            <p className="text-[10px] font-medium text-brand-dark/60 leading-normal mb-1">{s.location}</p>

                            {/* Community Liking Support row */}
                            <div className="flex items-center justify-between border-t border-b border-brand-border/40 py-2.5 my-3 bg-brand-secondary/30 px-2">
                              <span className="text-[9px] font-mono text-brand-dark/60 font-black uppercase">
                                ❤️ {voteCounts[s.id] || 0} supporters
                              </span>
                              <button
                                onClick={() => handleToggleStockistVote(s)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 border text-[8px] font-black tracking-widest uppercase transition-colors shrink-0 ${
                                  userVotedIds.has(s.id)
                                    ? 'bg-red-50 border-red-200 text-red-500 font-black'
                                    : 'bg-white border-brand-border text-brand-dark/60 hover:bg-brand-secondary hover:text-red-500'
                                }`}
                                title={userVotedIds.has(s.id) ? 'Unlike this store' : 'Like this store'}
                              >
                                <Heart className={`w-3 h-3 ${userVotedIds.has(s.id) ? 'fill-red-500 text-red-500' : ''}`} />
                                {userVotedIds.has(s.id) ? 'Liked' : 'Like'}
                              </button>
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-brand-border/60 flex flex-col gap-2">
                            <a 
                              href={`https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-brand-dark text-white text-[9px] font-black uppercase tracking-wider py-3 flex items-center justify-center gap-2 hover:bg-brand-accent transition-colors"
                            >
                              🧭 Plan Visit / Get Directions
                            </a>
                            {s.website && (
                              <a href={s.website} target="_blank" rel="noopener" className="w-full border border-brand-border text-center text-brand-dark text-[8px] font-black uppercase py-2 hover:bg-brand-secondary transition-colors">
                                View Stockist Website
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <TasteQuiz onAddToCart={addToCart} />
        <WhatsForMeal onAddToCart={addToCart} onOpenAuth={() => setIsAuthModalOpen(true)} />
        <FoodieDiary />
        <ApothecaryAR />
        <LeadMagnet />

        {/* Overlays for complex app sections */}
        <AnimatePresence>
          {activeTab === 'admin' && (
            <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg sticky top-0 z-10">
                <h2 className="text-2xl font-black uppercase">Command Center</h2>
                <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-brand-secondary">Close</button>
              </div>
              <AdminDashboard />
            </div>
          )}
          {activeTab === 'messages' && (
            <div className="fixed inset-0 z-[70] bg-white overflow-y-auto">
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg sticky top-0 z-10">
                <h2 className="text-2xl font-black uppercase">Dispatches</h2>
                <button onClick={() => setActiveTab('home')} className="p-2 hover:bg-brand-secondary">Close</button>
              </div>
              <div className="p-8"><MessagingCenter /></div>
            </div>
          )}
          {activeTab === 'giveaways' && (
            <div className="fixed inset-0 z-[70] bg-white overflow-y-auto animate-fade-in">
              <div className="p-8 border-b border-brand-border flex justify-between items-center bg-brand-bg sticky top-0 z-[70] shadow-sm">
                <h2 className="text-2xl font-black uppercase">Collaboration Portal</h2>
                <button onClick={() => setActiveTab('home')} className="p-2 border border-brand-border hover:bg-brand-secondary font-black text-xs uppercase px-4 py-2">Close</button>
              </div>
              <div className="bg-white min-h-screen">
                <GiveawaysPortal onOpenAuth={() => setIsAuthModalOpen(true)} />
              </div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Background persistent features */}
        <FlavourAssistant onAddToCart={addToCart} />
        <MustardPulseTicker />
      </main>
      <TestimonialSlider />
      <Footer />
      
      <BottomNav 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        bagCount={cart.reduce((acc, item) => acc + item.quantity, 0)}
        wishlistCount={wishlist.length}
        onOpenBag={() => setIsBagOpen(true)}
        onOpenWishlist={() => {
          setActiveTab('saved');
          const el = document.getElementById('shop');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenSearch={() => {
          setActiveTab('shop');
          const el = document.getElementById('shop');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />
    </div>
  );
}

