import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import StudentPortal from './pages/StudentPortal';
import AdminPortal from './pages/AdminPortal';
import ValidatorPortal from './pages/ValidatorPortal';
import HelpPage from './pages/HelpPage';

// High quality architectural background
const BG_IMAGE = "https://images.unsplash.com/photo-1562774053-701939374585?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80";

const AppContent: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-800 antialiased selection:bg-red-200 selection:text-red-900">
      {/* Fixed Background with Parallax feel */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${BG_IMAGE})`, filter: 'brightness(0.9)' }}
      />
      
      {/* Dynamic Gradient Overlay */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-900/50 via-white/5 to-red-900/40 backdrop-blur-[4px] mix-blend-overlay" />
      <div className="fixed inset-0 z-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
      
      {/* Content Wrapper */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/student" element={<StudentPortal />} />
            <Route path="/admin" element={<AdminPortal />} />
            <Route path="/validator" element={<ValidatorPortal />} />          <Route path="/help" element={<HelpPage />} />          </Routes>
        </main>
        
        <footer className="relative z-10 mt-auto py-6 text-center text-white/80 text-sm font-medium">
          <div className="glass-panel inline-flex items-center gap-3 px-6 py-2 rounded-full mx-auto border border-white/20 shadow-xl">
             <span className="opacity-90 font-semibold text-slate-800">© 2025 AU AccessX</span>
             <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
             <span className="text-blue-700 font-bold flex items-center gap-1">
               <i className="fab fa-ethereum"></i> Ethereum Secured
             </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;