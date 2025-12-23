import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'student',
      title: 'Student Portal',
      description: 'Mark your attendance by scanning QR codes and capturing your photo',
      icon: 'fa-user-graduate',
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      path: '/student',
      features: ['Scan QR Codes', 'Capture Photo', 'Get NFT Badge']
    },
    {
      id: 'admin',
      title: 'Admin Portal',
      description: 'Create sessions, manage attendance, and verify student records',
      icon: 'fa-chalkboard-teacher',
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      path: '/admin',
      features: ['Create Sessions', 'View Attendance', 'Manage Records']
    },
    {
      id: 'verify',
      title: 'Verify Portal',
      description: 'View your complete attendance history and session records',
      icon: 'fa-check-circle',
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      path: '/validator',
      features: ['View History', 'Check Sessions', 'Verify Records']
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="text-center mb-12 sm:mb-16 animate-fade-in-up">
        <div className="inline-block mb-4 sm:mb-6">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-blue-700 to-red-600 rounded-2xl sm:rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-900/30 transform hover:rotate-12 transition-transform duration-500">
            <i className="fas fa-university text-4xl sm:text-5xl text-white z-10"></i>
            <div className="absolute inset-0 bg-white/30 rounded-2xl sm:rounded-3xl blur-md opacity-0 hover:opacity-100 transition-opacity"></div>
          </div>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-3 sm:mb-4 drop-shadow-lg px-4">
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-800 to-red-600">AU AccessX</span>
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-blue-100 font-medium max-w-3xl mx-auto leading-relaxed px-4">
          Blockchain-powered attendance system with secure verification and NFT badges
        </p>
        <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-white/80 text-xs sm:text-sm px-4">
          <div className="flex items-center gap-2">
            <i className="fas fa-shield-alt text-green-400"></i>
            <span>Secure & Transparent</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full"></div>
          <div className="flex items-center gap-2">
            <i className="fab fa-ethereum text-blue-400"></i>
            <span>Blockchain Verified</span>
          </div>
          <div className="hidden sm:block w-1 h-1 bg-white/50 rounded-full"></div>
          <div className="flex items-center gap-2">
            <i className="fas fa-camera text-purple-400"></i>
            <span>Photo Verified</span>
          </div>
        </div>
      </div>

      {/* Role Selection Cards */}
      <div className="mb-12">
        <h2 className="text-xl sm:text-2xl font-bold text-white text-center mb-6 sm:mb-8 px-4">
          Select Your Portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {roles.map((role, index) => (
            <div
              key={role.id}
              className="group glass-panel rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-2xl border-t-4 border-white/30 hover:scale-105 transition-all duration-300 cursor-pointer animate-fade-in-up"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => navigate(role.path)}
            >
              {/* Icon */}
              <div className={`w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br ${role.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg group-hover:shadow-2xl transition-shadow transform group-hover:-translate-y-2 duration-300`}>
                <i className={`fas ${role.icon} text-3xl sm:text-4xl text-white`}></i>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl font-bold text-slate-800 text-center mb-2 sm:mb-3 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 transition-all">
                {role.title}
              </h3>

              {/* Description */}
              <p className="text-sm sm:text-base text-slate-600 text-center mb-4 sm:mb-6 leading-relaxed">
                {role.description}
              </p>

              {/* Features */}
              <ul className="space-y-2 mb-4 sm:mb-6">
                {role.features.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs sm:text-sm text-slate-700">
                    <i className="fas fa-check-circle text-green-500 text-xs"></i>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button
                className={`w-full py-2.5 sm:py-3 rounded-xl font-bold text-sm sm:text-base text-white bg-gradient-to-r ${role.color} ${role.hoverColor} shadow-lg transition-all transform group-hover:shadow-2xl flex items-center justify-center gap-2`}
              >
                Access Portal
                <i className="fas fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Features Section */}
      <div className="glass-panel rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 shadow-2xl border-t-4 border-blue-500">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 text-center mb-8 sm:mb-10 px-4">
          Why Choose AU AccessX?
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {[
            {
              icon: 'fa-fingerprint',
              title: 'Unique Identity',
              description: 'MetaMask wallet verification ensures each student is uniquely identified'
            },
            {
              icon: 'fa-camera',
              title: 'Photo Proof',
              description: 'Capture student photos during attendance for visual verification'
            },
            {
              icon: 'fa-shield-alt',
              title: 'Secure Records',
              description: 'Cryptographic signatures prevent tampering and ensure authenticity'
            },
            {
              icon: 'fa-certificate',
              title: 'NFT Badges',
              description: 'Students receive verifiable NFT certificates for attendance'
            }
          ].map((feature, idx) => (
            <div key={idx} className="text-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className={`fas ${feature.icon} text-xl sm:text-2xl text-blue-600`}></i>
              </div>
              <h3 className="font-bold text-sm sm:text-base text-slate-800 mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed px-2">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="mt-8 sm:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { number: '100%', label: 'Secure' },
          { number: '24/7', label: 'Available' },
          { number: 'Real-time', label: 'Updates' },
          { number: 'Blockchain', label: 'Verified' }
        ].map((stat, idx) => (
          <div key={idx} className="glass-panel rounded-lg sm:rounded-xl p-4 sm:p-6 text-center shadow-lg">
            <div className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-1">
              {stat.number}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 font-semibold uppercase tracking-wide">
              {stat.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomePage;
