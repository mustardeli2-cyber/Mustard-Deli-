import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, ChevronLeft, CreditCard, Truck, Receipt, CheckCircle2, ShieldCheck, Share2 } from 'lucide-react';
import { PRODUCTS, Product } from '../constants';
import { useNotifications } from '../contexts/NotificationContext';

interface CheckoutProps {
  isOpen: boolean;
  onClose: () => void;
  items: { id: string; quantity: number }[];
  allProducts: Product[];
  onComplete: () => void;
  onAddToCart: (productId: string) => void;
}

type CheckoutStep = 'summary' | 'shipping' | 'payment' | 'success';

export default function Checkout({ isOpen, onClose, items, allProducts, onComplete, onAddToCart }: CheckoutProps) {
  const { earnPoints, profile } = useNotifications();
  const isWholesale = profile?.role === 'stockist';
  const [step, setStep] = useState<CheckoutStep>('summary');
  const [promoCode, setPromoCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const bagItems = items.map(item => ({
    ...item,
    product: (allProducts.length > 0 ? allProducts : PRODUCTS).find(p => p.id === item.id) as Product
  }));

  const subtotal = bagItems.reduce((acc, item) => {
    const priceStr = (isWholesale && item.product.wholesalePrice) ? item.product.wholesalePrice : item.product.price;
    const price = parseFloat(priceStr.replace('R', ''));
    return acc + (price * item.quantity);
  }, 0);

  const shipping = subtotal > 500 ? 0 : 75;
  const discountAmount = subtotal * appliedDiscount;
  const total = subtotal - discountAmount + shipping;

  const handleApplyPromo = () => {
    const coupon = profile?.coupons?.find(c => c.code.toUpperCase() === promoCode.toUpperCase());
    if (coupon) {
      const discountValue = parseInt(coupon.discount) / 100;
      setAppliedDiscount(discountValue);
    } else {
      alert('Invalid or expired lab formula code.');
    }
  };

  const handleNext = () => {
    if (step === 'summary') setStep('shipping');
    else if (step === 'shipping') setStep('payment');
    else if (step === 'payment') {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setStep('success');
      }, 2000);
    }
  };

  const handleBack = () => {
    if (step === 'shipping') setStep('summary');
    else if (step === 'payment') setStep('shipping');
  };

  const steps = [
    { id: 'summary', icon: Receipt, label: 'Summary' },
    { id: 'shipping', icon: Truck, label: 'Shipping' },
    { id: 'payment', icon: CreditCard, label: 'Payment' }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-8">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-dark/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-brand-bg shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] flex flex-col md:flex-row overflow-hidden min-h-[600px]"
      >
        {/* Left Side: Steps & Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col">
          {step !== 'success' && (
            <>
              <div className="flex items-center justify-between mb-12">
                <div className="flex gap-8">
                  {steps.map((s, idx) => (
                    <div 
                      key={s.id} 
                      className={`flex items-center gap-3 transition-opacity ${
                        steps.findIndex(curr => curr.id === step) >= idx ? 'opacity-100' : 'opacity-30'
                      }`}
                    >
                      <div className={`w-6 h-6 border flex items-center justify-center text-[10px] font-black ${
                        step === s.id ? 'border-brand-accent bg-brand-accent text-white' : 'border-brand-dark text-brand-dark'
                      }`}>
                        {idx + 1}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">{s.label}</span>
                    </div>
                  ))}
                </div>
                <button onClick={onClose} className="p-2 hover:bg-brand-secondary">
                  <X className="w-5 h-5 text-brand-dark" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-4 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {step === 'summary' && (
                    <motion.div
                      key="summary"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Review Batch</h2>
                        <p className="text-xs text-brand-dark/40 uppercase font-bold tracking-widest">
                          Finalize your selection before sealing the crate.
                        </p>
                      </div>

                      <div className="space-y-4">
                        {bagItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center py-4 border-b border-brand-border">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-brand-secondary border p-1 shrink-0">
                                <img src={item.product.image} alt={item.product.name} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <h4 className="text-xs font-bold uppercase">{item.product.name}</h4>
                                <p className="text-[10px] text-brand-dark/40 uppercase font-black">Qty: {item.quantity}</p>
                              </div>
                            </div>
                            <span className="text-xs font-black">R{((isWholesale && item.product.wholesalePrice ? parseFloat(item.product.wholesalePrice.replace('R', '')) : parseFloat(item.product.price.replace('R', ''))) * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div className="pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-3 block">Frequently Paired</label>
                        <div className="grid grid-cols-2 gap-4">
                          {PRODUCTS.slice(4, 6).map(product => (
                            <div key={product.id} className="p-3 border border-brand-border bg-white flex items-center gap-3 group">
                              <div className="w-10 h-10 bg-brand-secondary border p-1 group-hover:scale-105 transition-transform">
                                <img src={product.image} alt={product.name} className="w-full h-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-[8px] font-black uppercase truncate">{product.name}</h5>
                                <p className="text-[8px] font-bold text-brand-accent">{product.price}</p>
                              </div>
                              <button 
                                onClick={() => onAddToCart(product.id)}
                                className="text-[10px] font-black hover:text-brand-accent transition-colors"
                              >
                                +
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-brand-dark mb-3 block">Apply Formula Discount</label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="CODE"
                            value={promoCode}
                            onChange={(e) => setPromoCode(e.target.value)}
                            className="bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-black uppercase tracking-widest focus:outline-none focus:border-brand-accent flex-1"
                          />
                          <button 
                            onClick={handleApplyPromo}
                            className="px-6 py-3 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors"
                          >
                            Apply
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'shipping' && (
                    <motion.div
                      key="shipping"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Delivery Path</h2>
                        <p className="text-xs text-brand-dark/40 uppercase font-bold tracking-widest">
                          Where should we dispatch our artisanal reserve?
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">First Name</label>
                          <input type="text" className="w-full bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-bold focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">Last Name</label>
                          <input type="text" className="w-full bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-bold focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div className="col-span-2 space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">Shipping Address</label>
                          <input type="text" className="w-full bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-bold focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">City</label>
                          <input type="text" className="w-full bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-bold focus:outline-none focus:border-brand-accent" />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">Postal Code</label>
                          <input type="text" className="w-full bg-brand-secondary border border-brand-border px-4 py-3 text-xs font-bold focus:outline-none focus:border-brand-accent" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {step === 'payment' && (
                    <motion.div
                      key="payment"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="space-y-8"
                    >
                      <div>
                        <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Secure Payment</h2>
                        <p className="text-xs text-brand-dark/40 uppercase font-bold tracking-widest">
                          Encoded transactions for your culinary peace of mind.
                        </p>
                      </div>

                      <div className="space-y-6">
                        <div className="p-6 border-2 border-brand-dark flex flex-col gap-6">
                          <div className="flex justify-between items-center">
                            <CreditCard className="w-8 h-8 text-brand-dark" />
                            <div className="flex gap-2">
                              {['VISA', 'MC', 'AMEX'].map(card => (
                                <div key={card} className="px-2 py-1 border border-brand-border text-[8px] font-black bg-white">{card}</div>
                              ))}
                            </div>
                          </div>
                          <div className="space-y-4">
                            <input placeholder="CARD NUMBER" className="w-full bg-transparent border-b border-brand-border py-2 text-sm font-black tracking-widest focus:outline-none focus:border-brand-accent" />
                            <div className="grid grid-cols-2 gap-8">
                              <input placeholder="MM/YY" className="bg-transparent border-b border-brand-border py-2 text-sm font-black tracking-widest focus:outline-none focus:border-brand-accent" />
                              <input placeholder="CVV" className="bg-transparent border-b border-brand-border py-2 text-sm font-black tracking-widest focus:outline-none focus:border-brand-accent" />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 p-4 bg-brand-secondary">
                          <ShieldCheck className="w-5 h-5 text-green-600" />
                          <p className="text-[9px] font-bold uppercase tracking-widest text-brand-dark/60 leading-relaxed">
                            Your payment is handled via encoded SSL pipelines. No local records are stored.
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className="mt-12 flex items-center justify-between pt-8 border-t border-brand-border">
                {step !== 'summary' ? (
                  <button 
                    onClick={handleBack}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-dark/40 hover:text-brand-dark transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Back
                  </button>
                ) : <div />}

                <button 
                  onClick={handleNext}
                  disabled={isProcessing}
                  className="px-10 py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-accent transition-all flex items-center gap-3 shadow-xl disabled:opacity-50"
                >
                  {isProcessing ? 'Processing...' : (
                    <>
                      {step === 'payment' ? 'Seal the Order' : 'Continue'}
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </>
          )}

          {step === 'success' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center py-12"
            >
              <div className="w-24 h-24 rounded-full bg-brand-accent/10 flex items-center justify-center mb-8">
                <CheckCircle2 className="w-12 h-12 text-brand-accent" />
              </div>
              <h2 className="text-4xl font-black uppercase tracking-tight mb-4 leading-none">Order Dispatched</h2>
              <p className="text-sm text-brand-dark/60 italic serif-italic max-w-sm mb-12">
                Your selection is being carefully packed at our Gqeberha warehouse. Expect a tracking link in your inbox shortly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'My Mustard Deli Order',
                        text: 'I just ordered some amazing handcrafted mustards!',
                        url: window.location.origin
                      }).then(() => earnPoints(10));
                    } else {
                      navigator.clipboard.writeText(window.location.origin);
                      earnPoints(10);
                      alert('Link copied! 10 points added to your account.');
                    }
                  }}
                  className="px-8 py-5 border border-brand-dark text-brand-dark text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-dark hover:text-white transition-all flex items-center gap-3 justify-center"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share your batch
                </button>
                <button 
                  onClick={() => {
                    onComplete();
                    onClose();
                  }}
                  className="px-12 py-5 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-accent transition-all shadow-xl"
                >
                  Return to Gallery
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Right Side: Order Summary Stickily */}
        {step !== 'success' && (
          <div className="w-full md:w-[360px] bg-brand-secondary p-8 md:p-12 border-l border-brand-border">
            <h3 className="text-sm font-black uppercase tracking-widest mb-10 pb-4 border-b border-brand-border">Order Balance</h3>
            
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">Mustards Subtotal</span>
                <span className="text-xs font-black">R{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-brand-accent">
                <span className="text-[10px] font-bold uppercase tracking-widest">Formula Discount</span>
                <span className="text-xs font-black">- R{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-dark/40">Secure Shipping</span>
                <span className="text-xs font-black">{shipping === 0 ? 'COMPLIMENTARY' : `R${shipping.toFixed(2)}`}</span>
              </div>
              {shipping > 0 && (
                <p className="text-[8px] uppercase font-black text-brand-accent text-right">
                  Add R{(500 - subtotal).toFixed(2)} for free shipping
                </p>
              )}
              <div className="pt-6 border-t border-brand-border mt-10">
                <div className="flex justify-between items-end">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-dark">Total Due</span>
                  <span className="text-3xl font-black text-brand-dark">R{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="mt-12 space-y-4">
              <div className="p-4 bg-white/50 border border-brand-border">
                <p className="text-[9px] font-bold uppercase text-brand-dark/40 leading-relaxed">
                  * All orders are dispatched within 48 hours via specialized courier. 
                </p>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
