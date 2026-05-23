import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, X, Heart, User as UserIcon, Search, MapPin, BookOpen, Sparkles, Check, ArrowRight, Plus } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import NotificationCenter from './NotificationCenter';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';
import { Product, PRODUCTS, RECIPES, STOCKISTS } from '../constants';
import confetti from 'canvas-confetti';

interface NavigationProps {
  wishlistCount: number;
  bagCount: number;
  onOpenBag: () => void;
  onOpenAuth: () => void;
  onTabChange?: (tab: string) => void;
  allProducts?: Product[];
  onAddToCart?: (productId: string) => void;
}

export default function Navigation({ wishlistCount, bagCount, onOpenBag, onOpenAuth, onTabChange, allProducts, onAddToCart }: NavigationProps) {
  const { user, isAdmin } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current?.focus(), 150);
    }
  }, [isMobileSearchOpen]);

  const handleNavClick = (id: string) => {
    if (onTabChange) {
      if (id === 'admin') {
        onTabChange('admin');
      } else if (id === 'messages') {
        onTabChange('messages');
      } else if (id === 'giveaways') {
        onTabChange('giveaways');
      } else {
        onTabChange('home');
      }
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('search', searchQuery.trim());
      url.searchParams.set('category', 'All');
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('urlchange'));
      
      const el = document.getElementById('shop');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSearchSubmitClick = () => {
    if (searchQuery.trim()) {
      const url = new URL(window.location.href);
      url.searchParams.set('search', searchQuery.trim());
      url.searchParams.set('category', 'All');
      window.history.pushState({}, '', url.toString());
      window.dispatchEvent(new Event('popstate'));
      window.dispatchEvent(new Event('urlchange'));
      
      const el = document.getElementById('shop');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      
      setIsSearchFocused(false);
      setIsMobileSearchOpen(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('product', productId);
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('urlchange'));
    
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleSelectCategory = (category: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('category', category);
    url.searchParams.delete('search');
    window.history.pushState({}, '', url.toString());
    window.dispatchEvent(new Event('popstate'));
    window.dispatchEvent(new Event('urlchange'));
    
    const el = document.getElementById('shop');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleSelectRecipe = (id: string) => {
    const el = document.getElementById('recipes');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  const handleSelectStockist = (id: string) => {
    const el = document.getElementById('locations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    
    setSearchQuery('');
    setIsSearchFocused(false);
    setIsMobileSearchOpen(false);
  };

  const renderSearchResults = () => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return null;

    const matchedProducts = (allProducts || PRODUCTS).filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q) ||
      (p.attributes && p.attributes.some(a => a.toLowerCase().includes(q))) ||
      (p.pairings && p.pairings.some(pair => pair.toLowerCase().includes(q)))
    );

    const matchedCategories = ['Mustard', 'Deli', 'Sugar-Free', 'Chilli'].filter(cat => 
      cat.toLowerCase().includes(q)
    );

    const matchedRecipes = RECIPES.filter(r => 
      r.title.toLowerCase().includes(q) || 
      r.description.toLowerCase().includes(q) ||
      r.mustardUsed.toLowerCase().includes(q)
    );

    const matchedStockists = STOCKISTS.filter(s => 
      s.name.toLowerCase().includes(q) || 
      s.city.toLowerCase().includes(q) || 
      s.province.toLowerCase().includes(q) || 
      s.location.toLowerCase().includes(q)
    );

    const hasResults = matchedProducts.length > 0 || matchedCategories.length > 0 || matchedRecipes.length > 0 || matchedStockists.length > 0;

    if (!hasResults) {
      return (
        <div className="py-8 text-center bg-white">
          <Search className="w-8 h-8 text-brand-dark/15 mx-auto mb-3" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark mb-1">No Matches in our Cellar</p>
          <p className="text-[8px] text-brand-dark/40 font-bold uppercase tracking-widest leading-relaxed">
            Try searching "Apricot", "Chilli", "Whisky", or "Gqeberha".
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-6 text-left">
        <button
          onClick={handleSearchSubmitClick}
          className="w-full flex items-center justify-between p-3 bg-brand-secondary/40 border border-brand-border hover:border-brand-dark transition-colors group/submit text-[9px] font-black uppercase tracking-widest"
        >
          <span>See all pantry matches for "{searchQuery}"</span>
          <ArrowRight className="w-3.5 h-3.5 text-brand-dark group-hover/submit:translate-x-1.5 transition-transform" />
        </button>

        {matchedCategories.length > 0 && (
          <div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-dark/35 block mb-2 border-b border-brand-border/40 pb-1">Stories & Categories</span>
            <div className="flex flex-wrap gap-2 flex-row">
              {matchedCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => handleSelectCategory(cat)}
                  className="px-3 py-1 bg-brand-secondary hover:bg-brand-dark hover:text-white border border-brand-border text-[8px] font-black uppercase tracking-widest rounded-sm transition-all"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {matchedProducts.length > 0 && (
          <div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-dark/35 block mb-2 border-b border-brand-border/40 pb-1">Products ({matchedProducts.length})</span>
            <div className="space-y-3">
              {matchedProducts.slice(0, 4).map(prod => (
                <div 
                  key={prod.id} 
                  onClick={() => handleSelectProduct(prod.id)}
                  className="flex items-center gap-3 p-2 hover:bg-brand-secondary/30 border border-transparent hover:border-brand-border cursor-pointer transition-all rounded"
                >
                  <div className="w-10 h-10 bg-brand-secondary border p-1 rounded-sm shrink-0 flex items-center justify-center">
                    <img src={prod.image} alt={prod.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-tight text-brand-dark truncate leading-tight mb-0.5">{prod.name}</p>
                    <p className="text-[8px] font-bold text-brand-dark/40 uppercase tracking-widest">{prod.category} • {prod.price}</p>
                  </div>
                  {onAddToCart && prod.stock > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(prod.id);
                        confetti({
                          particleCount: 40,
                          spread: 50,
                          origin: { y: 0.8 },
                          colors: ['#D4AF37', '#ffffff']
                        });
                      }}
                      className="p-1 px-2.5 bg-brand-accent hover:bg-brand-dark text-white rounded-sm text-[8px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 shrink-0"
                      title="Quick Add to Bag"
                    >
                      <Plus className="w-2.5 h-2.5" />
                      Add
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedRecipes.length > 0 && (
          <div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-dark/35 block mb-2 border-b border-brand-border/40 pb-1">Kitchen Ideas ({matchedRecipes.length})</span>
            <div className="space-y-2">
              {matchedRecipes.slice(0, 3).map(rec => (
                <div 
                  key={rec.id} 
                  onClick={() => handleSelectRecipe(rec.id)}
                  className="flex items-start gap-3 p-2 hover:bg-brand-secondary/30 border border-transparent hover:border-brand-border cursor-pointer transition-all rounded"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-tight text-brand-dark truncate leading-tight mb-0.5">{rec.title}</p>
                    <p className="text-[8px] text-[#5B5550] tracking-wide line-clamp-1 italic serif-italic">"{rec.description}"</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {matchedStockists.length > 0 && (
          <div>
            <span className="text-[8px] font-black uppercase tracking-[0.3em] text-brand-dark/35 block mb-2 border-b border-brand-border/40 pb-1">Stockists & Grocers ({matchedStockists.length})</span>
            <div className="space-y-2">
              {matchedStockists.slice(0, 3).map(st => (
                <div 
                  key={st.id} 
                  onClick={() => handleSelectStockist(st.id)}
                  className="flex items-start gap-3 p-2 hover:bg-brand-secondary/30 border border-transparent hover:border-brand-border cursor-pointer transition-all rounded"
                >
                  <MapPin className="w-3.5 h-3.5 text-brand-accent shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-tight text-brand-dark truncate leading-tight mb-0.5">{st.name}</p>
                    <p className="text-[8px] text-brand-dark/40 uppercase tracking-widest">{st.location}, {st.city} • {st.province}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-brand-bg/90 backdrop-blur-md border-b border-brand-muted">
      <div className="max-w-7xl mx-auto px-12 h-24 flex items-center justify-between">
        <div className="flex items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex flex-col cursor-pointer shrink-0"
            onClick={() => handleNavClick('home')}
          >
            <span className="text-[10px] uppercase tracking-[0.2em] opacity-50 mb-1">Gqeberha, PE</span>
            <h1 className="text-2xl font-bold tracking-tight uppercase">MUSTARD DELI</h1>
          </motion.div>

          {/* Prominent, Artisanal Search Input (Desktop) */}
          <div ref={searchRef} className="hidden lg:block relative max-w-xs xl:max-w-sm w-full mx-8">
            <form onSubmit={handleSearchSubmit} className="relative group">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                <Search className="w-4 h-4 text-brand-dark/30 group-focus-within:text-brand-accent transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search pantry, recipes, delis..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                className="w-full bg-brand-secondary/40 border border-brand-border py-2.5 pl-10 pr-8 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-brand-accent focus:bg-white transition-all shadow-inner rounded-sm hover:border-brand-dark/30"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-brand-dark/30 hover:text-brand-dark transition-colors"
                  title="Clear Search"
                >
                  <X className="w-3" />
                </button>
              )}
            </form>

            {/* Autocomplete Results Overlay */}
            <AnimatePresence>
              {isSearchFocused && searchQuery.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 15 }}
                  className="absolute top-full left-0 right-0 mt-3 bg-white border border-brand-dark p-6 shadow-[0_24px_48px_-8px_rgba(0,0,0,0.15)] z-[999] max-h-[460px] overflow-y-auto w-[420px] custom-scrollbar"
                >
                  {renderSearchResults()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-12">
          {['Shop', 'Bundles', 'Recipes', 'Apothecary', 'Diary', 'Whats For', 'Moments', 'Locations', 'Our Story', 'Giveaways'].map((item) => {
            const id = item === 'Diary' ? 'apothecary-diary' : item.toLowerCase().replace(' ', '-');
            return (
              <motion.a
                key={item}
                href={`#${id}`}
                whileHover={{ opacity: 0.6 }}
                onClick={() => handleNavClick(id)}
                className="text-sm font-medium tracking-wide uppercase"
              >
                {item}
              </motion.a>
            );
          })}
          
          {isAdmin && (
            <motion.button
              whileHover={{ opacity: 0.6 }}
              onClick={() => handleNavClick('admin')}
              className="text-sm font-black tracking-wide uppercase text-brand-accent bg-brand-accent/10 px-3 py-1 rounded"
            >
              Control
            </motion.button>
          )}

          {user && (
            <motion.button
              whileHover={{ opacity: 0.6 }}
              onClick={() => handleNavClick('messages')}
              className="text-sm font-black tracking-wide uppercase text-brand-dark flex items-center gap-2"
            >
              Dispatches
            </motion.button>
          )}

          <div className="flex items-center gap-8 pl-8 border-l border-brand-border">
            <div className="flex items-center gap-6">
              <NotificationCenter />
              
              <button 
                onClick={onOpenAuth}
                className="flex items-center gap-3 group"
              >
                <div className="w-8 h-8 rounded-full bg-brand-secondary flex items-center justify-center border border-brand-border group-hover:border-brand-dark transition-colors overflow-hidden">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-3.5 h-3.5 text-brand-dark opacity-40 group-hover:opacity-100 transition-opacity" />
                  )}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
                  {user ? 'Account' : 'Sync'}
                </span>
              </button>

              <div className="flex items-center gap-2 group cursor-pointer">
                <div className="relative">
                  <Heart className={`w-4 h-4 transition-colors ${wishlistCount > 0 ? 'fill-brand-accent text-brand-accent' : 'text-brand-dark opacity-40 group-hover:opacity-100'}`} />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 bg-brand-dark text-white text-[8px] font-black rounded-full flex items-center justify-center">
                      {wishlistCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest hidden lg:block">Saved</span>
              </div>
              <div className="relative flex items-center gap-3">
                <span className={`w-2 h-2 bg-brand-accent rounded-full ${bagCount > 0 ? 'animate-pulse' : 'opacity-20'}`}></span>
                <button 
                  onClick={onOpenBag}
                  className="text-[11px] font-black tracking-[0.2em] uppercase hover:text-brand-accent transition-colors flex items-center gap-2"
                >
                  BAG
                  {bagCount > 0 && (
                    <span className="text-brand-accent">({bagCount})</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="md:hidden flex items-center gap-6">
          {/* Mobile Search Trigger Icon */}
          <button 
            onClick={() => setIsMobileSearchOpen(true)}
            className="p-2 border border-brand-border hover:border-brand-accent hover:text-brand-accent transition-colors"
            aria-label="Search Pantry"
          >
            <Search className="w-5 h-5 text-brand-dark" />
          </button>

          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 border border-brand-border"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          
          <AnimatePresence>
            {isMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed top-24 left-0 w-full bg-white border-b border-brand-border p-8 z-[60] shadow-2xl"
              >
                <div className="flex flex-col gap-6">
                  {['Shop', 'Bundles', 'Recipes', 'Apothecary', 'Diary', 'Whats For', 'Moments', 'Locations', 'Our Story', 'Giveaways'].map((item) => {
                    const id = item === 'Diary' ? 'apothecary-diary' : item.toLowerCase().replace(' ', '-');
                    return (
                      <a
                        key={item}
                        href={`#${id}`}
                        onClick={() => {
                          handleNavClick(id);
                          setIsMenuOpen(false);
                        }}
                        className="text-lg font-black tracking-tight uppercase border-b border-brand-border pb-4 last:border-0"
                      >
                        {item}
                      </a>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isMobileSearchOpen && (
              <motion.div
                ref={mobileSearchRef}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="fixed inset-x-0 top-0 bg-white border-b border-brand-border min-h-screen z-[100] p-8 overflow-y-auto flex flex-col"
              >
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-brand-border shrink-0">
                  <span className="text-[10px] uppercase font-black tracking-widest text-brand-dark/40">Searching Pantry</span>
                  <button 
                    onClick={() => setIsMobileSearchOpen(false)}
                    className="p-2 border border-brand-border flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-dark"
                  >
                    <span>Close</span>
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <form onSubmit={handleSearchSubmit} className="relative group mb-8 shrink-0">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
                    <Search className="w-5 h-5 text-brand-dark/30 group-focus-within:text-brand-accent transition-colors" />
                  </div>
                  <input
                    ref={mobileSearchInputRef}
                    type="text"
                    placeholder="Search name, recipe, stockist..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-brand-secondary/40 border border-brand-border py-4 pl-12 pr-12 text-xs font-black uppercase tracking-[0.2em] outline-none focus:border-brand-accent focus:bg-white transition-all shadow-inner rounded-sm"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-brand-dark/30 hover:text-brand-dark"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </form>

                <div className="flex-1 overflow-y-auto">
                  {searchQuery.length > 0 ? (
                    renderSearchResults()
                  ) : (
                    <div className="space-y-6">
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-dark/30">Suggested Searches</p>
                      <div className="flex flex-wrap gap-2 flex-row">
                        {['Apricot', 'Reaper', 'Honey', 'Dijon', 'Whisky', 'Chilli', 'Gherkins', 'Cape Town', 'Gqeberha'].map(sug => (
                          <button
                            key={sug}
                            onClick={() => {
                              setSearchQuery(sug);
                              mobileSearchInputRef.current?.focus();
                            }}
                            className="px-4 py-2 bg-brand-secondary border border-brand-border text-[9px] font-black uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-colors"
                          >
                            {sug}
                          </button>
                        ))}
                      </div>
                      
                      <div className="pt-8 border-t border-brand-border">
                        <p className="text-[9px] font-black uppercase tracking-[0.3em] text-brand-dark/30 mb-4">Quick Links</p>
                        <div className="grid grid-cols-2 gap-4">
                          {['Shop', 'Recipes', 'Locations'].map(link => (
                            <button
                              key={link}
                              onClick={() => {
                                handleNavClick(link.toLowerCase());
                                setIsMobileSearchOpen(false);
                              }}
                              className="p-4 bg-brand-secondary/40 border border-brand-border hover:border-brand-dark text-[10px] font-black uppercase tracking-[0.2em] text-left"
                            >
                              {link}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <NotificationCenter />
          <button 
            className="relative"
            onClick={onOpenBag}
          >
            <ShoppingBag className="w-5 h-5 text-brand-dark" />
            {bagCount > 0 && (
              <span className="absolute -top-2 -right-2 w-4 h-4 bg-brand-accent text-white text-[8px] font-black rounded-full flex items-center justify-center">
                {bagCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </nav>
  );
}
