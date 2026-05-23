import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Plus, ArrowRight, Package, RefreshCw } from 'lucide-react';
import { PRODUCTS, Product } from '../constants';
import { fetchWithRetry } from '../lib/fetchUtils';

interface BundleBuilderProps {
  onAddToCart: (productId: string, quantity?: number) => void;
}

export default function BundleBuilder({ onAddToCart }: BundleBuilderProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedItems, setSelectedItems] = useState<Product[]>([]);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [giftNote, setGiftNote] = useState('');
  const [isGiftNoteOpen, setIsGiftNoteOpen] = useState(false);
  
  useEffect(() => {
    fetchWithRetry('/api/products')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const merged = data.map(apiProduct => {
            const local = PRODUCTS.find(p => p.id === apiProduct.id) ||
                         PRODUCTS.find(p => apiProduct.name.toLowerCase().includes(p.name.toLowerCase()));
            return {
              ...apiProduct,
              pairings: local?.pairings || [],
              attributes: local?.attributes || apiProduct.attributes || [],
              nutrition: local?.nutrition || { calories: 'N/A', fat: 'N/A', sugar: 'N/A', protein: 'N/A' }
            };
          });
          setProducts(merged);
        } else {
          setProducts(PRODUCTS);
        }
      })
      .catch(() => setProducts(PRODUCTS))
      .finally(() => setIsLoading(false));
  }, []);
  
  const handleSelect = (product: Product, slotIndex: number) => {
    setSelectedItems(prev => {
      const newItems = [...prev];
      newItems[slotIndex] = product;
      return newItems;
    });
    setActiveSlot(null);
  };

  const subtotal = selectedItems.filter(Boolean).reduce((acc, p) => {
    const priceNum = parseFloat(p.price.replace('R', ''));
    return acc + (isNaN(priceNum) ? 0 : priceNum);
  }, 0);
  
  const bundlePrice = subtotal > 0 ? (subtotal + 15).toFixed(2) : "0.00";

  const handleAddBundle = () => {
    const items = selectedItems.filter(Boolean);
    if (items.length === 2) {
      // Add individual items
      items.forEach(p => onAddToCart(p.id, 1));
      // Add the cardboard gift box
      onAddToCart('13', 1);
      
      setSelectedItems([]);
      setGiftNote('');
      setIsGiftNoteOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <section className="py-32 px-12 bg-white border-t border-brand-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div>
            <span className="text-brand-accent font-bold text-xs uppercase tracking-[0.3em] mb-4 block">Personalized Gifting</span>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-brand-dark uppercase mb-8 leading-[0.9]">
              The <br/><span className="serif-italic lowercase text-brand-accent">2 Product</span> Gift Pack.
            </h2>
            <p className="text-[#5B5550] text-lg max-w-md leading-relaxed mb-12 italic serif-italic">
              "Create the ultimate pairing. Any two jars, one premium cardboard gift box, and a personalized note for someone special."
            </p>

            <div className="space-y-6 mb-12">
              <div className="flex items-center gap-4 group">
                <div className={`w-10 h-10 border flex items-center justify-center transition-colors ${selectedItems[0] ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-border'}`}>
                  {selectedItems[0] ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">1</span>}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Primary Selection</p>
              </div>
              <div className="flex items-center gap-4 group">
                <div className={`w-10 h-10 border flex items-center justify-center transition-colors ${selectedItems[1] ? 'bg-brand-dark text-white border-brand-dark' : 'border-brand-border'}`}>
                  {selectedItems[1] ? <Check className="w-5 h-5" /> : <span className="text-xs font-bold">2</span>}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-dark">Companion Flavour</p>
              </div>
            </div>

            {selectedItems.filter(Boolean).length === 2 && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mb-12 border-l-2 border-brand-accent pl-8"
              >
                <button 
                  onClick={() => setIsGiftNoteOpen(!isGiftNoteOpen)}
                  className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-accent mb-4 hover:text-brand-dark transition-colors"
                >
                  <Package className="w-3.5 h-3.5" />
                  {isGiftNoteOpen ? 'Remove Gift Note' : 'Add Personalized Gift Note'}
                </button>
                {isGiftNoteOpen && (
                  <textarea
                    value={giftNote || ''}
                    onChange={(e) => setGiftNote(e.target.value)}
                    placeholder="Write your artisanal message here..."
                    className="w-full bg-brand-secondary/30 border border-brand-border p-4 text-[11px] font-medium tracking-wide focus:outline-none focus:border-brand-dark/50 min-h-[100px] resize-none"
                    maxLength={250}
                  />
                )}
              </motion.div>
            )}

            <div className="flex items-center gap-6 p-8 bg-brand-secondary/50 border border-brand-border">
               <div className="w-16 h-16 bg-white border border-brand-border flex items-center justify-center">
                 <Package className="w-6 h-6 text-brand-dark" />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-dark/40 mb-1">2 Product Pack (Items + R15 Box)</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black">R{bundlePrice}</span>
                  </div>
               </div>
            </div>
          </div>

          <div className="relative">
             {isLoading ? (
               <div className="grid grid-cols-2 gap-6">
                 {[0, 1].map(i => (
                   <div key={i} className="aspect-[4/5] bg-brand-secondary/30 animate-pulse border border-brand-border" />
                 ))}
               </div>
             ) : (
               <div className="grid grid-cols-2 gap-6">
                 {[0, 1].map((index) => (
                   <div key={index} className="relative">
                     <button
                       onClick={() => setActiveSlot(activeSlot === index ? null : index)}
                       className={`w-full aspect-[4/5] border-2 border-dashed flex flex-col items-center justify-center p-6 transition-all relative overflow-hidden group ${
                         selectedItems[index] 
                           ? 'border-brand-dark bg-brand-secondary/10' 
                           : 'border-brand-border hover:border-brand-dark bg-white'
                       }`}
                     >
                       {selectedItems[index] ? (
                         <>
                           <div className="w-full flex-1 mb-4 min-h-0 relative">
                             <img 
                               src={selectedItems[index].image} 
                               alt={selectedItems[index].name}
                               className="w-full h-full object-contain"
                               referrerPolicy="no-referrer"
                             />
                           </div>
                           <div className="text-center">
                             <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-1 leading-tight">{selectedItems[index].name}</h3>
                             <p className="text-[8px] font-bold text-brand-accent uppercase tracking-widest">Change Choice</p>
                           </div>
                         </>
                       ) : (
                         <>
                           <div className="w-16 h-16 rounded-full border-2 border-brand-border flex items-center justify-center mb-4 group-hover:bg-brand-dark group-hover:text-white transition-all shadow-inner">
                             <Plus className="w-6 h-6" />
                           </div>
                           <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark/40">Select Item {index + 1}</p>
                         </>
                       )}
                     </button>
   
                     <AnimatePresence>
                       {activeSlot === index && (
                         <motion.div
                           initial={{ opacity: 0, y: 10 }}
                           animate={{ opacity: 1, y: 0 }}
                           exit={{ opacity: 0, y: 10 }}
                           className="absolute inset-0 z-30 bg-white border-2 border-brand-dark shadow-2xl overflow-y-auto custom-scrollbar flex flex-col"
                         >
                           <div className="p-4 border-b border-brand-border flex justify-between items-center sticky top-0 bg-white z-10 backdrop-blur-md bg-white/90">
                             <span className="text-[10px] font-black uppercase tracking-widest">Full Pantry</span>
                             <button onClick={() => setActiveSlot(null)} className="text-brand-dark/30 hover:text-brand-dark transition-colors p-1">
                               <Plus className="w-4 h-4 rotate-45" />
                             </button>
                           </div>
                           <div className="p-2 space-y-1">
                             {products.map((product) => (
                               <button
                                 key={product.id}
                                 onClick={() => handleSelect(product, index)}
                                 className={`w-full flex items-center gap-3 p-2 hover:bg-brand-secondary text-left transition-all border border-transparent rounded-sm ${selectedItems[index]?.id === product.id ? 'bg-brand-secondary border-brand-border' : ''}`}
                               >
                                 <div className="w-12 h-12 bg-white border border-brand-border p-1 shadow-sm overflow-hidden">
                                   <img 
                                     src={product.image} 
                                     alt={product.name}
                                     className="w-full h-full object-contain" 
                                     referrerPolicy="no-referrer" 
                                   />
                                 </div>
                                 <div className="flex-1 min-w-0">
                                   <p className="text-[9px] font-black uppercase tracking-tight leading-none mb-1 truncate">{product.name}</p>
                                   <p className="text-[8px] font-bold text-brand-dark/40 uppercase tracking-tighter">{product.category} • {product.price}</p>
                                 </div>
                                 {selectedItems[index]?.id === product.id && (
                                   <Check className="w-3 h-3 text-brand-accent flex-shrink-0" />
                                 )}
                               </button>
                             ))}
                           </div>
                         </motion.div>
                       )}
                     </AnimatePresence>
                   </div>
                 ))}
               </div>
             )}

             {/* Sticky Bundle Action */}
             <AnimatePresence>
               {selectedItems.filter(Boolean).length === 2 && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-full z-20 px-6"
                 >
                   <button 
                     onClick={handleAddBundle}
                     className="w-full py-6 bg-brand-dark text-white flex items-center justify-center gap-4 group shadow-2xl hover:bg-brand-accent transition-all"
                   >
                     <ShoppingBag className="w-4 h-4" />
                     <span className="text-xs font-black uppercase tracking-[0.3em]">Add Gift Pack to Bag</span>
                     <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                   </button>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
