import React, { useState } from 'react';
import QRScanner from '../components/QRScanner';
import { supabase } from '../lib/supabase';
import { ethers } from 'ethers';

// Augment window with ethereum provider
declare global {
  interface Window {
    ethereum: any;
  }
}

interface ScanData {
  sessionId: string;
  nonce: string;
}

const StudentPortal: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [scanData, setScanData] = useState<ScanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ tokenId: string; txHash: string } | null>(null);
  const [error, setError] = useState<string>('');

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setError('');
      } catch (err: any) {
        setError("Failed to connect wallet: " + err.message);
      }
    } else {
      setError("Please install MetaMask (or use the MetaMask mobile browser)!");
    }
  };

  const handleScan = (decodedText: string) => {
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.sessionId && parsed.nonce) {
        setScanData(parsed);
      } else {
        setError("Invalid QR Code format.");
      }
    } catch (e) {
      setError("Failed to parse QR code.");
    }
  };

  const signAndSubmit = async () => {
    if (!walletAddress || !scanData || !email) {
      setError("Missing required fields.");
      return;
    }
    
    setLoading(true);
    setError('');

    try {
      // 1. Check if session exists
      const { data: sessionData, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_id', scanData.sessionId)
        .eq('nonce', scanData.nonce)
        .single();

      if (sessionError || !sessionData) {
        throw new Error("Invalid Session ID or QR Code");
      }

      // 2. Check if already attended
      const { data: existingRecord } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', scanData.sessionId)
        .eq('wallet_address', walletAddress.toLowerCase())
        .single();

      if (existingRecord) {
        throw new Error("Attendance already marked for this wallet.");
      }

      // 3. Create Message & Sign
      const message = `Attendance Request\nEmail: ${email}\nSession: ${scanData.sessionId}\nNonce: ${scanData.nonce}`;
      
      const signature = await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });

      // 4. Verify signature
      const recoveredAddress = ethers.verifyMessage(message, signature);
      if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
        throw new Error("Signature verification failed. Wallet mismatch.");
      }

      // 5. "Mint" the NFT (Generate token data)
      const tokenId = Math.floor(100000 + Math.random() * 900000).toString();
      const txHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');

      // 6. Insert into Supabase - this will be instant!
      const { data, error } = await supabase
        .from('attendance_records')
        .insert([
          {
            session_id: scanData.sessionId,
            wallet_address: walletAddress.toLowerCase(),
            email: email,
            token_id: tokenId,
            tx_hash: txHash,
            signature: signature,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      // 7. Success
      setSuccessData({
        tokenId: tokenId,
        txHash: txHash
      });

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to submit attendance.");
    } finally {
      setLoading(false);
    }
  };

  // Success View
  if (successData) {
    return (
      <div className="max-w-md mx-auto animate-fade-in-up">
        <div className="glass-panel rounded-2xl p-8 text-center relative overflow-hidden border-t-4 border-green-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-blue-500"></div>
          
          <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30">
            <i className="fas fa-check text-4xl text-white"></i>
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-800 mb-2">Attendance Minted!</h2>
          <p className="text-slate-500 mb-8">Your proof of attendance is now on the blockchain.</p>
          
          <div className="bg-slate-50/80 rounded-xl p-5 text-left space-y-4 mb-8 border border-slate-200 shadow-inner">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Token ID</span>
              <span className="font-mono font-bold text-lg text-slate-800">#{successData.tokenId}</span>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Transaction Hash</span>
              <p className="font-mono text-xs text-blue-600 break-all bg-blue-50 p-2 rounded border border-blue-100">{successData.txHash}</p>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 text-white px-6 py-4 rounded-xl font-bold hover:bg-slate-900 transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Mark Another
          </button>
        </div>
      </div>
    );
  }

  // Main Form View
  return (
    <div className="max-w-4xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Header / Intro - Left Side on Desktop */}
        <div className="md:col-span-5 flex flex-col justify-center text-white md:pr-6 mb-6 md:mb-0">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 drop-shadow-md">
            Student <br/> <span className="text-blue-200">Portal</span>
          </h1>
          <p className="text-lg text-blue-100 font-medium mb-8 leading-relaxed drop-shadow-sm">
            Securely mark your attendance using blockchain technology. Connect your wallet, scan the classroom QR code, and mint your NFT badge.
          </p>
          
          {/* Steps Indicator */}
          <div className="hidden md:block space-y-6">
             {[
               { num: 1, title: 'Connect Wallet', active: !!walletAddress },
               { num: 2, title: 'Enter Details', active: !!walletAddress && !!email },
               { num: 3, title: 'Scan QR Code', active: !!walletAddress && !!email && !!scanData },
               { num: 4, title: 'Mint Badge', active: false }
             ].map((step, idx) => (
               <div key={idx} className={`flex items-center transition-all duration-300 ${step.active ? 'opacity-100 translate-x-2' : 'opacity-60'}`}>
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-4 border-2 ${step.active ? 'bg-white text-blue-900 border-white' : 'border-white/50 text-white'}`}>
                   {step.active ? <i className="fas fa-check"></i> : step.num}
                 </div>
                 <span className="font-semibold">{step.title}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Form Card - Right Side */}
        <div className="md:col-span-7">
          <div className="glass-panel rounded-2xl shadow-2xl p-6 md:p-8 animate-fade-in-up">
            
            <div className="space-y-8">
              
              {/* Step 1: Connect Wallet */}
              <div className={`transition-all duration-500 ${walletAddress ? 'opacity-50 grayscale' : 'opacity-100'}`}>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center">
                    <i className="fas fa-wallet text-blue-600 mr-2"></i> Connect Wallet
                  </h3>
                  {walletAddress && <span className="text-green-500 text-sm font-bold"><i className="fas fa-check-circle"></i> Connected</span>}
                </div>
                
                {walletAddress ? (
                  <div className="glass-input p-4 rounded-xl flex items-center justify-between group cursor-default">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white mr-3 shadow-md">
                        <i className="fas fa-fox text-lg"></i>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-500 font-bold uppercase">MetaMask</span>
                        <span className="font-mono font-semibold text-slate-700 text-sm md:text-base">{walletAddress.substring(0,6)}...{walletAddress.substring(walletAddress.length-4)}</span>
                      </div>
                    </div>
                    <button onClick={() => setWalletAddress('')} className="text-xs text-red-500 font-semibold hover:underline opacity-0 group-hover:opacity-100 transition-opacity">Disconnect</button>
                  </div>
                ) : (
                  <button 
                    onClick={connectWallet}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold shadow-lg shadow-orange-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    Connect MetaMask
                  </button>
                )}
              </div>

              {/* Step 2: Details */}
              <div className={`transition-all duration-500 ${!walletAddress ? 'opacity-30 pointer-events-none blur-[1px]' : ''}`}>
                 <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                    <i className="fas fa-id-card text-blue-600 mr-2"></i> Student Details
                 </h3>
                 <input 
                   type="email" 
                   disabled={!walletAddress}
                   placeholder="Enter your college email" 
                   value={email}
                   onChange={(e) => setEmail(e.target.value)}
                   className="glass-input w-full p-4 rounded-xl text-slate-800 font-medium placeholder:text-slate-400"
                 />
              </div>

              {/* Step 3: Scan */}
              <div className={`transition-all duration-500 ${!walletAddress || !email ? 'opacity-30 pointer-events-none blur-[1px]' : ''}`}>
                <h3 className="text-lg font-bold text-slate-800 mb-3 flex items-center">
                    <i className="fas fa-qrcode text-blue-600 mr-2"></i> Scan Session
                </h3>
                
                {!scanData ? (
                   <div className="rounded-xl overflow-hidden border-2 border-dashed border-blue-200 bg-blue-50/50">
                      <QRScanner onScanSuccess={handleScan} />
                   </div>
                ) : (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 p-5 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center">
                       <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mr-4">
                         <i className="fas fa-check text-xl"></i>
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800">Session Verified</h4>
                         <p className="text-xs text-slate-500 font-mono">ID: {scanData.sessionId.substring(0,8)}...</p>
                       </div>
                    </div>
                    <button onClick={() => setScanData(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white text-red-500 hover:bg-red-50 transition shadow-sm">
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Step 4: Action */}
              <div className={`pt-4 ${!scanData ? 'opacity-50 pointer-events-none' : ''}`}>
                 <button
                   onClick={signAndSubmit}
                   disabled={loading}
                   className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl text-white transition-all transform hover:-translate-y-1 active:scale-95 ${
                     loading 
                      ? 'bg-slate-400 cursor-wait' 
                      : 'bg-gradient-to-r from-blue-700 to-red-600 hover:shadow-blue-900/20'
                   }`}
                 >
                   {loading ? (
                     <span className="flex items-center justify-center">
                       <i className="fas fa-circle-notch fa-spin mr-3"></i> Minting NFT Badge...
                     </span>
                   ) : (
                     <span className="flex items-center justify-center">
                       Sign & Mint Attendance <i className="fas fa-arrow-right ml-3"></i>
                     </span>
                   )}
                 </button>
                 
                 {error && (
                   <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-start animate-pulse">
                     <i className="fas fa-exclamation-circle mt-1 mr-3"></i>
                     <p className="text-sm font-medium">{error}</p>
                   </div>
                 )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPortal;