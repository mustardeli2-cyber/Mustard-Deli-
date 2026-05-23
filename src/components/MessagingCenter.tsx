import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Users, 
  User, 
  Shield, 
  Mail, 
  MessageSquare, 
  Search, 
  X, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Filter,
  ChevronRight,
  MoreVertical,
  Trash2,
  Eye,
  RefreshCw
} from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';
import { db } from '../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp, 
  orderBy, 
  onSnapshot,
  doc,
  updateDoc,
  deleteDoc,
  limit,
  Timestamp,
  arrayUnion
} from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  targetType: 'all' | 'role' | 'individual';
  targetId?: string;
  title: string;
  content: string;
  createdAt: Timestamp;
  isRead?: boolean;
  readBy?: string[];
}

export default function MessagingCenter() {
  const { user, profile, isAdmin } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [showComposer, setShowComposer] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all');

  // Composer state
  const [targetType, setTargetType] = useState<'all' | 'role' | 'individual'>('individual');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    let q;
    if (isAdmin) {
      q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'), limit(50));
    } else {
      // For non-admins, we query based on common fields. Since we can't easily OR
      // across targetId/senderId/all in one query without many indices or separate queries,
      // we'll use a broad query for now that's allowed by rules and filter on client,
      // OR better, we would use separate queries. Let's do separate for better security.
      q = query(
        collection(db, 'messages'), 
        orderBy('createdAt', 'desc'),
        limit(100)
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
      
      if (isAdmin) {
        setMessages(msgs);
      } else {
        // Filter strictly based on rules criteria
        const filtered = msgs.filter(m => {
          if (m.targetType === 'all') return true;
          if (m.targetType === 'role' && m.targetId === profile?.role) return true;
          if (m.targetType === 'individual' && (m.targetId === user.uid || m.senderId === user.uid)) return true;
          return false;
        });
        setMessages(filtered);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'messages');
    });

    return () => unsubscribe();
  }, [user, isAdmin, profile]);

  useEffect(() => {
    if (memberSearch.length < 2) {
      setSearchResults([]);
      return;
    }

    const searchMembers = async () => {
      const q = query(
        collection(db, 'users'),
        where('displayName', '>=', memberSearch.toUpperCase()),
        where('displayName', '<=', memberSearch.toUpperCase() + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(d => ({ uid: d.id, ...d.data() })));
    };

    const timer = setTimeout(searchMembers, 300);
    return () => clearTimeout(timer);
  }, [memberSearch]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSending(true);

    try {
      await addDoc(collection(db, 'messages'), {
        senderId: user.uid,
        senderName: profile?.displayName || user.displayName || 'Artisanal Member',
        targetType,
        targetId,
        title,
        content,
        createdAt: serverTimestamp(),
        isRead: false,
        readBy: []
      });

      setShowComposer(false);
      setTitle('');
      setContent('');
      setTargetId('');
      alert('Message dispatched successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setSending(false);
    }
  };

  const markAsRead = async (msg: Message) => {
    if (!user || isAdmin) return; // Admins don't mark as read in this context

    if (msg.targetType === 'individual' && msg.targetId === user.uid && !msg.isRead) {
      await updateDoc(doc(db, 'messages', msg.id), { isRead: true });
    } else if ((msg.targetType === 'all' || msg.targetType === 'role') && !msg.readBy?.includes(user.uid)) {
      await updateDoc(doc(db, 'messages', msg.id), {
        readBy: arrayUnion(user.uid)
      });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('Are you sure you want to archive this message?')) return;
    try {
      await deleteDoc(doc(db, 'messages', id));
      if (selectedMsg?.id === id) setSelectedMsg(null);
    } catch (err) {
      alert('Failed to delete message.');
    }
  };

  return (
    <div className="flex h-full flex-col lg:flex-row bg-white border border-brand-border shadow-2xl">
      {/* Sidebar - Message List */}
      <div className="w-full lg:w-80 border-r border-brand-border flex flex-col h-[600px] lg:h-auto">
        <div className="p-4 border-b border-brand-border bg-brand-secondary/30 flex items-center justify-between">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-brand-dark flex items-center gap-2">
            <Mail className="w-4 h-4" /> Dispatch Center
          </h2>
          {isAdmin && (
            <button 
              onClick={() => setShowComposer(true)}
              className="p-1.5 bg-brand-dark text-white rounded-full hover:bg-brand-accent transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="p-3 bg-white border-b border-brand-border flex gap-2">
          <button 
            onClick={() => setFilter('all')}
            className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded transition-all ${filter === 'all' ? 'bg-brand-dark text-white' : 'bg-brand-secondary text-brand-dark/40 hover:bg-brand-secondary/80'}`}
          >
            All
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded transition-all ${filter === 'unread' ? 'bg-brand-dark text-white' : 'bg-brand-secondary text-brand-dark/40 hover:bg-brand-secondary/80'}`}
          >
            Unread
          </button>
          {isAdmin && (
            <button 
              onClick={() => setFilter('sent')}
              className={`flex-1 py-1.5 text-[8px] font-black uppercase tracking-widest rounded transition-all ${filter === 'sent' ? 'bg-brand-dark text-white' : 'bg-brand-secondary text-brand-dark/40 hover:bg-brand-secondary/80'}`}
            >
              Sent
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex items-center justify-center h-20">
              <div className="w-4 h-4 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-brand-border mx-auto mb-3" />
              <p className="text-[10px] font-bold text-brand-dark/30 uppercase tracking-widest">No messages in queue</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isUnread = msg.targetType === 'individual' ? !msg.isRead : !msg.readBy?.includes(user?.uid || '');
              const sentByMe = msg.senderId === user?.uid;

              return (
                <button
                  key={msg.id}
                  onClick={() => { setSelectedMsg(msg); markAsRead(msg); }}
                  className={`w-full text-left p-4 border-b border-brand-border hover:bg-brand-secondary transition-colors relative group ${
                    selectedMsg?.id === msg.id ? 'bg-brand-secondary' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] rounded px-1.5 py-0.5 ${
                      msg.targetType === 'all' ? 'bg-brand-accent/20 text-brand-accent' :
                      msg.targetType === 'role' ? 'bg-blue-100 text-blue-600' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {msg.targetType}
                    </span>
                    <span className="text-[8px] text-brand-dark/30 font-medium">
                      {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                    </span>
                  </div>
                  <h4 className={`text-[10px] uppercase tracking-wide truncate mb-0.5 ${isUnread ? 'font-black text-brand-dark' : 'font-bold text-brand-dark/60'}`}>
                    {msg.title}
                  </h4>
                  <p className="text-[9px] text-brand-dark/40 font-medium truncate italic">{msg.senderName}</p>
                  
                  {isUnread && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-accent rounded-full"></div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Main Content - Message View */}
      <div className="flex-1 flex flex-col h-[500px] lg:h-auto bg-gray-50/50">
        <AnimatePresence mode="wait">
          {selectedMsg ? (
            <motion.div 
              key={selectedMsg.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="p-6 border-b border-brand-border bg-white flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-brand-dark mb-1">{selectedMsg.title}</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-brand-secondary flex items-center justify-center">
                        <User className="w-3 h-3 text-brand-dark/60" />
                      </div>
                      <span className="text-[10px] font-black text-brand-dark uppercase tracking-widest">{selectedMsg.senderName}</span>
                    </div>
                    <span className="text-brand-border">/</span>
                    <span className="text-[9px] text-brand-dark/40 font-bold uppercase tracking-widest leading-none flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {selectedMsg.createdAt?.seconds ? new Date(selectedMsg.createdAt.seconds * 1000).toLocaleString() : 'Just now'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => deleteMessage(selectedMsg.id)}
                    className="p-2 text-brand-dark/30 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setSelectedMsg(null)}
                    className="lg:hidden p-2 text-brand-dark/30 hover:text-brand-dark transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 p-8 overflow-y-auto">
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-brand-dark leading-relaxed whitespace-pre-wrap font-medium">
                    {selectedMsg.content}
                  </p>
                </div>
              </div>

              <div className="p-6 bg-brand-secondary/30 border-t border-brand-border flex items-center justify-between">
                <div className="flex items-center gap-4">
                   <div className="flex -space-x-2">
                     {selectedMsg.targetType === 'all' && (
                       <div className="w-8 h-8 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-[8px] font-black text-brand-accent">
                         ALL
                       </div>
                     )}
                   </div>
                   <p className="text-[9px] font-bold text-brand-dark/40 uppercase tracking-widest">
                     Type: {selectedMsg.targetType} 
                     {selectedMsg.targetId ? ` • Target: ${selectedMsg.targetId}` : ''}
                   </p>
                </div>
                <button 
                  onClick={() => {
                    // Logic to reply could go here
                    setShowComposer(true);
                    setTargetType('individual');
                    setTargetId(selectedMsg.senderId);
                    setTitle(`RE: ${selectedMsg.title}`);
                  }}
                  className="px-6 py-2 bg-brand-dark text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all"
                >
                  Reply
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-16 h-16 bg-brand-secondary rounded-full flex items-center justify-center mb-6">
                <Mail className="w-8 h-8 text-brand-dark/20" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tight text-brand-dark mb-2">Select a communication</h3>
              <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-widest max-w-xs leading-relaxed">
                Choose a message from the Dispatch list to read official broadasts and member correspondence.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Composer Overlay */}
      <AnimatePresence>
        {showComposer && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-dark/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white w-full max-w-2xl border-4 border-brand-accent shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-brand-border flex items-center justify-between bg-brand-secondary/30">
                <h3 className="text-lg font-black uppercase tracking-tighter text-brand-dark">Compose Dispatch</h3>
                <button onClick={() => setShowComposer(false)} className="p-2 hover:bg-brand-border rounded-full transition-all">
                  <X className="w-5 h-5 text-brand-dark" />
                </button>
              </div>

              <form onSubmit={handleSendMessage} className="p-8 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Target Group
                    </label>
                    <select 
                      value={targetType}
                      onChange={(e) => setTargetType(e.target.value as any)}
                      className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none"
                    >
                      <option value="individual">Individual Member</option>
                      {isAdmin && <option value="all">Global Broadcast</option>}
                      {isAdmin && <option value="role">Role-Specific Group</option>}
                    </select>
                  </div>

                  {targetType === 'individual' && (
                    <div className="space-y-1.5 relative">
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40 flex items-center gap-1.5">
                        <User className="w-3 h-3" /> Select Member
                      </label>
                      <div className="relative">
                        <input 
                          type="text"
                          placeholder="Search Display Name..."
                          value={memberSearch || ''}
                          onChange={(e) => setMemberSearch(e.target.value)}
                          className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none"
                        />
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/20" />
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 bg-white border border-brand-border shadow-xl mt-1 max-h-40 overflow-y-auto">
                          {searchResults.map(m => (
                            <button
                              key={m.uid}
                              type="button"
                              onClick={() => {
                                setTargetId(m.uid);
                                setMemberSearch(m.displayName);
                                setSearchResults([]);
                              }}
                              className="w-full text-left p-3 hover:bg-brand-secondary text-[10px] font-bold uppercase tracking-widest border-b border-brand-border last:border-0"
                            >
                              {m.displayName} <span className="text-brand-dark/40 ml-2">({m.email})</span>
                            </button>
                          ))}
                        </div>
                      )}
                      {targetId && !searchResults.length && (
                        <p className="text-[8px] font-black text-brand-accent uppercase mt-1">Recipient Locked: {targetId}</p>
                      )}
                    </div>
                  )}

                  {targetType === 'role' && (
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Select Role</label>
                      <select 
                        value={targetId}
                        onChange={(e) => setTargetId(e.target.value)}
                        className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none"
                      >
                        <option value="">Choose Role...</option>
                        <option value="wholesale">Wholesale Partners</option>
                        <option value="stockist">Stockists</option>
                        <option value="customer">Retail Customers</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Subject Line</label>
                  <input 
                    type="text" 
                    required
                    value={title || ''}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Mustard Announcement..."
                    className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase tracking-widest text-brand-dark/40">Content</label>
                  <textarea 
                    required
                    value={content || ''}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Type your artisanal message here..."
                    className="w-full p-4 bg-brand-secondary border border-brand-border text-[11px] font-bold uppercase tracking-widest focus:border-brand-accent outline-none min-h-[150px]"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-brand-border">
                  <button 
                    type="button"
                    onClick={() => setShowComposer(false)}
                    className="flex-1 py-4 border border-brand-border text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-secondary transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={sending || (targetType !== 'all' && !targetId)}
                    className="flex-[2] py-4 bg-brand-dark text-white text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:bg-brand-accent transition-all disabled:opacity-50"
                  >
                    {sending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Dispatch Message
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
