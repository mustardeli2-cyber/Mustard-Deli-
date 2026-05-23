import React, { useRef, useState, useEffect } from 'react';
import { Camera, X, RefreshCw, Check, Upload, Send, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CameraCaptureProps {
  onCapture: (image: string, caption: string) => void;
  onClose: () => void;
}

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'camera' | 'upload'>('camera');

  useEffect(() => {
    if (mode === 'camera') {
      setupCamera();
    } else {
      stopCamera();
    }

    return () => stopCamera();
  }, [mode]);

  async function setupCamera() {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError(null);
    } catch (err) {
      console.error("Camera access failed:", err);
      setError("Could not access camera. Please use file upload.");
      setMode('upload');
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }

  const compressImage = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1250; // Aspect ratio for our gallery is roughly 4:5
        let width = img.width;
        let height = img.height;

        if (width / height > MAX_WIDTH / MAX_HEIGHT) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        // Quality 0.6 is usually enough for ~150-300KB
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.src = dataUrl;
    });
  };

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        const compressed = await compressImage(dataUrl);
        setCapturedImage(compressed);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressed = await compressImage(reader.result as string);
        setCapturedImage(compressed);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage, caption);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-brand-dark/95 backdrop-blur-xl flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg flex items-center justify-between mb-8 text-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-brand-accent flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">Mustard Moments</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 border border-white/20 hover:bg-white hover:text-brand-dark transition-all"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="relative w-full max-w-lg aspect-[4/5] bg-black border-4 border-white shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
        {mode === 'camera' && !capturedImage && (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {(mode === 'upload' && !capturedImage) && (
          <div 
            className="w-full h-full flex flex-col items-center justify-center bg-brand-secondary cursor-pointer border-2 border-dashed border-brand-dark/20 m-4"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-brand-dark/20 mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-dark opacity-40">Choose from gallery</p>
            <input 
              ref={fileInputRef}
              type="file" 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileUpload}
            />
          </div>
        )}
        
        {capturedImage && (
          <div className="relative w-full h-full">
            <img 
              src={capturedImage} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-dark/40 pointer-events-none" />
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />

        <AnimatePresence>
          {error && mode === 'camera' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-black/80 text-white text-center p-8 z-10"
            >
              <div className="space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <p className="text-[10px] font-black uppercase tracking-widest">{error}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="w-full max-w-lg mt-8 space-y-6">
        {capturedImage ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="relative">
              <textarea 
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="What's the mustard story here? (e.g. Best Sunday braai ever!)"
                className="w-full bg-white/5 border border-white/20 p-6 text-white text-sm focus:outline-none focus:border-brand-accent transition-colors resize-none h-24 placeholder:text-white/20 font-medium"
                maxLength={300}
              />
              <div className="absolute bottom-4 right-4 text-[9px] font-bold text-white/20 uppercase">
                {caption.length}/300
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  setCapturedImage(null);
                  setCaption('');
                }}
                className="flex-1 py-5 border border-white text-white text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-dark transition-all"
              >
                Retake / Change
              </button>
              <button 
                onClick={handleConfirm}
                className="flex-1 py-5 bg-brand-accent text-white text-[10px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-xl flex items-center justify-center gap-3"
              >
                <Send className="w-3.5 h-3.5" />
                Share with Community
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between bg-white/5 p-2 rounded-full border border-white/10">
            <button 
              onClick={() => setMode('camera')}
              className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'camera' ? 'bg-white text-brand-dark shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Camera
            </button>
            <button 
              onClick={() => setMode('upload')}
              className={`flex-1 py-4 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'upload' ? 'bg-white text-brand-dark shadow-lg' : 'text-white/40 hover:text-white'}`}
            >
              Upload
            </button>
          </div>
        )}

        {!capturedImage && mode === 'camera' && (
          <div className="flex justify-center pt-8">
            <button 
              onClick={takePhoto}
              disabled={!!error}
              className="w-20 h-20 rounded-full bg-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl disabled:opacity-50 disabled:grayscale"
            >
              <div className="w-16 h-16 rounded-full border-2 border-brand-dark" />
            </button>
          </div>
        )}
      </div>

      <p className="mt-8 text-white/20 text-[9px] font-bold uppercase tracking-[0.4em] text-center max-w-xs">
        Artisan standard only. No blurry shots or spam.
      </p>
    </div>
  );
}

import { AlertCircle } from 'lucide-react';
