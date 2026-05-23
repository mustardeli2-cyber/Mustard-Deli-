import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Image as ImageIcon, Check, Loader2, Sparkles, AlertCircle, User, Heart, Share2, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, limit, doc, runTransaction, increment, setDoc, deleteDoc } from 'firebase/firestore';
import CameraCapture from './CameraCapture';

interface GalleryItem {
  id: string;
  userId: string;
  userName: string;
  imageUrl: string;
  caption: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  displayInPublicAlbum: boolean;
  likesCount?: number;
}

export default function CommunityGallery() {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryItem[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'idle' | 'success' | 'error', message?: string }>({ type: 'idle' });
  const [selectedTab, setSelectedTab] = useState<'community' | 'personal'>('community');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [userLikes, setUserLikes] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      setUserLikes(new Set());
      return;
    }

    // This is a bit heavy if there are thousands of likes, 
    // but for this artisan gallery we'll just fetch them. 
    // In production, you'd only fetch likes for the currently viewed images.
    const likesRef = collection(db, 'users', user.uid, 'galleryLikes');
    const unsubscribe = onSnapshot(likesRef, (snapshot) => {
      setUserLikes(new Set(snapshot.docs.map(doc => doc.id)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${user.uid}/galleryLikes`);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const galleryRef = collection(db, 'gallery');
    
    let q;
    if (selectedTab === 'community') {
      q = query(
        galleryRef, 
        where('status', '==', 'approved'),
        where('displayInPublicAlbum', '==', true),
        orderBy('createdAt', 'desc'),
        limit(12)
      );
    } else {
      if (!user) {
        setImages([]);
        setIsInitialLoad(false);
        return;
      }
      q = query(
        galleryRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as GalleryItem));
      setImages(items);
      setIsInitialLoad(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'gallery');
      setIsInitialLoad(false);
    });

    return () => unsubscribe();
  }, [selectedTab, user]);

  const handleCapture = async (imageData: string, caption: string) => {
    setIsCapturing(false);
    setIsUploading(true);
    setUploadStatus({ type: 'idle' });

    try {
      // 1. AI Moderation (Frontend via Server Proxy)
      const prompt = `
        You are a content moderator for "Mustard Deli", an artisan mustard brand.
        Your task is to review user-uploaded images and captions of meals, braais, picnics with mustard.
        
        Criteria:
        1. No inappropriate, offensive, or explicit content.
        2. No spam or unrelated advertising.
        3. The content should ideally be related to food, meals, braais, picnics, or the brand's mustard.
        
        Caption: "${caption}"
        
        IMPORTANT: Respond ONLY with a valid JSON object in this format:
        {"status": "approved" | "rejected", "reason": "short explanation"}
      `;

      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: "gemini-3-flash-preview",
          contents: {
            parts: [
              { text: prompt },
              { 
                inlineData: {
                  data: imageData.split(',')[1] || imageData,
                  mimeType: "image/jpeg"
                }
              }
            ]
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini request failed: ${response.statusText}`);
      }

      const resultData = await response.json();
      const responseText = resultData.text || "{}";
      const jsonStr = responseText.replace(/```json|```/g, "").trim();
      const moderation = JSON.parse(jsonStr);
      
      if (moderation.status === 'rejected') {
        setUploadStatus({ type: 'error', message: `Submission rejected: ${moderation.reason}` });
        setIsUploading(false);
        return;
      }

      // 2. Upload to Firestore
      // Note: We use base64 for this artisan demo. In production, use Firebase Storage.
      const docRef = await addDoc(collection(db, 'gallery'), {
        userId: user?.uid,
        userName: user?.displayName || user?.email?.split('@')[0] || 'Artisan',
        imageUrl: imageData,
        caption,
        status: moderation.status === 'approved' ? 'approved' : 'pending',
        displayInPublicAlbum: true,
        createdAt: serverTimestamp()
      });

      if (moderation.status === 'approved') {
        await addDoc(collection(db, 'activity'), {
          type: 'gallery_upload',
          userId: user?.uid,
          userName: user?.displayName || user?.email?.split('@')[0] || 'Artisan',
          message: `shared a new mustard moment: "${caption.slice(0, 30)}..."`,
          targetId: docRef.id,
          createdAt: serverTimestamp()
        });
      }

      setUploadStatus({ 
        type: 'success', 
        message: moderation.status === 'approved' 
          ? 'Moment shared! Our AI approved your artisan snap.' 
          : 'Pending: Our AI is being cautious, an artisan will review it soon.' 
      });
    } catch (err) {
      console.error("Upload failed:", err);
      setUploadStatus({ type: 'error', message: 'Share failed. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleLike = async (image: GalleryItem) => {
    if (!user) return;

    const isLiked = userLikes.has(image.id);
    const galleryDocRef = doc(db, 'gallery', image.id);
    const likeDocRef = doc(db, 'gallery', image.id, 'likes', user.uid);
    const userLikeTrackerRef = doc(db, 'users', user.uid, 'galleryLikes', image.id);

    try {
      await runTransaction(db, async (transaction) => {
        if (!isLiked) {
          transaction.set(likeDocRef, { at: serverTimestamp() });
          transaction.set(userLikeTrackerRef, { at: serverTimestamp() });
          transaction.update(galleryDocRef, { likesCount: increment(1) });
        } else {
          transaction.delete(likeDocRef);
          transaction.delete(userLikeTrackerRef);
          transaction.update(galleryDocRef, { likesCount: increment(-1) });
        }
      });

      if (!isLiked) {
        await addDoc(collection(db, 'activity'), {
          type: 'gallery_like',
          userId: user.uid,
          userName: user.displayName || user.email?.split('@')[0] || 'Artisan',
          message: `loved ${image.userName}'s artisan photo`,
          targetId: image.id,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Like toggle failed:", err);
    }
  };

  return (
    <section id="community-gallery" className="py-32 px-6 md:px-12 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-20 gap-12">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-3 px-4 py-2 bg-brand-secondary border border-brand-border">
              <Sparkles className="w-3 h-3 text-brand-accent" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark">Mustard Magic</span>
            </div>
            <h2 className="text-5xl md:text-6xl font-black tracking-tighter text-brand-dark leading-tight uppercase">
              The <span className="serif-italic lowercase">Community</span> Album
            </h2>
            <p className="text-[#5B5550] max-w-xl text-sm leading-relaxed">
              Every jar tells a story. From mountain picnics to neighborhood braais, share how you flavor your life with Mustard Deli. 
              Our AI artisan reviews every moment to keep the gallery authentic.
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-6">
            {user ? (
               <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <div className="flex border border-brand-border p-1 bg-brand-secondary">
                    <button 
                      onClick={() => setSelectedTab('community')}
                      className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'community' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/40 hover:text-brand-dark'}`}
                    >
                      <Filter className="w-3 h-3" />
                      Everyone
                    </button>
                    <button 
                      onClick={() => setSelectedTab('personal')}
                      className={`flex items-center gap-2 px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${selectedTab === 'personal' ? 'bg-brand-dark text-white shadow-lg' : 'text-brand-dark/40 hover:text-brand-dark'}`}
                    >
                      <User className="w-3 h-3" />
                      Yours
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsCapturing(true)}
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-brand-dark text-white border border-brand-dark hover:bg-brand-accent hover:border-brand-accent transition-all group shadow-xl"
                  >
                    <Camera className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Capture Moment</span>
                  </button>
               </div>
            ) : (
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-dark/40 border-b border-brand-border pb-4 mb-4">
                  Join the table to share your moments
                </p>
                <div className="flex items-center justify-end gap-2 text-[9px] font-bold text-brand-accent uppercase tracking-widest">
                   <AlertCircle className="w-3 h-3" />
                   Review required for all posts
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Global Notifications */}
        <AnimatePresence>
          {isUploading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="mb-12 p-10 border border-brand-dark bg-brand-dark text-white flex items-center justify-between overflow-hidden relative"
            >
              <div className="flex items-center gap-6 relative z-10">
                <div className="relative">
                  <Loader2 className="w-8 h-8 text-brand-accent animate-spin" />
                  <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-brand-accent animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-[12px] font-black uppercase tracking-[0.4em]">Artisan Moderation</h4>
                  <p className="text-[10px] font-medium opacity-50 uppercase tracking-widest italic">Gemini AI is analyzing your snap for quality and safety...</p>
                </div>
              </div>
              <div className="absolute right-0 top-0 h-full w-48 bg-white/5 skew-x-12 translate-x-24" />
            </motion.div>
          )}

          {uploadStatus.type !== 'idle' && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`mb-12 p-8 flex items-center justify-between border-2 ${
                uploadStatus.type === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-900' 
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              <div className="flex items-center gap-6">
                 <div className={`w-10 h-10 rounded-full flex items-center justify-center ${uploadStatus.type === 'success' ? 'bg-green-200' : 'bg-red-200'}`}>
                    {uploadStatus.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                 </div>
                 <div className="space-y-1">
                   <h4 className="text-[11px] font-black uppercase tracking-widest">{uploadStatus.type === 'success' ? 'Success' : 'Attention Reqd'}</h4>
                   <p className="text-[10px] font-bold uppercase tracking-tighter opacity-60">{uploadStatus.message}</p>
                 </div>
              </div>
              <button 
                onClick={() => setUploadStatus({ type: 'idle' })}
                className="px-6 py-2 border border-current text-[10px] font-black uppercase tracking-widest hover:bg-current hover:text-white transition-all"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Gallery Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 min-h-[400px]">
          <AnimatePresence mode="popLayout">
            {images.map((img, idx) => (
              <motion.div
                key={img.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0, transition: { delay: idx * 0.05 } }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative h-full flex flex-col"
              >
                <div className="aspect-[4/5] bg-brand-secondary border border-brand-border overflow-hidden relative grayscale group-hover:grayscale-0 transition-all duration-1000 ease-out shadow-sm group-hover:shadow-2xl">
                  <img 
                    src={img.imageUrl} 
                    alt={img.caption} 
                    className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                  />
                  
                  {img.status === 'pending' && (
                    <div className="absolute inset-0 bg-brand-dark/80 backdrop-blur-[6px] flex flex-col items-center justify-center p-8 text-center">
                      <div className="relative mb-4">
                        <Loader2 className="w-6 h-6 text-brand-accent animate-spin" />
                        <Sparkles className="absolute -top-1 -right-1 w-2.5 h-2.5 text-brand-accent" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">Artisan<br/>Reviewing</span>
                    </div>
                  )}

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-brand-dark/95 via-brand-dark/80 to-transparent opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-500">
                    <p className="text-white text-[11px] font-medium leading-relaxed italic mb-4 line-clamp-3">
                      {`"${img.caption}"`}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-brand-accent flex items-center justify-center">
                          <User className="w-2.5 h-2.5 text-brand-dark" />
                        </div>
                        <span className="text-white text-[9px] font-black uppercase tracking-widest">
                          {img.userId === user?.uid ? 'Me' : img.userName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-full">
                           <button 
                             onClick={() => handleToggleLike(img)}
                             className={`transition-colors ${userLikes.has(img.id) ? 'text-red-500 fill-red-500' : 'text-white/60 hover:text-brand-accent'}`}
                           >
                              <Heart className="w-3 h-3" />
                           </button>
                           <span className="text-[9px] font-black text-white">{img.likesCount || 0}</span>
                        </div>
                        <button className="text-white/60 hover:text-brand-accent transition-colors">
                           <Share2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Mobile Caption Visibility (Always show small label on mobile or group hover) */}
                <div className="mt-4 md:hidden lg:group-hover:block transition-all">
                   <div className="flex items-center justify-between">
                     <span className="text-[8px] font-black uppercase tracking-widest text-brand-dark/40">{img.userName}</span>
                     <span className="text-[8px] font-bold text-brand-dark/20">{new Date(img.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isInitialLoad && images.length === 0 && Array.from({ length: 4 }).map((_, i) => (
             <div key={i} className="aspect-[4/5] bg-brand-secondary border border-brand-border animate-pulse flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-brand-dark/5" />
             </div>
          ))}

          {!isInitialLoad && images.length === 0 && !isUploading && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-center border-2 border-dashed border-brand-border">
               <div className="w-20 h-20 bg-brand-secondary rounded-full flex items-center justify-center mb-8 relative">
                  <ImageIcon className="w-8 h-8 text-brand-dark/20" />
                  <div className="absolute -top-2 -right-2 w-6 h-6 bg-brand-accent rounded-full border-4 border-white" />
               </div>
               <h3 className="text-xl font-black uppercase tracking-tight text-brand-dark/60 mb-3">No moments documented yet</h3>
               <p className="text-[11px] font-bold uppercase tracking-widest text-brand-dark/30 max-w-xs leading-relaxed">
                 {selectedTab === 'community' 
                   ? 'The artisanal table is set, but the album is empty. Be the first to share your spice!' 
                   : 'You haven\'t documented any mustard moments yet. Fire up the camera!'}
               </p>
               {selectedTab === 'personal' && (
                 <button 
                  onClick={() => setIsCapturing(true)}
                  className="mt-8 px-8 py-3 border border-brand-dark text-brand-dark text-[10px] font-black uppercase tracking-widest hover:bg-brand-dark hover:text-white transition-all shadow-lg active:scale-95"
                 >
                   Open Camera
                 </button>
               )}
            </div>
          )}
        </div>
        
        {images.length > 0 && selectedTab === 'community' && (
          <div className="mt-20 flex justify-center">
             <button className="px-12 py-5 border border-brand-border text-brand-dark text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-dark hover:text-white hover:border-brand-dark transition-all">
                Load More Discoveries
             </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isCapturing && (
          <CameraCapture 
            onCapture={handleCapture}
            onClose={() => setIsCapturing(false)}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
