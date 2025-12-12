import React, { useState } from 'react';
import { ValidatorResponse } from '../types';
import { supabase } from '../lib/supabase';

const ValidatorPortal: React.FC = () => {
  const [sessionId, setSessionId] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ValidatorResponse | null>(null);

  const verifyAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setResult({ verified: false, error: "Database connection not configured." });
      return;
    }

    if (!sessionId || !walletAddress) return;

    setLoading(true);
    setResult(null);

    try {
      // Clean inputs
      const cleanSessionId = sessionId.trim();
      const cleanWallet = walletAddress.trim().toLowerCase();

      // Query attendance record (don't use .single() to avoid errors)
      const { data: records, error: recordError } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', cleanSessionId)
        .eq('wallet_address', cleanWallet);

      if (recordError) {
        console.error('Query error:', recordError);
        throw recordError;
      }

      if (!records || records.length === 0) {
        setResult({ 
          verified: false, 
          error: "No attendance record found for this wallet/session combination." 
        });
        return;
      }

      const record = records[0];

      // Fetch session details for metadata
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', cleanSessionId);

      const sessionDetails = sessionData && sessionData.length > 0 ? sessionData[0] : null;

      setResult({
        verified: true,
        tokenId: record.token_id,
        metadata: {
          name: `${sessionDetails?.title || 'Class'} Badge`,
          description: "Official AU AccessX Attendance Proof",
          image: "https://cdn-icons-png.flaticon.com/512/6298/6298900.png",
          attributes: [
            { trait_type: "Student Email", value: record.email },
            { trait_type: "Date", value: sessionDetails?.date || record.timestamp },
            { trait_type: "Timestamp", value: new Date(record.timestamp).toLocaleString() }
          ]
        }
      });

    } catch (err: any) {
      console.error('Verification error:', err);
      setResult({ 
        verified: false, 
        error: err.message || "Connection failed. Please check your configuration." 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-center mb-10 text-white">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Attendance Validator</h1>
        <p className="text-blue-100 text-lg opacity-90">Verify authenticity of student attendance badges on-chain.</p>
      </div>

      <div className="glass-panel rounded-3xl shadow-2xl p-1 overflow-hidden">
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[20px]">
          
          {/* Search Form */}
          <form onSubmit={verifyAttendance} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Session ID</label>
                <div className="relative">
                  <i className="fas fa-fingerprint absolute left-4 top-4 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="Enter Session ID"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3.5 rounded-xl font-medium text-slate-700"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase ml-1">Wallet Address</label>
                <div className="relative">
                  <i className="fas fa-wallet absolute left-4 top-4 text-slate-400"></i>
                  <input 
                    type="text" 
                    placeholder="0x...StudentAddress"
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="glass-input w-full pl-10 pr-4 py-3.5 rounded-xl font-mono text-sm text-slate-700"
                    required
                  />
                </div>
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all flex items-center justify-center group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span><i className="fas fa-circle-notch fa-spin mr-2"></i> Checking Blockchain...</span>
              ) : (
                <span>Verify Record <i className="fas fa-search ml-2 group-hover:scale-110 transition-transform"></i></span>
              )}
            </button>
          </form>

          {/* Result Section */}
          {result && (
            <div className={`mt-8 animate-fade-in-up border-t border-slate-200 pt-8`}>
               {result.verified ? (
                  <div className="relative bg-gradient-to-br from-white to-green-50 rounded-2xl border border-green-200 p-8 shadow-inner overflow-hidden">
                     {/* Decorative Watermark */}
                     <i className="fas fa-certificate absolute -right-10 -bottom-10 text-[150px] text-green-100 opacity-50 transform rotate-12 pointer-events-none"></i>
                     
                     <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                        <div className="text-center md:text-left flex-1">
                           <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider mb-3">
                              <i className="fas fa-check-circle"></i> Verified
                           </div>
                           <h3 className="text-2xl font-bold text-slate-800 mb-1">Authentic Attendance Record</h3>
                           <p className="text-slate-500 text-sm mb-4">This badge was securely minted on the blockchain.</p>
                           
                           <div className="grid grid-cols-2 gap-4 mt-6">
                              <div>
                                 <span className="block text-[10px] text-slate-400 uppercase font-bold">Token ID</span>
                                 <span className="font-mono font-bold text-slate-700">#{result.tokenId}</span>
                              </div>
                              {result.metadata?.attributes.map((attr, idx) => (
                                 <div key={idx}>
                                    <span className="block text-[10px] text-slate-400 uppercase font-bold">{attr.trait_type}</span>
                                    <span className="font-semibold text-slate-700 text-sm break-words">{attr.value}</span>
                                 </div>
                              ))}
                           </div>
                        </div>
                        
                        {/* NFT Preview */}
                        <div className="shrink-0 relative">
                           <div className="w-32 h-32 rounded-xl bg-slate-200 shadow-lg rotate-3 border-4 border-white overflow-hidden">
                              <img src={result.metadata?.image} alt="NFT" className="w-full h-full object-cover" />
                           </div>
                           <div className="absolute -bottom-3 -right-3 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-md">
                              ERC-721
                           </div>
                        </div>
                     </div>
                  </div>
               ) : (
                  <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex flex-col items-center text-center">
                     <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                        <i className="fas fa-times text-2xl"></i>
                     </div>
                     <h3 className="text-lg font-bold text-red-800 mb-1">Verification Failed</h3>
                     <p className="text-red-600 text-sm">{result.error}</p>
                  </div>
               )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default ValidatorPortal;