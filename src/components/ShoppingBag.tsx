import { motion, AnimatePresence } from 'motion/react';
import { X, Plus, Minus, ShoppingBag, Trash2, ShieldCheck, RefreshCw, Sparkles } from 'lucide-react';
import { PRODUCTS, Product } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';

interface ShoppingBagProps {
  isOpen: boolean;
  onClose: () => void;
  items: { id: string; quantity: number }[];
  allProducts: Product[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
}

export default function ShoppingBagDrawer({ isOpen, onClose, items, allProducts, onUpdateQuantity, onRemove, onCheckout }: ShoppingBagProps) {
  const { user } = useAuth();
  const { profile } = useNotifications();
  const isWholesale = profile?.role === 'stockist';

  const bagItems = items.map(item => ({
    ...item,
    product: (allProducts.length > 0 ? allProducts : PRODUCTS).find(p => p.id === item.id) as Product
  }));

  const subtotal = bagItems.reduce((acc, item) => {
    const priceStr = (isWholesale && item.product.wholesalePrice) ? item.product.wholesalePrice : item.product.price;
    const price = parseFloat(priceStr.replace('R', ''));
    return acc + (price * item.quantity);
  }, 0);

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-brand-bg border-l border-brand-border z-[101] shadow-2xl flex flex-col"
          >
            <div className="p-8 border-b border-brand-border flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-brand-dark" />
                <h2 className="text-xl font-black uppercase tracking-tight">Your Bag</h2>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-brand-secondary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bagItems.length > 0 && (
              <div className="px-8 py-4 bg-brand-dark/5 border-b border-brand-border">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-brand-dark/60">
                    {subtotal >= 500 ? 'Complimentary Shipping Achieved' : `Spend R${(500 - subtotal).toFixed(2)} more for free shipping`}
                  </span>
                  <span className="text-[9px] font-black text-brand-accent">{Math.min(100, (subtotal / 500) * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1.5 w-full bg-brand-dark/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (subtotal / 500) * 100)}%` }}
                    className={`h-full transition-all duration-1000 ${subtotal >= 500 ? 'bg-green-500' : 'bg-brand-accent'}`}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              {user && items.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-4 bg-brand-accent/5 border border-brand-accent/20 flex items-center gap-4"
                >
                  <div className="w-10 h-10 rounded-full bg-brand-accent/10 flex items-center justify-center shrink-0">
                     <RefreshCw className="w-4 h-4 text-brand-accent animate-spin-slow" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Preserved Basket Sync</p>
                    <p className="text-[8px] text-brand-dark/60 uppercase font-bold tracking-wider leading-relaxed">
                      We've safely stored your selection in the cellar. Bag synced as {user.displayName}.
                    </p>
                  </div>
                </motion.div>
              )}

              {bagItems.length > 0 ? (
                <>
                  <div className="space-y-8">
                    {bagItems.map(item => (
                      <div key={item.id} className="flex gap-6 border-b border-brand-border pb-8 last:border-0">
                        <div className="w-24 h-24 bg-brand-secondary border border-brand-border p-2">
                          <img 
                            src={item.product.image} 
                            alt={item.product.name}
                            className="w-full h-full object-contain"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex justify-between items-start mb-1">
                            <h3 className="text-sm font-bold uppercase tracking-tight">{item.product.name}</h3>
                            <button 
                              onClick={() => onRemove(item.id)}
                              className="text-brand-dark/30 hover:text-brand-accent transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-[10px] uppercase font-bold text-brand-dark/40 mb-4">{item.product.category}</p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center border border-brand-border">
                              <button 
                                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                                className="p-1.5 hover:bg-brand-secondary transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-8 text-center text-[10px] font-black">{item.quantity}</span>
                              <button 
                                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                                className="p-1.5 hover:bg-brand-secondary transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <div className="flex flex-col">
                               <p className={`text-sm font-black ${isWholesale && item.product.wholesalePrice ? 'text-brand-dark/40 text-xs line-through' : 'text-brand-dark'}`}>
                                 {item.product.price}
                               </p>
                               {isWholesale && item.product.wholesalePrice && (
                                 <p className="text-sm font-black text-brand-accent">{item.product.wholesalePrice}</p>
                               )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Intelligent Pairings Section */}
                  <div className="mt-12 pt-12 border-t border-brand-border">
                    <div className="flex items-center gap-2 mb-6">
                      <Sparkles className="w-3.5 h-3.5 text-brand-accent" />
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark">Frequently Paired</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {PRODUCTS.filter(p => !items.find(i => i.id === p.id)).slice(0, 2).map(product => (
                        <div key={product.id} className="group cursor-pointer">
                          <div className="aspect-square bg-brand-secondary border border-brand-border p-3 mb-3 relative overflow-hidden">
                            <img src={product.image} alt={product.name} className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500" />
                            <button 
                              onClick={() => onUpdateQuantity(product.id, 1)}
                              className="absolute inset-0 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Plus className="w-5 h-5 text-white" />
                            </button>
                          </div>
                          <h5 className="text-[9px] font-black uppercase tracking-tight truncate">{product.name}</h5>
                          <p className="text-[9px] font-bold text-brand-accent">{product.price}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-brand-secondary border border-dashed border-brand-border flex items-center justify-center mb-6">
                    <ShoppingBag className="w-6 h-6 text-brand-dark/20" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-2">Your bag is empty</h3>
                  <p className="text-[10px] text-brand-dark/40 uppercase tracking-widest leading-loose">
                    Discover our artisanal collection<br/>and pair your path.
                  </p>
                  <button 
                    onClick={onClose}
                    className="mt-8 px-8 py-3 bg-brand-dark text-white text-[10px] font-bold uppercase tracking-widest hover:bg-brand-accent transition-colors"
                  >
                    Start Shopping
                  </button>
                </div>
              )}
            </div>

            {bagItems.length > 0 && (
              <div className="p-8 bg-brand-secondary border-t border-brand-border">
                <div className="flex justify-between items-center mb-6">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">Subtotal</span>
                  <span className="text-xl font-black text-brand-dark">R{subtotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={onCheckout}
                  className="w-full py-5 bg-brand-dark text-white text-xs font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-all shadow-xl hover:shadow-brand-accent/20"
                >
                  Proceed to Checkout
                </button>
                <p className="text-center mt-4 text-[8px] uppercase tracking-widest text-brand-dark/30">
                  Secure worldwide shipping from Gqeberha
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
