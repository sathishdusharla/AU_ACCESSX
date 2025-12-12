// ...existing code...
import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code'; 
import { SessionData } from '../types';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

const AdminPortal: React.FC = () => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Fetch existing sessions on load and setup real-time subscription
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    // If supabase client isn't configured, surface error and skip all network work
    if (!supabase) {
      console.error('Supabase client is not configured. Ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set.');
      setFetchError(true);
      return;
    }

    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedSessions = (data || []).map((session: any) => ({
          sessionId: session.session_id,
          nonce: session.nonce,
          title: session.title,
          date: session.date,
        }));

        setSessions(formattedSessions);
        setFetchError(false);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setFetchError(true);
      }
    };

    fetchSessions();

    // Setup real-time subscription for instant updates (guarded)
    try {
      channel = supabase
        .channel('sessions_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sessions'
          },
          (payload) => {
            if (!payload?.new) return;
            const newSession = {
              sessionId: payload.new.session_id,
              nonce: payload.new.nonce,
              title: payload.new.title,
              date: payload.new.date,
            };
            setSessions(prev => [newSession, ...prev]);
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('Realtime subscription failed to start:', err);
    }

    return () => {
      try {
        if (channel && supabase && typeof supabase.removeChannel === 'function') {
          supabase.removeChannel(channel);
        }
      } catch (err) {
        console.warn('Error removing realtime channel:', err);
      }
    };
  }, []);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFetchError(false);

    if (!supabase) {
      console.error('Supabase client is not configured. Cannot create session.');
      setFetchError(true);
      setLoading(false);
      return;
    }

    try {
      // Generate unique IDs (ensure crypto.randomUUID exists in environment)
      const sessionId = typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const nonce = (typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`).substring(0, 16);

      const { data, error } = await supabase
        .from('sessions')
        .insert([
          {
            session_id: sessionId,
            nonce: nonce,
            title: title,
            date: date,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // Real-time subscription will handle adding to state
      setTitle('');
    } catch (err) {
      console.error(err);
      setFetchError(true);
      alert("Error creating session. Please check your Supabase configuration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white drop-shadow-sm">Admin Dashboard</h1>
           <p className="text-blue-100 opacity-90">Manage attendance sessions and QR codes.</p>
        </div>
        <div className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-blue-900 flex items-center">
           <i className="fas fa-layer-group mr-2"></i> 
           {sessions.length} Active Sessions
        </div>
      </div>

      {fetchError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-md animate-pulse">
            <p className="font-bold">Database Connection Failed</p>
            <p className="text-sm">Unable to connect to Supabase. Please check your environment variables and database setup.</p>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Create Session Panel */}
        <div className="lg:col-span-1">
          <div className="glass-panel rounded-2xl shadow-xl p-6 sticky top-24 border-t-4 border-blue-600">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
               <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                 <i className="fas fa-plus"></i>
               </span>
               New Session
            </h2>
            <form onSubmit={createSession} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Subject / Title</label>
                <input 
                  required
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Data Structures & Algorithms"
                  className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Session Date</label>
                <input 
                  required
                  type="date" 
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 flex items-center justify-center"
              >
                {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <span>Generate Session <i className="fas fa-magic ml-2"></i></span>}
              </button>
            </form>
          </div>
        </div>

        {/* Sessions List */}
        <div className="lg:col-span-2 space-y-6">
           {sessions.length === 0 ? (
             <div className="glass-panel p-16 text-center rounded-2xl border-dashed border-2 border-white/50 flex flex-col items-center justify-center min-h-[400px]">
               <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center mb-6">
                 <i className="fas fa-folder-open text-5xl text-white opacity-80"></i>
               </div>
               <h3 className="text-xl font-bold text-white mb-2">No Active Sessions</h3>
               <p className="text-blue-100 max-w-xs">Create a new session from the left panel to generate attendance QR codes.</p>
             </div>
           ) : (
             sessions.map((session) => (
               <div key={session.sessionId} className="glass-card rounded-2xl p-0 overflow-hidden flex flex-col md:flex-row animate-fade-in-up hover:shadow-2xl transition-shadow group">
                 
                 {/* QR Section (Ticket Stub) */}
                 <div className="bg-white p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative">
                    {/* Perforated edge dots */}
                    <div className="absolute -right-2 top-0 bottom-0 w-4 h-full hidden md:flex flex-col justify-between z-10">
                       {[...Array(8)].map((_, i) => <div key={i} className="w-4 h-4 bg-slate-100 rounded-full -my-2"></div>)}
                    </div>
                    
                    <div className="w-32 h-32 bg-white rounded-lg p-2 shadow-inner border border-slate-100">
                        <QRCode 
                            value={JSON.stringify({ sessionId: session.sessionId, nonce: session.nonce })} 
                            size={256}
                            style={{ height: "100%", maxWidth: "100%", width: "100%" }}
                            viewBox={`0 0 256 256`}
                        />
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 mt-2 uppercase tracking-widest">Scan Me</span>
                 </div>
                 
                 {/* Details Section */}
                 <div className="p-6 flex-grow flex flex-col justify-between bg-gradient-to-br from-white/80 to-blue-50/50">
                   <div>
                     <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{session.title}</h3>
                        <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full">{session.date}</span>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="bg-white/60 p-3 rounded-lg border border-slate-100">
                           <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Session ID</span>
                           <code className="text-xs font-mono text-slate-600 break-all">{session.sessionId}</code>
                        </div>
                        <div className="bg-white/60 p-3 rounded-lg border border-slate-100">
                           <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Nonce Token</span>
                           <code className="text-xs font-mono text-slate-600">{session.nonce}</code>
                        </div>
                     </div>
                   </div>

                   <div className="mt-6 flex gap-3 border-t border-slate-200 pt-4">
                     <button className="flex-1 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition flex items-center justify-center">
                       <i className="fas fa-print mr-2"></i> Print
                     </button>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
  );
};

export default AdminPortal;
// ...existing code...