import React from 'react';
import { NavLink, useLocation } from 'react-router-dom'

const Navbar: React.FC = () => {
  const location = useLocation()
  const currentPath = location.pathname

  // Determine which links to show based on current portal
  const getVisibleLinks = () => {
    if (currentPath === '/') {
      return ['home', 'help']
    } else if (currentPath === '/student') {
      return ['home', 'student', 'help']
    } else if (currentPath === '/admin') {
      return ['home', 'admin', 'help']
    } else if (currentPath === '/validator') {
      return ['home', 'validator', 'help']
    } else if (currentPath === '/help') {
      return ['home', 'help']
    }
    return ['home', 'student', 'admin', 'validator', 'help']
  }

  const visibleLinks = getVisibleLinks()
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    `relative px-5 py-2.5 rounded-xl md:rounded-full font-bold text-sm md:text-base transition-all duration-500 ease-out flex items-center gap-2 overflow-hidden group ${
      isActive
        ? 'bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/40 scale-105'
        : 'text-slate-600 hover:text-blue-700 hover:bg-blue-50/50'
    }`;

  return (
    <nav className="sticky top-6 z-50 px-4 mb-8">
      <div className="container mx-auto max-w-5xl">
        <div className="glass-panel rounded-2xl md:rounded-full shadow-2xl px-3 py-3 md:px-4 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-2 border border-white/60 ring-1 ring-white/50 backdrop-blur-xl">
          
          {/* Logo Section */}
          <div className="flex items-center gap-3 px-2 md:px-4">
             <div className="relative h-10 w-10 md:h-12 md:w-12 bg-gradient-to-br from-blue-700 to-red-600 rounded-xl md:rounded-full flex items-center justify-center text-white text-lg shadow-lg shadow-blue-900/20 transform hover:rotate-12 transition-transform duration-500">
                <i className="fas fa-university z-10"></i>
                <div className="absolute inset-0 bg-white/30 rounded-full blur-md opacity-0 hover:opacity-100 transition-opacity"></div>
             </div>
             <div className="flex flex-col">
               <span className="text-xl md:text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-red-600 tracking-tight">AU AccessX</span>
             </div>
          </div>
          
          {/* Nav Links */}
          <div className="flex items-center p-1.5 bg-slate-100/60 rounded-xl md:rounded-full border border-slate-200/60 shadow-inner w-full md:w-auto justify-center md:justify-end">
            {visibleLinks.includes('home') && (
              <NavLink to="/" className={getLinkClass}>
                <i className="fas fa-home text-xs"></i>
                <span>Home</span>
              </NavLink>
            )}
            {visibleLinks.includes('student') && (
              <NavLink to="/student" className={getLinkClass}>
                <i className="fas fa-user-graduate text-xs"></i>
                <span>Student</span>
              </NavLink>
            )}
            {visibleLinks.includes('admin') && (
              <NavLink to="/admin" className={getLinkClass}>
                <i className="fas fa-chalkboard-teacher text-xs"></i>
                <span>Admin</span>
              </NavLink>
            )}
            {visibleLinks.includes('validator') && (
              <NavLink to="/validator" className={getLinkClass}>
                <i className="fas fa-certificate text-xs"></i>
                <span>Verify</span>
              </NavLink>
            )}
            {visibleLinks.includes('help') && (
              <NavLink to="/help" className={getLinkClass}>
                <i className="fas fa-question-circle text-xs"></i>
                <span>Help</span>
              </NavLink>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;