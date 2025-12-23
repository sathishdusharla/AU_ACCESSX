import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

declare global {
  interface Window {
    ethereum: any;
  }
}

const ValidatorPortal: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError("Please install MetaMask!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setError('');
    } catch (err: any) {
      setError("Failed to connect wallet: " + err.message);
    }
  };

  const verifyAndFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supabase) {
      setError("Database connection not configured.");
      return;
    }

    if (!walletAddress || !email) return;

    setLoading(true);
    setError('');
    setAttendanceRecords([]);

    try {
      // Fetch all attendance records for this wallet and email
      const { data: records, error: recordError } = await supabase
        .from('attendance_records')
        .select(`
          *,
          sessions:session_id (
            title,
            date,
            instructor_wallet
          )
        `)
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('email', email.toLowerCase())
        .order('timestamp', { ascending: false });

      if (recordError) {
        console.error('Query error:', recordError);
        throw recordError;
      }

      if (!records || records.length === 0) {
        setError("No attendance records found for this wallet and email combination.");
        setIsVerified(false);
        return;
      }

      setAttendanceRecords(records);
      setIsVerified(true);

    } catch (err: any) {
      console.error('Verification error:', err);
      setError(err.message || "Failed to fetch attendance records.");
      setIsVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsVerified(false);
    setWalletAddress('');
    setEmail('');
    setAttendanceRecords([]);
    setError('');
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    
    // Set colors
    const primaryBlue = [37, 99, 235];
    const darkBlue = [30, 64, 175];
    const lightGray = [100, 116, 139];
    const green = [16, 185, 129];
    
    // Header - Logo and Title
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AU AccessX', 105, 22, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Blockchain Attendance System', 105, 35, { align: 'center' });
    
    // Student Information Box
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 50, 180, 35, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('ATTENDANCE REPORT', 20, 58);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Student Email:', 20, 67);
    doc.setFont('helvetica', 'bold');
    doc.text(email, 50, 67);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Wallet Address:', 20, 73);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(walletAddress, 50, 73);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Report Generated:', 20, 79);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date().toLocaleString(), 50, 79);
    
    // Statistics
    const stats = [
      { label: 'Total Sessions', value: attendanceRecords.length.toString() },
      { label: 'Verified', value: '100%' },
      { label: 'Status', value: 'Blockchain Secured' }
    ];
    
    let statX = 20;
    stats.forEach((stat, idx) => {
      doc.setFillColor(239, 246, 255);
      doc.rect(statX, 92, 55, 20, 'F');
      
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
      doc.text(stat.value, statX + 27.5, 102, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(stat.label.toUpperCase(), statX + 27.5, 108, { align: 'center' });
      
      statX += 60;
    });
    
    // Attendance Records Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkBlue[0], darkBlue[1], darkBlue[2]);
    doc.text('✓ Attendance Records', 15, 125);
    
    // Table Header
    doc.setFillColor(primaryBlue[0], primaryBlue[1], primaryBlue[2]);
    doc.rect(15, 130, 180, 10, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('#', 20, 136);
    doc.text('Session Title', 30, 136);
    doc.text('Date', 90, 136);
    doc.text('Time', 125, 136);
    doc.text('Token ID', 155, 136);
    doc.text('Status', 180, 136);
    
    // Table Rows
    let yPos = 145;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    attendanceRecords.forEach((record, index) => {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      
      // Alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(15, yPos - 5, 180, 8, 'F');
      }
      
      doc.setTextColor(30, 41, 59);
      doc.text((index + 1).toString(), 20, yPos);
      doc.text(record.sessions?.title || 'Session', 30, yPos);
      doc.text(record.sessions?.date || new Date(record.timestamp).toLocaleDateString(), 90, yPos);
      doc.text(new Date(record.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }), 125, yPos);
      doc.text(`#${record.token_id}`, 155, yPos);
      
      // Status badge
      doc.setFillColor(green[0], green[1], green[2]);
      doc.roundedRect(178, yPos - 4, 15, 5, 1, 1, 'F');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.text('Present', 185.5, yPos, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      yPos += 8;
    });
    
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'normal');
      doc.text('Verified by Blockchain Technology', 105, 285, { align: 'center' });
      doc.text(`© ${new Date().getFullYear()} AU AccessX - All records are cryptographically secured`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `AU_AccessX_Attendance_${email.split('@')[0]}_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {!isVerified ? (
        <>
          <div className="text-center mb-10 text-white">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Student Verification Portal</h1>
            <p className="text-blue-100 text-lg opacity-90">Connect your wallet to view your attendance history.</p>
          </div>

          <div className="max-w-md mx-auto glass-panel rounded-2xl shadow-2xl p-8">
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
                <i className="fas fa-exclamation-circle mr-2"></i>
                {error}
              </div>
            )}

            <form onSubmit={verifyAndFetch} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  <i className="fas fa-wallet mr-1"></i> MetaMask Wallet
                </label>
                {walletAddress ? (
                  <div className="glass-input p-3 rounded-xl flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-700">
                      {walletAddress.substring(0, 6)}...{walletAddress.substring(38)}
                    </span>
                    <i className="fas fa-check-circle text-green-500"></i>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="w-full glass-input p-3 rounded-xl font-semibold text-slate-700 hover:bg-blue-50 transition flex items-center justify-center gap-2"
                  >
                    <i className="fas fa-wallet"></i>
                    Connect MetaMask
                  </button>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                  <i className="fas fa-envelope mr-1"></i> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !walletAddress}
                className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <><i className="fas fa-circle-notch fa-spin"></i> Verifying...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> View My Attendance</>
                )}
              </button>
            </form>
          </div>
        </>
      ) : (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white drop-shadow-sm">My Attendance History</h1>
              <p className="text-blue-100 opacity-90">{email}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={downloadPDF}
                className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-blue-600 hover:bg-blue-50 transition flex items-center gap-2"
              >
                <i className="fas fa-download"></i>
                Download PDF
              </button>
              <button
                onClick={handleLogout}
                className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                Logout
              </button>
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-8 shadow-2xl border-t-4 border-green-600">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-800">
                <i className="fas fa-check-circle text-green-600 mr-3"></i>
                Attended Sessions
              </h2>
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">{attendanceRecords.length}</div>
                <div className="text-xs text-slate-500 uppercase tracking-wide">Total Sessions</div>
              </div>
            </div>

            {attendanceRecords.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-times text-4xl text-slate-400"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">No Attendance Yet</h3>
                <p className="text-slate-500">You haven't attended any sessions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {attendanceRecords.map((record, index) => (
                  <div 
                    key={record.id} 
                    className="bg-gradient-to-r from-white to-blue-50/30 border border-slate-200 rounded-xl p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <h3 className="text-lg font-bold text-slate-800">
                              {record.sessions?.title || 'Session'}
                            </h3>
                            <p className="text-sm text-slate-500">
                              <i className="fas fa-calendar mr-1"></i>
                              {record.sessions?.date || new Date(record.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                        <i className="fas fa-check-circle mr-1"></i>
                        Present
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200">
                      <div className="bg-white/60 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Token ID</span>
                        <code className="text-xs font-mono text-slate-700">#{record.token_id}</code>
                      </div>
                      <div className="bg-white/60 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Marked At</span>
                        <span className="text-xs font-semibold text-slate-700">
                          {new Date(record.timestamp).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="bg-white/60 p-3 rounded-lg">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Transaction</span>
                        <code className="text-xs font-mono text-slate-600 break-all">
                          {record.tx_hash?.substring(0, 10)}...
                        </code>
                      </div>
                    </div>

                    {record.student_image && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <span className="text-xs font-bold text-slate-500 uppercase block mb-2">
                          <i className="fas fa-camera mr-1"></i> Captured Photo
                        </span>
                        <img 
                          src={record.student_image} 
                          alt="Student" 
                          className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ValidatorPortal;