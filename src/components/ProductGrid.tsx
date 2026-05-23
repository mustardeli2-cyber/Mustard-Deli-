import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Product, PRODUCTS } from '../constants';
import confetti from 'canvas-confetti';
import { Eye, Terminal, ArrowRight, Heart, Search, X, Lock, Sparkles, Trophy, Share2, Rotate3d } from 'lucide-react';
import ProductModal from './ProductModal';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import { fetchWithRetry } from '../lib/fetchUtils';

interface ProductGridProps {
  wishlist: string[];
  onToggleWishlist: (productId: string) => void;
  onAddToCart: (productId: string) => void;
  onCategoryChange?: (category: string) => void;
  allProducts?: Product[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

export default function ProductGrid({ wishlist, onToggleWishlist, onAddToCart, onCategoryChange, allProducts, isLoading, error, onRefresh }: ProductGridProps) {
  const { user } = useAuth();
  const { earnPoints, profile } = useNotifications();
  const [products, setProducts] = useState<Product[]>(allProducts || []);
  const isWholesale = profile?.role === 'stockist';
  const loading = isLoading !== undefined ? isLoading : (!allProducts || allProducts.length === 0);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('category') || 'All';
    }
    return 'All';
  });
  const [searchQuery, setSearchQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('search') || '';
    }
    return '';
  });

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      setProducts(allProducts);
    }
  }, [allProducts]);

  useEffect(() => {
    const handleSyncUrl = () => {
      const urlParams = new URLSearchParams(window.location.search);
      
      // Selected product modal sync
      const productId = urlParams.get('product');
      if (productId) {
        const product = products.find(p => p.id === productId);
        if (product) {
          setSelectedProduct(product);
          setIsModalOpen(true);
        }
      } else {
        setIsModalOpen(false);
      }

      // Category sync
      const categoryParam = urlParams.get('category');
      if (categoryParam) {
        setActiveCategory(categoryParam);
      }

      // Search query sync
      const searchParam = urlParams.get('search');
      if (searchParam !== null) {
        setSearchQuery(searchParam);
      }
    };

    if (!loading && products.length > 0) {
      handleSyncUrl();
    }

    window.addEventListener('popstate', handleSyncUrl);
    window.addEventListener('urlchange', handleSyncUrl);
    return () => {
      window.removeEventListener('popstate', handleSyncUrl);
      window.removeEventListener('urlchange', handleSyncUrl);
    };
  }, [loading, products]);

  useEffect(() => {
    onCategoryChange?.(activeCategory);
  }, [activeCategory, onCategoryChange]);

  const categories = ['All', ...new Set(products.map(p => p.category))];

  const openQuickView = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleReviewSubmitted = (productId: string, newRating: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const currentCount = p.reviewsCount || 0;
        const currentRating = p.rating || 0;
        const nextCount = currentCount + 1;
        const nextRating = ((currentRating * currentCount) + newRating) / nextCount;
        
        const updatedProduct = {
          ...p,
          reviewsCount: nextCount,
          rating: nextRating
        };
        
        // Also update selected product if it's the one being reviewed
        if (selectedProduct?.id === productId) {
          setSelectedProduct(updatedProduct);
        }
        
        return updatedProduct;
      }
      return p;
    }));
  };

  const displayProducts = showAll ? filteredProducts : filteredProducts.slice(0, 8);

  return (
    <section id="shop" className="py-32 px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
          <div>
            <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-4 block">Seasonal Selection</span>
            <hr className="w-12 border-brand-accent mb-6" />
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-brand-dark leading-tight uppercase">
              The <span className="serif-italic lowercase">Pantry</span> Essentials
            </h2>
          </div>
          <div className="flex flex-col items-start md:items-end">
            <p className="text-[#5B5550] max-w-sm mb-1 text-sm leading-relaxed text-left md:text-right">
              Honest ingredients, slow methods, and bold flavors. Our mustards are handcrafted 
              using non-GMO seeds and local Cape produce.
            </p>
            {error && (
              <button 
                onClick={onRefresh}
                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-brand-dark transition-colors border-b border-brand-accent pb-1"
              >
                <div className={`${loading ? 'animate-spin' : ''}`}>
                  <Rotate3d className="w-3.5 h-3.5" />
                </div>
                {loading ? 'Fetching...' : 'Refresh Flavours'}
              </button>
            )}
          </div>
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 mb-16">
          <div className="flex items-center gap-3 overflow-x-auto pb-4 lg:pb-0 no-scrollbar -mx-12 px-12 lg:mx-0 lg:px-0 lg:flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setShowAll(false);
                }}
                className={`px-6 py-2 text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                  activeCategory === cat 
                    ? 'bg-brand-dark text-white border-brand-dark' 
                    : 'bg-white text-brand-dark border-brand-border hover:border-brand-dark'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative max-w-md w-full lg:w-96 group">
            <div className="absolute -top-8 right-0">
              <p className="text-[9px] font-black text-brand-dark/30 uppercase tracking-[0.2em]">
                {filteredProducts.length} Blends Available
              </p>
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
              <Search className="w-4 h-4 text-brand-dark/30 group-focus-within:text-brand-accent transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search by name, profile or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-brand-secondary/30 border border-brand-border p-4 pl-12 text-[11px] font-bold uppercase tracking-[0.15em] outline-none focus:border-brand-accent focus:bg-white focus:ring-0 transition-all shadow-sm group-hover:border-brand-dark/20"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-brand-secondary rounded-full transition-colors"
                title="Clear global search"
              >
                <X className="w-3.5 h-3.5 text-brand-dark/40 hover:text-brand-dark transition-colors" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-12 mb-20">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="aspect-square bg-brand-secondary mb-4"></div>
                <div className="h-4 bg-brand-secondary w-3/4 mb-2"></div>
                <div className="h-4 bg-brand-secondary w-1/2"></div>
              </div>
            ))
          ) : filteredProducts.length > 0 ? (
            displayProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ 
                  opacity: { delay: idx * 0.05 },
                  y: { duration: 0.3, ease: 'easeOut' },
                  scale: { duration: 0.3, ease: 'easeOut' }
                }}
                viewport={{ once: true }}
                className="group cursor-pointer p-4 -m-4 border border-transparent hover:border-brand-accent/20 hover:shadow-[0_20px_50px_rgba(0,0,0,0.05)] transition-all duration-300 rounded-lg"
              >
                <div className="relative aspect-[1/1] overflow-hidden mb-6 bg-brand-secondary p-8 border border-brand-border group-hover:border-brand-accent/30 transition-colors shadow-inner">
                  {/* Golden Glow Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-brand-accent/5 via-transparent to-brand-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                  
                  {product.stock < 15 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-brand-dark/90 backdrop-blur-sm px-2 py-1 border border-brand-accent/30 shadow-xl overflow-hidden group/rarity">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/rarity:translate-x-full transition-transform duration-1000" />
                      <Sparkles className="w-2.5 h-2.5 text-brand-accent animate-pulse" />
                      <span className="text-[7px] font-black uppercase tracking-[0.2em] text-white">Golden Batch</span>
                    </div>
                  )}

                  {product.awards && product.awards.length > 0 && (
                    <div className="absolute top-4 right-14 z-10 flex items-center justify-center w-8 h-8 bg-brand-accent rounded-full shadow-lg border border-white/20">
                      <Trophy className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-brand-dark/0 group-hover:bg-brand-dark/80 backdrop-blur-sm transition-all duration-300 flex flex-col items-center justify-center gap-6 opacity-0 group-hover:opacity-100 p-6 text-center">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 w-full space-y-4">
                      {/* Traits */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent mb-2">Artisanal Profile</p>
                        <div className="flex flex-wrap justify-center gap-1.5">
                          {product.attributes?.slice(0, 2).map((attr, i) => (
                            <span key={i} className="px-2 py-1 bg-white/10 text-white text-[8px] font-bold uppercase tracking-widest border border-white/20">
                              {attr}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pairings */}
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-accent mb-2">Taste Pairing</p>
                        <p className="text-[9px] font-bold text-white/70 tracking-widest uppercase line-clamp-2 italic">
                          {product.pairings?.slice(0, 2).join(' • ')}
                        </p>
                      </div>

                      {product.isMemberOnly && !user && (
                         <div className="py-3 px-4 border border-brand-accent/30 bg-brand-accent/5 flex items-center justify-center gap-2">
                           <Lock className="w-3 h-3 text-brand-accent" />
                           <span className="text-[8px] font-black uppercase tracking-widest text-brand-accent">Exclusive Item</span>
                         </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const shareUrl = `${window.location.origin}?product=${product.id}`;
                            const shareData = {
                              title: `Mustard Deli | ${product.name}`,
                              text: product.description,
                              url: shareUrl,
                            };
                            if (navigator.share) {
                              navigator.share(shareData)
                                .then(() => earnPoints(5))
                                .catch(err => console.log('Error sharing:', err));
                            } else {
                              navigator.clipboard.writeText(shareUrl);
                              earnPoints(5);
                              alert('Product link copied! 5 Seeds added to your profile.');
                            }
                          }}
                          className="w-10 h-10 bg-white/20 text-white flex items-center justify-center hover:bg-brand-accent transition-all duration-300 transform hover:scale-110"
                          title="Share Product (+5 Seeds)"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.isMemberOnly && !user) return;
                            openQuickView(product);
                          }}
                          className={`w-12 h-12 bg-white text-brand-dark flex items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-xl ${product.isMemberOnly && !user ? 'opacity-20 cursor-not-allowed' : 'hover:bg-brand-accent'}`}
                          title={product.isMemberOnly && !user ? "Member Sync Required" : "Detailed View"}
                        >
                          {product.isMemberOnly && !user ? <Lock className="w-4 h-4" /> : <Eye className="w-5 h-5" />}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (product.stock > 0 && !(product.isMemberOnly && !user)) {
                              onAddToCart(product.id);
                              confetti({
                                particleCount: 40,
                                spread: 50,
                                origin: { y: 0.8 },
                                colors: ['#D4AF37', '#ffffff']
                              });
                            }
                          }}
                          disabled={product.stock === 0 || (product.isMemberOnly && !user)}
                          className={`flex-1 h-12 text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 transform active:scale-95 shadow-xl shadow-brand-dark/20 ${
                            product.stock === 0 || (product.isMemberOnly && !user)
                              ? 'bg-white/20 text-white/40 cursor-not-allowed' 
                              : 'bg-brand-accent text-white hover:bg-white hover:text-brand-dark'
                          }`}
                        >
                          {product.isMemberOnly && !user ? 'SYNC TO BUY' : product.stock === 0 ? 'Closed' : 'Add to Bag'}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <span className="px-3 py-1 bg-white text-brand-dark text-[10px] font-bold uppercase tracking-widest border border-brand-border shadow-sm">
                      {product.category}
                    </span>
                    {product.isBestseller && (
                      <span className="px-3 py-1 bg-brand-dark text-white text-[9px] font-black uppercase tracking-widest border border-brand-accent/50 shadow-lg flex items-center gap-1.5">
                        <Trophy className="w-2.5 h-2.5 text-brand-accent" />
                        Bestseller
                      </span>
                    )}
                    {product.stock === 0 ? (
                      <span className="px-3 py-1 bg-red-50 text-red-600 text-[9px] font-black uppercase tracking-widest border border-red-100 shadow-sm flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-red-600 rounded-full" />
                        Out of Stock
                      </span>
                    ) : product.stock < 5 ? (
                      <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[9px] font-black uppercase tracking-widest border border-amber-100 shadow-sm flex items-center gap-1.5 animate-pulse">
                        <span className="w-1 h-1 bg-amber-600 rounded-full" />
                        Low Stock
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-green-50 text-green-600 text-[9px] font-black uppercase tracking-widest border border-green-100 shadow-sm flex items-center gap-1.5">
                        <span className="w-1 h-1 bg-green-600 rounded-full" />
                        In Stock
                      </span>
                    )}
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWishlist(product.id);
                    }}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-white border border-brand-border flex items-center justify-center transition-all group/heart"
                  >
                    <Heart 
                      className={`w-3.5 h-3.5 transition-colors ${
                        wishlist.includes(product.id) 
                          ? 'fill-brand-accent text-brand-accent' 
                          : 'text-brand-dark opacity-40 group-hover/heart:opacity-100'
                      }`} 
                    />
                  </motion.button>
                </div>
                
                <h3 className="text-lg font-bold tracking-tight text-brand-dark mb-1 uppercase line-clamp-1">{product.name}</h3>
                
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg 
                        key={i} 
                        className={`w-2.5 h-2.5 ${i < Math.floor(product.rating || 0) ? 'text-brand-accent' : 'text-gray-300'}`} 
                        fill="currentColor" 
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-[9px] font-bold text-brand-dark/40 uppercase tracking-widest">{product.reviewsCount} Reviews</span>
                </div>

                {product.attributes && product.attributes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {product.attributes.map(attr => (
                      <span 
                        key={attr}
                        className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 border ${
                          attr === 'New Arrival' 
                            ? 'bg-brand-accent/5 border-brand-accent text-brand-accent' 
                            : 'bg-brand-secondary border-brand-border text-brand-dark/50'
                        }`}
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[#5B5550] text-xs mb-4 line-clamp-1 italic serif-italic">"{product.description}"</p>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className={`text-xl font-black ${isWholesale && product.wholesalePrice ? 'text-brand-dark/40 text-sm line-through' : 'text-brand-dark'}`}>
                      {product.price}
                    </span>
                    {isWholesale && product.wholesalePrice && (
                      <div className="flex items-center gap-2">
                         <span className="text-xl font-black text-brand-accent">{product.wholesalePrice}</span>
                         <span className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-brand-accent text-white">Stockist</span>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => openQuickView(product)}
                    className="text-[10px] font-bold uppercase tracking-widest text-[#5B5550] hover:text-brand-accent transition-colors underline underline-offset-4"
                  >
                    Quick View
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-24 text-center border border-dashed border-brand-border bg-brand-secondary/20 rounded-2xl">
              <div className="max-w-xs mx-auto">
                <Search className="w-8 h-8 text-brand-dark/10 mx-auto mb-4" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand-dark/60 mb-2">No matches found</p>
                <p className="text-xs text-[#5B5550] mb-8 italic">We couldn't find any products matching "{searchQuery}" in our {activeCategory !== 'All' ? activeCategory : 'pantry'}.</p>
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setActiveCategory('All');
                  }}
                  className="px-8 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all duration-300"
                >
                  Clear all filters
                </button>
              </div>
            </div>
          )}
        </div>

        {!loading && filteredProducts.length > 8 && !showAll && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => setShowAll(true)}
              className="px-12 py-6 border border-brand-dark text-brand-dark text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-secondary transition-all duration-300"
            >
              View All {activeCategory === 'All' ? 'Products' : activeCategory}
            </button>
          </div>
        )}

        <div className="flex justify-center mt-12 gap-8 flex-col sm:flex-row">
          <a 
            href="https://mustardeli.co.za/shop/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center justify-center gap-4 px-12 py-6 bg-brand-dark text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-all duration-300"
          >
            Shop Online at WooCommerce
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-2" />
          </a>
        </div>
      </div>

      <ProductModal 
        product={selectedProduct} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        allProducts={products}
        onProductChange={(product) => setSelectedProduct(product)}
        isWishlisted={selectedProduct ? wishlist.includes(selectedProduct.id) : false}
        onToggleWishlist={onToggleWishlist}
        onAddToCart={onAddToCart}
        onReviewSubmitted={handleReviewSubmitted}
      />
    </section>
  );
}
