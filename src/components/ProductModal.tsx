import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShoppingBag, Info, Leaf, Wine, Star, MessageSquare, User as UserIcon, Facebook, Twitter, Share2, Activity, Heart, ChevronDown, ChevronUp, Link, Check, ArrowUp, UtensilsCrossed, Flame, ShieldCheck, Droplets, Scale, FlaskConical, Sparkles, Zap, TrendingUp, ThermometerSun, Trophy } from 'lucide-react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  ResponsiveContainer 
} from 'recharts';
import { Product } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchWithRetry } from '../lib/fetchUtils';

interface Review {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  date: string;
  isVerified?: boolean;
}

interface ProductModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  allProducts: Product[];
  onProductChange: (product: Product) => void;
  isWishlisted: boolean;
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onReviewSubmitted?: (productId: string, rating: number) => void;
}

export default function ProductModal({ 
  product, 
  isOpen, 
  onClose, 
  allProducts, 
  onProductChange,
  isWishlisted,
  onToggleWishlist,
  onAddToCart,
  onReviewSubmitted
}: ProductModalProps) {
  const [showShareCard, setShowShareCard] = useState(false);
  const { user } = useAuth();
  const { earnPoints, profile } = useNotifications();
  const isWholesale = profile?.role === 'stockist';
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState({ userName: '', rating: 5, comment: '' });

  useEffect(() => {
    if (user && !newReview.userName) {
      setNewReview(prev => ({ ...prev, userName: user.displayName || '' }));
    }
  }, [user]);

  const [loadingReviews, setLoadingReviews] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(false);
  const [isReviewsOpen, setIsReviewsOpen] = useState(false);
  const [activeInfoTab, setActiveInfoTab] = useState<'details' | 'ingredients' | 'recipes'>('details');

  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setShowScrollTop(scrollContainerRef.current.scrollTop > 400);
    }
  };

  const scrollToTop = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (product && isOpen) {
      setActiveInfoTab('details');
      setLoadingReviews(true);
      fetchWithRetry(`/api/products/${product.id}/reviews`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setReviews(data);
          setLoadingReviews(false);
        })
        .catch(err => {
          console.error('Failed to fetch reviews:', err);
          setLoadingReviews(false);
        });
    }
  }, [product, isOpen]);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newReview.userName || !newReview.comment) return;

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        ...newReview,
        isVerified: !!user
      };
      const res = await fetchWithRetry(`/api/products/${product.id}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const addedReview = await res.json();
        setReviews(prev => [addedReview, ...prev]);
        setNewReview({ userName: '', rating: 5, comment: '' });
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
        
        if (onReviewSubmitted) {
          onReviewSubmitted(product.id, addedReview.rating);
        }
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || 'Failed to submit review');
      }
    } catch (err) {
      console.error('Failed to submit review:', err);
      setSubmitError('Failed to connect to server');
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (product && isOpen) {
      const stored = localStorage.getItem('recentlyViewed');
      const viewedIds: string[] = stored ? JSON.parse(stored) : [];
      
      const viewedProducts = viewedIds
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => !!p && p.id !== product.id)
        .slice(0, 3);
        
      setRecentlyViewed(viewedProducts);

      // Track current
      const updatedIds = [product.id, ...viewedIds.filter(id => id !== product.id)].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedIds));
    }
  }, [product?.id, isOpen, allProducts]);

  const recentlyViewedProducts = recentlyViewed.slice(0, 3);

  const relatedProducts = allProducts
    .filter(p => p.category === product?.category && p.id !== product?.id)
    .slice(0, 10);

  const averageRating = reviews.length > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 0;
  const totalReviews = reviews.length;

  const handleShare = async () => {
    if (!product) return;
    const shareUrl = `${window.location.origin}?product=${product.id}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mustard Deli | ${product.name}`,
          text: product.description,
          url: shareUrl,
        });
        earnPoints(5);
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      earnPoints(5);
      alert('Product link copied to clipboard! 5 Seeds added to your profile.');
    }
  };

  if (!product) return null;

  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/?product=${product.id}` : '';
  const shareText = `Check out this artisanal ${product.name} from Mustard Deli!`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`,
    pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&media=${encodeURIComponent(product.image)}&description=${encodeURIComponent(shareText)}`
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      earnPoints(5);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-white border border-brand-border overflow-hidden md:flex flex-col md:flex-row shadow-2xl"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 text-brand-dark md:text-brand-dark hover:text-brand-accent transition-all md:bg-transparent"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Image Section */}
            <div className="w-full md:w-1/2 bg-brand-secondary p-8 flex items-center justify-center min-h-[300px]">
              {product.image ? (
                <motion.img
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  src={product.image}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full aspect-square object-contain transition-transform duration-700 hover:scale-105"
                />
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full flex flex-col items-center justify-center p-12 text-center"
                >
                  <div className="w-24 h-24 bg-brand-dark/5 rounded-full flex items-center justify-center mb-6">
                    <ShoppingBag className="w-10 h-10 text-brand-dark/20" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-brand-dark/40 mb-2">Image Harvesting</h3>
                  <p className="text-[10px] text-brand-dark/30 font-bold uppercase tracking-widest max-w-[200px]">
                    We are currently capturing the essence of this {product.category.toLowerCase()} blend.
                  </p>
                  <img 
                    src={`https://picsum.photos/seed/${product.name.replace(/\s+/g, '-')}/600/600?grayscale&blur=2`}
                    alt="Artistic Placeholder"
                    className="absolute inset-0 w-full h-full object-cover opacity-5 mix-blend-multiply pointer-events-none"
                    referrerPolicy="no-referrer"
                  />
                </motion.div>
              )}
            </div>

            {/* Details Section */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="w-full md:w-1/2 flex flex-col max-h-[80vh] overflow-y-auto relative"
            >
              <div className="p-8 md:p-12 pb-32 md:pb-12">
                <div className="mb-6">
                  <span className="text-brand-accent font-bold text-[10px] uppercase tracking-[0.3em] mb-2 block">
                    {product.category}
                  </span>
                <div className="flex justify-between items-start gap-4">
                  <h2 className="text-3xl font-black text-brand-dark tracking-tighter uppercase leading-tight mb-4 flex-1">
                    {product.name}
                  </h2>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onToggleWishlist(product.id)}
                    className="group/wishlist flex flex-col items-center gap-1 mt-1"
                  >
                    <div className={`w-10 h-10 border flex items-center justify-center transition-all ${isWishlisted ? 'border-brand-accent bg-brand-accent/5' : 'border-brand-border hover:border-brand-dark'}`}>
                       <Heart className={`w-5 h-5 transition-all ${isWishlisted ? 'fill-brand-accent text-brand-accent' : 'text-brand-dark opacity-40 group-hover/wishlist:opacity-100'}`} />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">
                      {isWishlisted ? 'Remove' : 'Save'}
                    </span>
                  </motion.button>
                </div>

                {/* Awards Badge Section */}
                {product.awards && product.awards.length > 0 && (
                  <div className="flex flex-wrap gap-4 mb-8">
                    {product.awards.map((award, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + (i * 0.1) }}
                        className="flex items-center gap-3 bg-brand-accent/5 border border-brand-accent/20 px-4 py-2.5 rounded-full group cursor-pointer hover:bg-brand-accent/10 transition-colors"
                      >
                        <div className="relative">
                          <Trophy className="w-4 h-4 text-brand-accent relative z-10" />
                          <div className="absolute inset-0 bg-brand-accent blur-[6px] opacity-30 group-hover:opacity-50 transition-opacity" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black uppercase tracking-widest leading-none text-brand-accent mb-0.5">
                            {award.year} Gold Winner
                          </span>
                          <span className="text-[7px] font-bold uppercase tracking-widest leading-none text-brand-dark/60">
                            {award.title}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div className="flex flex-col">
                    <p className={`text-2xl font-black ${isWholesale && product.wholesalePrice ? 'text-brand-dark/40 text-sm line-through' : 'text-brand-dark'}`}>
                      {product.price}
                    </p>
                    {isWholesale && product.wholesalePrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-brand-accent">{product.wholesalePrice}</span>
                        <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 bg-brand-accent text-white">Stockist Rate</span>
                      </div>
                    )}
                  </div>
                  {product.stock === 0 ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1 h-1 bg-red-600 rounded-full" />
                      Out of Stock
                    </span>
                  ) : product.stock < 5 ? (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest animate-pulse">
                      <span className="w-1 h-1 bg-amber-600 rounded-full" />
                      Low Stock
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 border border-green-100 text-[10px] font-black uppercase tracking-widest">
                      <span className="w-1 h-1 bg-green-600 rounded-full" />
                      In Stock
                    </span>
                  )}
                </div>
                <p className="text-[#5B5550] text-sm leading-relaxed mb-8 italic serif-italic">
                  "{product.description}"
                </p>
              </div>

              {/* Enhanced Info Grid */}
              <div className="border-t border-brand-border pt-10 mb-8">
                <div className="flex gap-6 mb-8 border-b border-brand-border">
                  {[
                    { id: 'details', label: 'Details' },
                    { id: 'ingredients', label: 'Ingredients' },
                    { id: 'recipes', label: 'Recipes' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveInfoTab(tab.id as any)}
                      className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
                        activeInfoTab === tab.id ? 'text-brand-accent' : 'text-brand-dark/40 hover:text-brand-dark'
                      }`}
                    >
                      {tab.label}
                      {activeInfoTab === tab.id && (
                        <motion.div 
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-accent"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {activeInfoTab === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-8"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-brand-secondary/40 border border-brand-border rounded-xl group hover:border-brand-accent transition-colors">
                          <div className="w-8 h-8 bg-white border border-brand-border flex items-center justify-center rounded-lg mb-3 group-hover:bg-brand-accent group-hover:border-brand-accent group-hover:text-white transition-all">
                            <Leaf className="w-4 h-4" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-2">Artisan Integrity</h4>
                          <p className="text-[10px] text-[#5B5550] leading-relaxed">Crafted with Non-GMO seeds, local sea salt, and botanical infusions.</p>
                        </div>
                        <div className="p-4 bg-brand-secondary/40 border border-brand-border rounded-xl group hover:border-brand-accent transition-colors">
                          <div className="w-8 h-8 bg-white border border-brand-border flex items-center justify-center rounded-lg mb-3 group-hover:bg-brand-accent group-hover:border-brand-accent group-hover:text-white transition-all">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-2">Serving Note</h4>
                          <p className="text-[10px] text-[#5B5550] leading-relaxed">Refrigerate after opening to preserve the signature botanical punch.</p>
                        </div>
                      </div>

                      <div className="bg-brand-dark text-white rounded-2xl p-6 shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl group-hover:bg-brand-accent/20 transition-all" />
                        <div className="flex items-center justify-between mb-6 relative z-10">
                          <div className="flex items-center gap-3">
                            <Scale className="w-5 h-5 text-brand-accent" />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Nutritional Facts</h4>
                          </div>
                          <span className="text-[8px] font-bold uppercase tracking-widest opacity-40">Per 100g Serving</span>
                        </div>
                        <div className="grid grid-cols-4 gap-3 relative z-10">
                          {[
                            { label: 'Energy', value: product.nutrition?.calories || '142 kcal', icon: Flame },
                            { label: 'Fat', value: product.nutrition?.fat || '2.4g', icon: Droplets },
                            { label: 'Sugar', value: product.nutrition?.sugar || '0.8g', icon: FlaskConical },
                            { label: 'Protein', value: product.nutrition?.protein || '5.1g', icon: Activity }
                          ].map((stat, i) => (
                            <div key={i} className="flex flex-col items-center p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
                              <stat.icon className="w-3.5 h-3.5 text-brand-accent mb-2" />
                              <span className="text-[11px] font-black mb-1">{stat.value}</span>
                              <span className="text-[7px] font-bold uppercase tracking-widest opacity-40">{stat.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <UtensilsCrossed className="w-4 h-4 text-brand-accent" />
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark">The Culinary Compass</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          {(product.pairings && product.pairings.length > 0 ? product.pairings : ['Mature Cheddar', 'Artisan Sourdough', 'Grilled Meats', 'Smoked Salmon']).map((item, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-3 p-3 bg-white border border-brand-border rounded-lg hover:border-brand-dark hover:bg-brand-secondary transition-all cursor-default group"
                            >
                              <div className="w-6 h-6 bg-brand-secondary flex items-center justify-center rounded group-hover:bg-brand-dark group-hover:text-white transition-colors">
                                <Check className="w-3 h-3 text-brand-accent" />
                              </div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#5B5550] group-hover:text-brand-dark">{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeInfoTab === 'ingredients' && (
                    <motion.div
                      key="ingredients"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-6"
                    >
                      <div className="p-8 bg-brand-secondary/30 border border-brand-border rounded-sm relative">
                        <div className="absolute top-4 left-4">
                           <FlaskConical className="w-4 h-4 text-brand-accent opacity-20" />
                        </div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-dark mb-4 text-center">Batch Formulation</h4>
                        <div className="flex flex-wrap gap-2 justify-center">
                          {(product.ingredients || ['Mustard Seeds', 'Water', 'Vinegar', 'Sea Salt', 'Artisanal Spices']).map((ing, i) => {
                            const isAllergen = ['mustard', 'gluten', 'honey', 'garlic'].some(a => ing.toLowerCase().includes(a));
                            return (
                              <span 
                                key={i} 
                                className={`px-3 py-1 border text-[9px] font-bold uppercase tracking-widest shadow-sm transition-colors ${
                                  isAllergen
                                    ? 'bg-amber-50 border-amber-200 text-amber-900 font-black' 
                                    : 'bg-white border-brand-border text-brand-dark'
                                }`}
                              >
                                {ing}
                              </span>
                            );
                          })}
                        </div>
                        <div className="border-t border-brand-border/40 mt-6 pt-4 text-center space-y-2">
                          <p className="text-[9px] text-brand-dark/40 uppercase tracking-widest font-bold px-4">
                            Allergens: {(() => {
                              const found = new Set<string>();
                              const ings = (product.ingredients || []).join(' ').toLowerCase();
                              if (ings.includes('mustard')) found.add('Mustard');
                              if (ings.includes('gluten')) found.add('Gluten');
                              if (ings.includes('honey')) found.add('Honey');
                              if (ings.includes('garlic')) found.add('Garlic');
                              return found.size > 0 ? `Contains ${Array.from(found).join(', ')}.` : 'No major allergens reported.';
                            })()}
                          </p>
                          <div className="flex items-center justify-center gap-4">
                             <div className="flex items-center gap-1">
                               <Check className="w-2.5 h-2.5 text-brand-accent" />
                               <span className="text-[8px] font-black uppercase tracking-tighter text-brand-dark/60">Preservative Free</span>
                             </div>
                             <div className="flex items-center gap-1">
                               <Check className="w-2.5 h-2.5 text-brand-accent" />
                               <span className="text-[8px] font-black uppercase tracking-tighter text-brand-dark/60">Non-GMO Seeds</span>
                             </div>
                             {product.isVegan && (
                               <div className="flex items-center gap-1">
                                 <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex items-center justify-center">
                                   <Leaf className="w-1.5 h-1.5 text-white" />
                                 </div>
                                 <span className="text-[8px] font-black uppercase tracking-tighter text-green-600">Vegan Friendly</span>
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeInfoTab === 'recipes' && (
                    <motion.div
                      key="recipes"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="space-y-4"
                    >
                      {(product.productRecipes || [
                        { title: 'The Deli Classic', excerpt: 'The perfect foundation for any artisanal sandwich or charcuterie pairing.' }
                      ]).map((recipe, i) => (
                        <div key={i} className="p-6 bg-white border border-brand-border hover:border-brand-accent transition-all group">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="text-xs font-black uppercase tracking-tight text-brand-dark group-hover:text-brand-accent transition-colors">
                              {recipe.title}
                            </h4>
                            <ArrowUp className="w-3 h-3 text-brand-dark rotate-45 opacity-20 group-hover:opacity-100 group-hover:text-brand-accent transition-all" />
                          </div>
                          <p className="text-[10px] text-[#5B5550] leading-relaxed italic border-l-2 border-brand-accent/20 pl-4 py-1">
                            {recipe.excerpt}
                          </p>
                        </div>
                      ))}
                      <button className="w-full py-4 border border-dashed border-brand-border text-[9px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-accent hover:border-brand-accent transition-all">
                        View More Community Recipes
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

                <div className="border-t border-brand-border pt-6 mt-6">
                  <div className="flex gap-4 items-center mb-6">
                    <Activity className="w-4 h-4 text-brand-accent animate-pulse" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Flavour Profile DNA</h4>
                  </div>
                  
                  <div className="h-48 w-full bg-brand-bg/50 rounded-sm border border-dashed border-brand-border relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="w-full h-full bg-[radial-gradient(circle_at_center,_#B22222_0.5px,_transparent_0.5px)] bg-[size:10px_10px]" />
                    </div>
                    
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                        { subject: 'Acidity', A: 85, fullMark: 100 },
                        { subject: 'Heat', A: product?.category === 'Chilli' ? 95 : 40, fullMark: 100 },
                        { subject: 'Sweetness', A: product?.category === 'Sugar-Free' ? 10 : 60, fullMark: 100 },
                        { subject: 'Texture', A: 75, fullMark: 100 },
                        { subject: 'Umami', A: 90, fullMark: 100 },
                      ]}>
                        <PolarGrid stroke="#E6E3DE" />
                        <PolarAngleAxis 
                          dataKey="subject" 
                          tick={{ fill: '#2F4F4F', fontSize: 7, fontWeight: 900, textAnchor: 'middle' }}
                        />
                        <Radar
                          name="Profile"
                          dataKey="A"
                          stroke="#B22222"
                          fill="#B22222"
                          fillOpacity={0.4}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    
                    <div className="absolute bottom-2 right-2">
                       <Zap className="w-3 h-3 text-brand-accent opacity-30" />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <div className="flex items-center gap-2 p-2 bg-white border border-brand-border rounded-sm">
                        <ThermometerSun className="w-3 h-3 text-brand-accent" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-brand-dark">Intensity: High</span>
                     </div>
                     <div className="flex items-center gap-2 p-2 bg-white border border-brand-border rounded-sm">
                        <TrendingUp className="w-3 h-3 text-brand-accent" />
                        <span className="text-[8px] font-bold uppercase tracking-widest text-brand-dark">Maturity: Aged</span>
                     </div>
                  </div>
                </div>

                <div className="border-t border-brand-border pt-6 mt-2">
                  <button 
                    onClick={() => setIsDeliveryOpen(!isDeliveryOpen)}
                    className="flex items-center justify-between w-full group"
                  >
                    <div className="flex gap-4 items-center">
                      <ShoppingBag className="w-4 h-4 text-brand-accent group-hover:rotate-12 transition-transform" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Delivery & Returns</h4>
                    </div>
                    {isDeliveryOpen ? <ChevronUp className="w-4 h-4 text-brand-dark/40" /> : <ChevronDown className="w-4 h-4 text-brand-dark/40" />}
                  </button>
                  
                  <AnimatePresence>
                    {isDeliveryOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-4 pl-8 space-y-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-1">Shipping</p>
                            <p className="text-[10px] text-brand-dark/60 leading-relaxed">
                              Nationwide delivery across South Africa. 
                              <span className="block mt-1">Flat Rate: <span className="font-bold text-brand-dark">R99</span></span>
                              <span className="block text-brand-accent font-bold uppercase tracking-widest">Free on orders over R750</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-1">Timeframe</p>
                            <p className="text-[10px] text-brand-dark/60 leading-relaxed">
                              Orders are processed within 24 hours. Estimated delivery: <span className="font-bold text-brand-dark">2-5 Business Days.</span>
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40 mb-1">Return Policy</p>
                            <p className="text-[10px] text-brand-dark/60 leading-relaxed italic">
                              "We stand by our punch." 30-day returns for unopened jars. If your blend arrives compromised, we'll replace it immediately, no questions asked.
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="border-t border-brand-border pt-6 mt-2">
                  <button 
                    onClick={() => setIsReviewsOpen(!isReviewsOpen)}
                    className="flex items-center justify-between w-full group"
                  >
                    <div className="flex gap-4 items-center">
                      <MessageSquare className="w-4 h-4 text-brand-accent group-hover:rotate-12 transition-transform" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Customer Reviews ({reviews.length})</h4>
                    </div>
                    <div className="flex items-center gap-4">
                      {reviews.length > 0 && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 fill-brand-accent text-brand-accent" />
                          <span className="text-[10px] font-bold text-brand-dark">{averageRating.toFixed(1)}</span>
                        </div>
                      )}
                      {isReviewsOpen ? <ChevronUp className="w-4 h-4 text-brand-dark/40" /> : <ChevronDown className="w-4 h-4 text-brand-dark/40" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isReviewsOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="pt-6 pl-8">
                          {/* Review Form */}
                          <div className="mb-10">
                            {submitSuccess ? (
                              <motion.div 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-4 bg-green-50 border border-green-100 text-green-700 rounded-lg flex items-center gap-3"
                              >
                                <Check className="w-4 h-4" />
                                <span className="text-[10px] font-bold uppercase tracking-widest">Thank you! Your feedback is harvested.</span>
                              </motion.div>
                            ) : (
                              <form onSubmit={handleSubmitReview} className="p-5 border border-brand-border bg-brand-secondary/30 rounded-xl">
                                <h4 className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-dark mb-4">Share your experience</h4>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 block ml-1">Your Name</label>
                                      <input
                                        required
                                        type="text"
                                        placeholder="Artisan Chef"
                                        value={newReview.userName || ''}
                                        onChange={e => setNewReview(prev => ({ ...prev, userName: e.target.value }))}
                                        className="w-full bg-white border border-brand-border px-3 py-2 text-[10px] outline-none focus:border-brand-accent transition-colors"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 block ml-1">Rating</label>
                                      <div className="flex items-center gap-1 bg-white border border-brand-border px-3 py-2 h-[34px]">
                                        {[1, 2, 3, 4, 5].map(star => (
                                          <button
                                            key={star}
                                            type="button"
                                            onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                            className="focus:outline-none hover:scale-110 transition-transform"
                                          >
                                            <Star 
                                              className={`w-3 h-3 ${star <= newReview.rating ? 'fill-brand-accent text-brand-accent' : 'text-brand-dark/20'}`} 
                                            />
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[8px] font-bold uppercase tracking-widest text-brand-dark/40 block ml-1">Your Comment</label>
                                    <textarea
                                      required
                                      placeholder="Tell us about the flavour profile..."
                                      value={newReview.comment || ''}
                                      onChange={e => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                      rows={3}
                                      className="w-full bg-white border border-brand-border p-3 text-[10px] outline-none focus:border-brand-accent resize-none transition-colors"
                                    />
                                  </div>
                                  
                                  {submitError && (
                                    <p className="text-[9px] font-bold text-red-600 uppercase tracking-widest">{submitError}</p>
                                  )}

                                  <button
                                    disabled={isSubmitting}
                                    type="submit"
                                    className="w-full py-3 bg-brand-dark text-white text-[9px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                  >
                                    {isSubmitting ? (
                                      <>
                                        <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Submitting...</span>
                                      </>
                                    ) : (
                                      <>
                                        <MessageSquare className="w-3 h-3" />
                                        <span>Post Review</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                              </form>
                            )}
                          </div>

                          {/* Review List */}
                          <div className="space-y-8">
                            {loadingReviews ? (
                              <div className="space-y-6">
                                {[1, 2].map(i => (
                                  <div key={i} className="animate-pulse space-y-3">
                                    <div className="flex justify-between items-center">
                                      <div className="h-2 w-20 bg-brand-secondary"></div>
                                      <div className="h-2 w-12 bg-brand-secondary"></div>
                                    </div>
                                    <div className="h-10 bg-brand-secondary"></div>
                                  </div>
                                ))}
                              </div>
                            ) : reviews.length > 0 ? (
                              reviews.map(review => (
                                <div key={review.id} className="border-b border-brand-border pb-6 last:border-0 group">
                                  <div className="flex justify-between items-center mb-3">
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center border border-brand-border">
                                        <UserIcon className="w-4 h-4 text-brand-dark/40" />
                                      </div>
                                      <div>
                                        <div className="flex items-center gap-2">
                                          <p className="text-[10px] font-black text-brand-dark uppercase tracking-widest">{review.userName}</p>
                                          {review.isVerified && (
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 bg-brand-accent/10 border border-brand-accent/20 rounded-sm">
                                              <ShieldCheck className="w-2 h-2 text-brand-accent" />
                                              <span className="text-[6px] font-black uppercase text-brand-accent tracking-tighter">Verified Member</span>
                                            </div>
                                          )}
                                        </div>
                                        <p className="text-[8px] text-brand-dark/40 font-bold uppercase tracking-widest">{review.date}</p>
                                      </div>
                                    </div>
                                    <div className="flex gap-0.5">
                                      {Array(5).fill(0).map((_, i) => (
                                        <Star 
                                          key={i} 
                                          className={`w-2.5 h-2.5 ${i < review.rating ? 'fill-brand-accent text-brand-accent' : 'text-brand-border'}`} 
                                        />
                                      ))}
                                    </div>
                                  </div>
                                  <div className="pl-11 pr-4">
                                    <div className="relative">
                                      <span className="absolute -left-4 top-0 text-2xl text-brand-accent/20 font-black leading-none">"</span>
                                      <p className="text-[11px] text-[#5B5550] leading-relaxed italic serif-italic">
                                        {review.comment}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-12 text-center bg-brand-secondary/30 border border-dashed border-brand-border rounded-xl">
                                <MessageSquare className="w-8 h-8 text-brand-dark/10 mx-auto mb-3" />
                                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-[0.2em]">Be the first to leave a thought</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              <div className="mt-auto pt-8 hidden md:flex flex-col gap-4">
                <button 
                  onClick={() => product.stock > 0 && onAddToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`w-full py-4 text-xs font-bold uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors ${
                    product.stock === 0
                      ? 'bg-brand-dark/20 text-brand-dark/40 cursor-not-allowed'
                      : 'bg-brand-dark text-white hover:bg-brand-accent'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {product.stock === 0 ? 'Currently Unavailable' : 'Add to Bag'}
                </button>

                <div className="flex items-center justify-center gap-2 mt-2">
                  <div className="flex gap-1 h-3 items-center">
                    <div className="w-1.5 h-full bg-[#007C59]" />
                    <div className="w-1.5 h-full bg-[#E23D28]" />
                    <div className="w-1.5 h-full bg-[#002395]" />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-dark/40">
                    Proudly Made in South Africa
                  </span>
                </div>

                {/* Social Share */}
                <div className="flex flex-col gap-4 py-8 border-y border-brand-border mt-8">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-dark/40 text-center">Spread the Flavour</span>
                  <div className="grid grid-cols-2 gap-3">
                    <a 
                      href={shareLinks.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 py-3 px-4 border border-brand-border hover:border-brand-dark hover:bg-brand-secondary transition-all text-brand-dark group"
                    >
                      <Facebook className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Facebook</span>
                    </a>
                    <a 
                      href={shareLinks.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 py-3 px-4 border border-brand-border hover:border-brand-dark hover:bg-brand-secondary transition-all text-brand-dark group"
                    >
                      <Twitter className="w-4 h-4 group-hover:text-sky-500 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Twitter</span>
                    </a>
                    <a 
                      href={shareLinks.pinterest} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-3 py-3 px-4 border border-brand-border hover:border-brand-dark hover:bg-brand-secondary transition-all text-brand-dark group"
                    >
                      <Share2 className="w-4 h-4 group-hover:text-red-600 transition-colors" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Pinterest</span>
                    </a>
                    <button 
                      onClick={() => setShowShareCard(true)}
                      className="flex items-center justify-center gap-3 py-3 px-4 border border-brand-accent bg-brand-accent/5 text-brand-accent hover:bg-brand-accent hover:text-white transition-all group"
                    >
                      <Sparkles className="w-4 h-4 group-hover:animate-spin-slow" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Share Card</span>
                    </button>
                    <button 
                      onClick={copyToClipboard}
                      className={`flex items-center justify-center gap-3 py-3 px-4 border transition-all group ${isCopied ? 'border-green-600 bg-green-50 text-green-700' : 'border-brand-border hover:border-brand-dark hover:bg-brand-secondary text-brand-dark'}`}
                    >
                      {isCopied ? <Check className="w-4 h-4" /> : <Link className="w-4 h-4 group-hover:text-brand-accent transition-colors" />}
                      <span className="text-[9px] font-black uppercase tracking-widest">
                        {isCopied ? 'Seeds Synthesized' : 'Copy Link (+5 Seeds)'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Recently Viewed Section */}
              {recentlyViewedProducts.length > 0 && (
                <div className="mt-12 pt-12 border-t border-brand-border -mx-8 md:-mx-12 px-8 md:px-12 pb-12">
                  <div className="flex items-center gap-3 mb-8">
                    <Activity className="w-5 h-5 text-brand-dark" />
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Recently Viewed</h3>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentlyViewedProducts.map(viewedProduct => (
                      <button
                        key={viewedProduct.id}
                        onClick={() => {
                          onProductChange(viewedProduct);
                          if (scrollContainerRef.current) {
                            scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                          }
                        }}
                        className="group text-left"
                      >
                        <div className="aspect-square bg-white border border-brand-border p-4 mb-3 overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                          <img 
                            src={viewedProduct.image} 
                            alt={viewedProduct.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                          />
                        </div>
                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-dark mb-1 line-clamp-1 group-hover:text-brand-accent transition-colors">
                          {viewedProduct.name}
                        </h4>
                        <p className="text-[10px] font-black text-brand-dark opacity-50">{viewedProduct.price}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              </div>

              {/* Sticky Mobile Add to Bag - Only visible on small screens */}
              <div className="md:hidden sticky bottom-0 left-0 w-full p-6 bg-white/90 backdrop-blur-md border-t border-brand-border z-30">
                <button 
                  onClick={() => product.stock > 0 && onAddToCart(product.id)}
                  disabled={product.stock === 0}
                  className={`w-full py-4 text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-colors shadow-2xl ${
                    product.stock === 0
                      ? 'bg-brand-dark/20 text-brand-dark/40 cursor-not-allowed'
                      : 'bg-brand-dark text-white hover:bg-brand-accent'
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  {product.stock === 0 ? 'Out of Stock' : `Add to Bag • ${isWholesale && product.wholesalePrice ? product.wholesalePrice : product.price}`}
                </button>
              </div>

              {/* Related Products Section (Carousel) */}
              {relatedProducts.length > 0 && (
                <div className="mt-6 pt-12 border-t border-brand-border bg-brand-secondary/30 -mx-8 md:-mx-12 px-8 md:px-12 pb-12">
                  <div className="flex items-center gap-3 mb-8 px-0">
                    <ShoppingBag className="w-5 h-5 text-brand-dark" />
                    <h3 className="text-xl font-black text-brand-dark uppercase tracking-tight">Complete the Pairing</h3>
                  </div>
                  
                  <div className="relative group">
                    <div className="flex overflow-x-auto gap-6 pb-6 scrollbar-hide snap-x snap-mandatory">
                      {relatedProducts.map(relProduct => (
                        <div 
                          key={relProduct.id} 
                          className="flex-none w-[180px] snap-start"
                        >
                          <button
                            onClick={() => {
                              onProductChange(relProduct);
                              if (scrollContainerRef.current) {
                                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                              }
                            }}
                            className="group text-left w-full"
                          >
                            <div className="aspect-square bg-white border border-brand-border p-4 mb-3 overflow-hidden relative">
                              <img 
                                src={relProduct.image} 
                                alt={relProduct.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/5 transition-all duration-300" />
                            </div>
                            <h4 className="text-[10px] font-bold uppercase tracking-widest text-brand-dark mb-1 line-clamp-1 group-hover:text-brand-accent transition-colors">
                              {relProduct.name}
                            </h4>
                            <p className="text-[10px] font-black text-brand-dark opacity-50">{relProduct.price}</p>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Back to Top Button */}
              <AnimatePresence>
                {showScrollTop && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 10 }}
                    onClick={scrollToTop}
                    className="sticky bottom-4 right-0 ml-auto z-20 p-3 bg-brand-dark text-white rounded-full shadow-lg hover:bg-brand-accent transition-colors group flex items-center gap-2"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden w-0 group-hover:w-auto">
                      Back to Top
                    </span>
                    <ArrowUp className="w-4 h-4" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Product Share Discovery Card */}
          <AnimatePresence>
            {showShareCard && product && (
              <div className="fixed inset-0 z-[60] flex items-center justify-center px-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowShareCard(false)}
                  className="absolute inset-0 bg-brand-dark/90 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ scale: 0.9, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.9, opacity: 0, y: 20 }}
                  className="relative w-full max-w-lg bg-white overflow-hidden shadow-2xl p-1 bg-[url('https://www.transparenttextures.com/patterns/natural-paper.png')]"
                >
                  <div className="border-[1px] border-brand-dark p-12 text-center relative">
                    <button 
                      onClick={() => setShowShareCard(false)}
                      className="absolute top-4 right-4 p-2 text-brand-dark/20 hover:text-brand-dark transition-colors z-10"
                    >
                      <X className="w-6 h-6" />
                    </button>

                    <div className="absolute top-0 left-0 w-full h-1 bg-brand-dark" />
                    <div className="absolute bottom-0 left-0 w-full h-1 bg-brand-dark" />
                    
                    <div className="flex justify-center mb-8">
                       <div className="w-16 h-16 border-2 border-brand-dark flex items-center justify-center relative">
                          <ShoppingBag className="w-8 h-8 text-brand-dark" />
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-brand-accent animate-ping" />
                       </div>
                    </div>

                    <span className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent mb-6 block">Artisan Product Profile</span>
                    
                    <h2 className="text-4xl font-bold tracking-tighter text-brand-dark mb-6 uppercase leading-none">
                      {product.name}
                    </h2>

                    <div className="w-32 h-[1px] bg-brand-dark/10 mx-auto mb-8" />

                    <div className="flex justify-center gap-2 mb-8">
                      {product.attributes?.slice(0, 3).map((attr, i) => (
                        <span key={i} className="px-3 py-1 bg-brand-dark text-white text-[8px] font-black uppercase tracking-widest">
                          {attr}
                        </span>
                      ))}
                    </div>

                    <p className="text-sm text-[#5B5550] italic serif-italic mb-10 leading-relaxed px-6">
                      "{product.description}"
                    </p>

                    <div className="bg-brand-bg p-8 border border-brand-border mb-10 relative">
                       <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-4 text-[7px] font-black uppercase tracking-[0.3em] text-brand-dark/40">Technical Specs</span>
                       <div className="grid grid-cols-2 gap-y-6 gap-x-12">
                          <div className="text-left">
                            <span className="text-[7px] font-black uppercase tracking-widest text-brand-dark/40 block mb-1">Price Point</span>
                            <span className="text-sm font-black text-brand-dark uppercase tracking-tight">{isWholesale && product.wholesalePrice ? `${product.wholesalePrice} (Stockist)` : product.price}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] font-black uppercase tracking-widest text-brand-dark/40 block mb-1">Category</span>
                            <span className="text-sm font-black text-brand-dark uppercase tracking-tight">{product.category}</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] font-black uppercase tracking-widest text-brand-dark/40 block mb-1">Provenance</span>
                            <span className="text-sm font-black text-brand-dark uppercase tracking-tight">South Africa</span>
                          </div>
                          <div className="text-left">
                            <span className="text-[7px] font-black uppercase tracking-widest text-brand-dark/40 block mb-1">Batch Status</span>
                            <span className="text-[10px] font-black text-brand-accent uppercase tracking-tight">Artisanal Small-Batch</span>
                          </div>
                       </div>
                    </div>

                    <div className="flex flex-col gap-3">
                       <button 
                         onClick={() => {
                            navigator.clipboard.writeText(`The ${product.name} from Mustard Deli is a game changer. Check it out: ${shareUrl}`);
                            const btn = document.activeElement as HTMLElement;
                            if (btn) {
                              const original = btn.innerHTML;
                              btn.innerHTML = "Discovery Logged!";
                              setTimeout(() => { btn.innerHTML = original; }, 2000);
                            }
                         }}
                         className="w-full bg-brand-dark text-white py-4 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
                       >
                         <Share2 className="w-4 h-4" />
                         Share This Profile
                       </button>
                       <button 
                         onClick={() => setShowShareCard(false)}
                         className="w-full bg-brand-bg text-brand-dark/40 py-3 font-black uppercase tracking-[0.2em] text-[8px] hover:text-brand-dark transition-colors"
                       >
                         Dismiss Specification
                       </button>
                    </div>

                    <div className="mt-8 flex justify-center opacity-10">
                       <div className="flex gap-2">
                          {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="w-1 h-1 bg-brand-dark rounded-full" />)}
                       </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </AnimatePresence>
  );
}
