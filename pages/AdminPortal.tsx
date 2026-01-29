import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code'; 
import { SessionData } from '../types';
import { supabase } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import { getCurrentLocation } from '../lib/locationUtils';

declare global {
  interface Window {
    ethereum: any;
  }
}

const AdminPortal: React.FC = () => {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [walletAddress, setWalletAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Session state
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(false);

  // Attendance view state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([]);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  // Image zoom modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  // Modal states
  const [confirmModal, setConfirmModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({ show: false, title: '', message: '', onConfirm: () => {} });

  const [alertModal, setAlertModal] = useState<{
    show: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({ show: false, title: '', message: '', type: 'success' });

  // Helper functions for modals
  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmModal({ show: true, title, message, onConfirm });
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error') => {
    setAlertModal({ show: true, title, message, type });
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('instructor_session');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setIsLoggedIn(true);
        setWalletAddress(session.walletAddress);
        setEmail(session.email);
      } catch (err) {
        console.error('Failed to restore session:', err);
        localStorage.removeItem('instructor_session');
      }
    }
  }, []);

  // Fetch sessions for logged-in instructor
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    if (!isLoggedIn || !walletAddress || !supabase) return;

    const fetchSessions = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .eq('instructor_wallet', walletAddress.toLowerCase())
          .order('created_at', { ascending: false});

        if (error) throw error;

        const formattedSessions = (data || []).map((session: any) => ({
          sessionId: session.session_id,
          nonce: session.nonce,
          title: session.title,
          date: session.date,
          instructorWallet: session.instructor_wallet,
        }));

        setSessions(formattedSessions);
        setFetchError(false);
      } catch (err) {
        console.error("Failed to fetch sessions:", err);
        setFetchError(true);
      }
    };

    fetchSessions();

    // Real-time subscription for this instructor's sessions only
    try {
      channel = supabase
        .channel('instructor_sessions_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'sessions',
            filter: `instructor_wallet=eq.${walletAddress.toLowerCase()}`
          },
          (payload) => {
            if (!payload?.new) return;
            const newSession = {
              sessionId: payload.new.session_id,
              nonce: payload.new.nonce,
              title: payload.new.title,
              date: payload.new.date,
              instructorWallet: payload.new.instructor_wallet,
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
  }, [isLoggedIn, walletAddress]);

  // Hash password
  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  // Connect wallet
  const connectWallet = async () => {
    if (!window.ethereum) {
      setAuthError("Please install MetaMask!");
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setWalletAddress(accounts[0]);
      setAuthError('');
    } catch (err: any) {
      setAuthError("Failed to connect wallet: " + err.message);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress || !email || !password || !supabase) {
      setAuthError("Please fill all fields and connect wallet");
      return;
    }

    setAuthLoading(true);
    setAuthError('');

    try {
      const passwordHash = await hashPassword(password);

      // Verify credentials from database
      const { data: instructor, error } = await supabase
        .from('instructors')
        .select('*')
        .eq('wallet_address', walletAddress.toLowerCase())
        .eq('email', email)
        .eq('password_hash', passwordHash)
        .single();

      if (error || !instructor) {
        throw new Error("Invalid credentials. Please check your wallet, email, and password.");
      }

      // Save session to localStorage
      localStorage.setItem('instructor_session', JSON.stringify({
        walletAddress: walletAddress.toLowerCase(),
        email: email
      }));

      setIsLoggedIn(true);
    } catch (err: any) {
      console.error(err);
      setAuthError(err.message || "Authentication failed");
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('instructor_session');
    
    setIsLoggedIn(false);
    setWalletAddress('');
    setEmail('');
    setPassword('');
    setSessions([]);
    setSelectedSessionId(null);
    setAttendanceRecords([]);
  };

  // View attendance for a specific session
  const viewAttendance = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setAttendanceLoading(true);

    try {
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      setAttendanceRecords(data || []);
    } catch (err) {
      console.error('Failed to fetch attendance:', err);
      setAttendanceRecords([]);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Download attendance as PDF
  const downloadAttendancePDF = () => {
    const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
    if (!currentSession) return;

    const doc = new jsPDF();
    
    // Set colors
    const primaryPurple = [147, 51, 234];
    const darkPurple = [109, 40, 217];
    const lightGray = [100, 116, 139];
    const green = [16, 185, 129];
    
    // Header - Logo and Title
    doc.setFillColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(24);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('AU AccessX', 105, 22, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Session Attendance Report', 105, 35, { align: 'center' });
    
    // Session Information Box
    doc.setFillColor(241, 245, 249);
    doc.rect(15, 50, 180, 40, 'F');
    
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text('SESSION DETAILS', 20, 58);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Session Title:', 20, 67);
    doc.setFont('helvetica', 'bold');
    doc.text(currentSession.title, 50, 67);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Date:', 20, 73);
    doc.setFont('helvetica', 'bold');
    doc.text(currentSession.date, 50, 73);
    
    doc.setFont('helvetica', 'normal');
    doc.text('Instructor:', 20, 79);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(email, 50, 79);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Report Generated:', 20, 85);
    doc.setFont('helvetica', 'bold');
    doc.text(new Date().toLocaleString(), 50, 85);
    
    // Statistics
    const stats = [
      { label: 'Total Present', value: attendanceRecords.length.toString() },
      { label: 'Session ID', value: selectedSessionId?.substring(0, 8) + '...' || 'N/A' },
      { label: 'Status', value: 'Verified' }
    ];
    
    let statX = 20;
    stats.forEach((stat) => {
      doc.setFillColor(243, 232, 255);
      doc.rect(statX, 97, 55, 20, 'F');
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
      doc.text(stat.value, statX + 27.5, 107, { align: 'center' });
      
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(stat.label.toUpperCase(), statX + 27.5, 113, { align: 'center' });
      
      statX += 60;
    });
    
    // Attendance Records Title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(darkPurple[0], darkPurple[1], darkPurple[2]);
    doc.text('✓ Student Attendance', 15, 128);
    
    // Table Header
    doc.setFillColor(primaryPurple[0], primaryPurple[1], primaryPurple[2]);
    doc.rect(15, 133, 180, 10, 'F');
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('#', 20, 139);
    doc.text('Student Email', 30, 139);
    doc.text('Wallet Address', 90, 139);
    doc.text('Time', 145, 139);
    doc.text('Token ID', 170, 139);
    
    // Table Rows
    let yPos = 148;
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
      doc.text(record.email.substring(0, 25), 30, yPos);
      doc.text(record.wallet_address.substring(0, 10) + '...', 90, yPos);
      doc.text(new Date(record.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }), 145, yPos);
      doc.text(`#${record.token_id}`, 170, yPos);
      
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
      doc.text(`© ${new Date().getFullYear()} AU AccessX - Instructor: ${email}`, 105, 290, { align: 'center' });
    }
    
    // Save the PDF
    const fileName = `AU_AccessX_${currentSession.title.replace(/\s+/g, '_')}_${currentSession.date}.pdf`;
    doc.save(fileName);
  };

  // Delete attendance record
  const deleteAttendance = async (recordId: string) => {
    showConfirm(
      'Remove Student',
      'Are you sure you want to remove this student from the attendance list?',
      async () => {
        try {
          const { error } = await supabase
            .from('attendance_records')
            .delete()
            .eq('id', recordId);

          if (error) throw error;

          // Update local state
          setAttendanceRecords(prev => prev.filter(record => record.id !== recordId));
          showAlert('Success', 'Student removed successfully', 'success');
        } catch (err) {
          console.error('Failed to delete attendance:', err);
          showAlert('Error', 'Failed to remove student. Please try again.', 'error');
        }
      }
    );
  };

  // Close attendance view
  const closeAttendanceView = () => {
    setSelectedSessionId(null);
    setAttendanceRecords([]);
  };

  // Delete entire session
  const deleteSession = async (sessionId: string) => {
    showConfirm(
      'Delete Session',
      'Are you sure you want to delete this entire session? This will also delete all attendance records for this session. This action cannot be undone.',
      async () => {
        try {
          // First delete all attendance records for this session
          const { error: attendanceError } = await supabase
            .from('attendance_records')
            .delete()
            .eq('session_id', sessionId);

          if (attendanceError) throw attendanceError;

          // Then delete the session itself
          const { error: sessionError } = await supabase
            .from('sessions')
            .delete()
            .eq('session_id', sessionId);

          if (sessionError) throw sessionError;

          // Update local state
          setSessions(prev => prev.filter(session => session.sessionId !== sessionId));
          showAlert('Success', 'Session deleted successfully', 'success');
        } catch (err) {
          console.error('Failed to delete session:', err);
          showAlert('Error', 'Failed to delete session. Please try again.', 'error');
        }
      }
    );
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setFetchError(false);

    if (!supabase || !walletAddress) {
      console.error('Supabase client is not configured or not logged in.');
      setFetchError(true);
      setLoading(false);
      return;
    }

    try {
      // Capture instructor location
      let instructorLat: number | undefined;
      let instructorLon: number | undefined;
      
      try {
        const location = await getCurrentLocation();
        instructorLat = location.latitude;
        instructorLon = location.longitude;
        console.log('Instructor location captured:', { instructorLat, instructorLon });
      } catch (locationError: any) {
        console.warn('Location capture failed:', locationError.message);
        showAlert('Location Warning', 
          'Could not capture your location. Students will not be able to mark attendance for this session. Please enable location services.', 
          'error'
        );
        setLoading(false);
        return;
      }

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
            start_time: startTime,
            end_time: endTime,
            instructor_wallet: walletAddress.toLowerCase(),
            instructor_latitude: instructorLat,
            instructor_longitude: instructorLon,
          }
        ])
        .select()
        .single();

      if (error) throw error;

      setTitle('');
      setStartTime('');
      setEndTime('');
      showAlert('Session Created', 'Session created successfully with location tracking enabled.', 'success');
    } catch (err) {
      console.error(err);
      setFetchError(true);
      showAlert('Error', 'Error creating session. Please check your Supabase configuration.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Login View
  if (!isLoggedIn) {
    return (
      <>
        {/* Custom Modals */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
            <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-600">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                  }}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {alertModal.show && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAlertModal({ ...alertModal, show: false })}>
            <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  alertModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <i className={`fas ${alertModal.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{alertModal.title}</h3>
                <p className="text-slate-600">{alertModal.message}</p>
              </div>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className={`w-full py-2.5 rounded-xl font-semibold text-white transition ${
                  alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        )}

      <div className="max-w-md mx-auto">
        <div className="glass-panel rounded-2xl p-8 shadow-2xl border-t-4 border-blue-600">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
              <i className="fas fa-chalkboard-teacher text-3xl text-white"></i>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Instructor Login</h2>
            <p className="text-slate-500">Sign in to manage your attendance sessions</p>
          </div>

          {authError && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 mb-4 rounded text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
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
                placeholder="instructor@university.edu"
                className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">
                <i className="fas fa-lock mr-1"></i> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="glass-input w-full p-3 pr-12 rounded-xl font-semibold text-slate-700"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 transition"
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading || !walletAddress}
              className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {authLoading ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Verifying...</>
              ) : (
                <><i className="fas fa-sign-in-alt"></i> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            <i className="fas fa-shield-alt mr-1"></i>
            Your credentials are securely verified from the database
          </div>
        </div>
      </div>
      </>
    );
  }

  // Attendance Details Modal
  if (selectedSessionId) {
    const currentSession = sessions.find(s => s.sessionId === selectedSessionId);
    
    return (
      <>
        {/* Custom Modals */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
            <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-exclamation-triangle text-2xl"></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
                <p className="text-slate-600">{confirmModal.message}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal({ ...confirmModal, show: false });
                  }}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {alertModal.show && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAlertModal({ ...alertModal, show: false })}>
            <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
              <div className="text-center mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                  alertModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                }`}>
                  <i className={`fas ${alertModal.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-2xl`}></i>
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">{alertModal.title}</h3>
                <p className="text-slate-600">{alertModal.message}</p>
              </div>
              <button
                onClick={() => setAlertModal({ ...alertModal, show: false })}
                className={`w-full py-2.5 rounded-xl font-semibold text-white transition ${
                  alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                OK
              </button>
            </div>
          </div>
        )}

        {/* Image Zoom Modal */}
        {zoomedImage && (
          <div 
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setZoomedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh]">
              <button
                onClick={() => setZoomedImage(null)}
                className="absolute -top-12 right-0 w-10 h-10 bg-white rounded-full flex items-center justify-center text-slate-700 hover:bg-red-500 hover:text-white transition shadow-lg"
              >
                <i className="fas fa-times text-xl"></i>
              </button>
              <img 
                src={zoomedImage} 
                alt="Student Photo" 
                className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        )}

      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <button
            onClick={closeAttendanceView}
            className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-slate-700 hover:bg-white/60 transition flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i>
            Back to Sessions
          </button>
          <button
            onClick={downloadAttendancePDF}
            className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-purple-600 hover:bg-purple-50 transition flex items-center gap-2"
          >
            <i className="fas fa-download"></i>
            Download PDF
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-8 shadow-2xl border-t-4 border-green-600">
          <div className="mb-8">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-800 mb-2">
                  <i className="fas fa-users text-green-600 mr-3"></i>
                  Attendance Records
                </h2>
                <p className="text-slate-600">
                  <span className="font-semibold">{currentSession?.title}</span> - {currentSession?.date}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-green-600">{attendanceRecords.length}</div>
                <div className="text-sm text-slate-500 uppercase tracking-wide">Students Present</div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="text-xs font-bold text-slate-400 uppercase mb-1">Session ID</div>
              <code className="text-sm font-mono text-slate-700">{selectedSessionId}</code>
            </div>
          </div>

          {attendanceLoading ? (
            <div className="text-center py-12">
              <i className="fas fa-circle-notch fa-spin text-4xl text-blue-500 mb-4"></i>
              <p className="text-slate-600">Loading attendance records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-user-slash text-4xl text-slate-400"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">No Attendance Yet</h3>
              <p className="text-slate-500">Students will appear here once they scan and submit attendance.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-slate-100 to-slate-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">#</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Student Email</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Wallet Address</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  {attendanceRecords.map((record, index) => (
                    <tr key={record.id} className="hover:bg-blue-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-slate-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {record.student_image ? (
                          <div className="group relative">
                            <img 
                              src={record.student_image} 
                              alt="Student" 
                              className="w-16 h-16 rounded-lg object-cover border-2 border-slate-200 cursor-pointer hover:border-blue-500 transition"
                              onClick={() => setZoomedImage(record.student_image)}
                            />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition rounded-lg flex items-center justify-center pointer-events-none">
                              <i className="fas fa-search-plus text-white text-xl"></i>
                            </div>
                          </div>
                        ) : (
                          <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-slate-200">
                            <i className="fas fa-user text-slate-400 text-xl"></i>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs mr-3">
                            {record.email?.charAt(0).toUpperCase() || 'S'}
                          </div>
                          <div className="text-sm font-semibold text-slate-800">{record.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                          {record.wallet_address?.substring(0, 6)}...{record.wallet_address?.substring(38)}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {new Date(record.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                          <i className="fas fa-check-circle mr-1"></i>
                          Present
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => deleteAttendance(record.id)}
                          className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold hover:bg-red-100 transition border border-red-200 flex items-center gap-1"
                          title="Remove student from attendance"
                        >
                          <i className="fas fa-trash"></i>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => window.print()}
              className="flex-1 glass-input py-3 rounded-xl font-semibold text-slate-700 hover:bg-white/60 transition flex items-center justify-center gap-2"
            >
              <i className="fas fa-print"></i>
              Print Attendance
            </button>
            <button
              onClick={closeAttendanceView}
              className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Sessions
            </button>
          </div>
        </div>
      </div>
      </>
    );
  }

  return (
    <>
      {/* Custom Modals */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConfirmModal({ ...confirmModal, show: false })}>
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-exclamation-triangle text-2xl"></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{confirmModal.title}</h3>
              <p className="text-slate-600">{confirmModal.message}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                className="flex-1 py-2.5 rounded-xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal({ ...confirmModal, show: false });
                }}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 transition"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {alertModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setAlertModal({ ...alertModal, show: false })}>
          <div className="glass-panel rounded-2xl p-6 max-w-md w-full shadow-2xl animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
                alertModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
              }`}>
                <i className={`fas ${alertModal.type === 'success' ? 'fa-check-circle' : 'fa-times-circle'} text-2xl`}></i>
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">{alertModal.title}</h3>
              <p className="text-slate-600">{alertModal.message}</p>
            </div>
            <button
              onClick={() => setAlertModal({ ...alertModal, show: false })}
              className={`w-full py-2.5 rounded-xl font-semibold text-white transition ${
                alertModal.type === 'success' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              OK
            </button>
          </div>
        </div>
      )}

    <div className="max-w-7xl mx-auto">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white drop-shadow-sm">Admin Dashboard</h1>
           <p className="text-blue-100 opacity-90">Welcome, {email}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-blue-900 flex items-center">
             <i className="fas fa-layer-group mr-2"></i> 
             {sessions.length} Sessions
          </div>
          <button
            onClick={handleLogout}
            className="glass-panel px-4 py-2 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition flex items-center gap-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            Logout
          </button>
        </div>
      </div>

      {fetchError && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r shadow-md animate-pulse">
            <p className="font-bold">Database Connection Failed</p>
            <p className="text-sm">Unable to connect to Supabase. Please check your environment variables and database setup.</p>
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Start Time</label>
                <input 
                  required
                  type="time" 
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">QR code valid for 10 minutes from start time</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">End Time</label>
                <input 
                  required
                  type="time" 
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="glass-input w-full p-3 rounded-xl font-semibold text-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">Session end time (for display only)</p>
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
                 <div className="bg-white p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-200 relative">
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
                 <div className="p-6 flex-grow flex flex-col justify-between bg-gradient-to-br from-white/80 to-blue-50/50">
                   <div>
                     <div className="flex justify-between items-start mb-3">
                        <h3 className="text-xl font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{session.title}</h3>
                        <span className="bg-red-50 text-red-600 border border-red-100 text-xs font-bold px-3 py-1 rounded-full">{session.date}</span>
                     </div>
                     {session.start_time && session.end_time && (
                       <div className="mb-3 flex items-center gap-2 text-slate-600">
                         <i className="fas fa-clock text-blue-600"></i>
                         <span className="text-sm font-semibold">
                           {session.start_time} - {session.end_time}
                         </span>
                         <span className="text-xs text-slate-500">(QR valid first 10 mins)</span>
                       </div>
                     )}
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
                     <button 
                       onClick={() => viewAttendance(session.sessionId)}
                       className="flex-1 py-2 rounded-lg text-sm font-semibold bg-green-50 text-green-700 hover:bg-green-100 transition flex items-center justify-center border border-green-200"
                     >
                       <i className="fas fa-users mr-2"></i> View Attendance
                     </button>
                     <button 
                       onClick={() => deleteSession(session.sessionId)}
                       className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition flex items-center justify-center border border-red-200"
                     >
                       <i className="fas fa-trash mr-2"></i> Delete
                     </button>
                   </div>
                 </div>
               </div>
             ))
           )}
        </div>
      </div>
    </div>
    </>
  );
};

export default AdminPortal;
