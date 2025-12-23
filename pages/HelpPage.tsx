import React from 'react';
import { useNavigate } from 'react-router-dom';

const HelpPage: React.FC = () => {
  const navigate = useNavigate();

  const faqs = [
    {
      category: 'Student Portal',
      icon: 'fa-user-graduate',
      color: 'blue',
      questions: [
        {
          q: 'How do I mark my attendance?',
          a: 'Connect your MetaMask wallet, enter your email, scan the QR code shown by your instructor, capture your photo, and submit. You will receive an NFT badge as proof.'
        },
        {
          q: 'What if I don\'t have MetaMask?',
          a: 'Install MetaMask browser extension from metamask.io. Create a wallet and use that wallet address to mark attendance.'
        },
        {
          q: 'Can I mark attendance twice for the same session?',
          a: 'No, the system prevents duplicate attendance. Each wallet can only mark attendance once per session.'
        },
        {
          q: 'Why do I need to capture a photo?',
          a: 'Photo verification helps prevent fraud and ensures that the person marking attendance is actually present in the class.'
        }
      ]
    },
    {
      category: 'Admin Portal',
      icon: 'fa-chalkboard-teacher',
      color: 'purple',
      questions: [
        {
          q: 'How do I create a new session?',
          a: 'Login with your credentials, enter the session title and date, then click "Generate Session". A QR code will be created that students can scan.'
        },
        {
          q: 'How can I view who attended my session?',
          a: 'Click "View Attendance" on any session card. You will see a table with student emails, wallet addresses, photos, and timestamps.'
        },
        {
          q: 'Can I delete a student from attendance?',
          a: 'Yes, if you find fraudulent attendance, click the "Remove" button next to the student record. You must confirm the deletion.'
        },
        {
          q: 'How do I delete a session?',
          a: 'Click the "Delete" button on the session card. This will remove the session and all its attendance records permanently.'
        },
        {
          q: 'Will my session persist after logout?',
          a: 'Yes, your login session is saved. You will remain logged in until you click "Logout" or clear browser data.'
        }
      ]
    },
    {
      category: 'Verify Portal',
      icon: 'fa-check-circle',
      color: 'green',
      questions: [
        {
          q: 'How do I view my attendance history?',
          a: 'Connect your MetaMask wallet, enter your email address, and click "View My Attendance". All your attended sessions will be displayed.'
        },
        {
          q: 'What information can I see?',
          a: 'You can see session titles, dates, timestamps, your captured photos, NFT token IDs, and transaction hashes.'
        },
        {
          q: 'Is my attendance data secure?',
          a: 'Yes, all attendance records are cryptographically signed and stored securely in the database with your wallet signature.'
        }
      ]
    }
  ];

  const troubleshooting = [
    {
      issue: 'MetaMask not connecting',
      solution: 'Make sure MetaMask extension is installed and unlocked. Refresh the page and try again.',
      icon: 'fa-wallet'
    },
    {
      issue: 'Camera not working',
      solution: 'Allow camera permissions in your browser settings. Make sure no other application is using the camera.',
      icon: 'fa-camera'
    },
    {
      issue: 'QR code not scanning',
      solution: 'Ensure good lighting and hold your device steady. Make sure the QR code is fully visible in the scanner.',
      icon: 'fa-qrcode'
    },
    {
      issue: 'Login failed for instructor',
      solution: 'Verify your wallet address, email, and password. Make sure you are using the correct MetaMask account.',
      icon: 'fa-key'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in-up">
        <div className="inline-block mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/50">
            <i className="fas fa-question-circle text-4xl text-white"></i>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 drop-shadow-lg">
          Help & Support
        </h1>
        <p className="text-lg text-blue-100 max-w-2xl mx-auto">
          Find answers to common questions and get help with AU AccessX
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        <button
          onClick={() => navigate('/student')}
          className="glass-panel rounded-xl p-6 hover:scale-105 transition-transform flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-user-graduate text-xl"></i>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Student Portal</h3>
            <p className="text-sm text-slate-600">Mark attendance</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="glass-panel rounded-xl p-6 hover:scale-105 transition-transform flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-chalkboard-teacher text-xl"></i>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Admin Portal</h3>
            <p className="text-sm text-slate-600">Manage sessions</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/validator')}
          className="glass-panel rounded-xl p-6 hover:scale-105 transition-transform flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center">
            <i className="fas fa-check-circle text-xl"></i>
          </div>
          <div className="text-left">
            <h3 className="font-bold text-slate-800">Verify Portal</h3>
            <p className="text-sm text-slate-600">View history</p>
          </div>
        </button>
      </div>

      {/* FAQs by Category */}
      <div className="space-y-8 mb-12">
        {faqs.map((category, idx) => (
          <div key={idx} className="glass-panel rounded-2xl p-8 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 bg-${category.color}-100 text-${category.color}-600 rounded-xl flex items-center justify-center`}>
                <i className={`fas ${category.icon} text-xl`}></i>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">{category.category}</h2>
            </div>
            <div className="space-y-4">
              {category.questions.map((faq, qIdx) => (
                <div key={qIdx} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-bold text-slate-800 mb-2 flex items-start gap-2">
                    <i className="fas fa-question-circle text-blue-500 mt-1"></i>
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Troubleshooting */}
      <div className="glass-panel rounded-2xl p-8 shadow-xl mb-12">
        <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-3">
          <i className="fas fa-tools text-orange-500"></i>
          Troubleshooting
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {troubleshooting.map((item, idx) => (
            <div key={idx} className="bg-white/60 rounded-xl p-4 border border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className={`fas ${item.icon}`}></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 mb-1">{item.issue}</h3>
                  <p className="text-sm text-slate-600">{item.solution}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Support */}
      <div className="glass-panel rounded-2xl p-8 shadow-xl text-center">
        <i className="fas fa-life-ring text-5xl text-blue-600 mb-4"></i>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Still Need Help?</h2>
        <p className="text-slate-600 mb-6 max-w-2xl mx-auto">
          If you couldn't find the answer you're looking for, please contact your institution's IT support or system administrator.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a
            href="mailto:support@auaccessx.com"
            className="glass-input px-6 py-3 rounded-xl font-semibold text-slate-700 hover:bg-white/60 transition flex items-center gap-2"
          >
            <i className="fas fa-envelope"></i>
            Email Support
          </a>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition flex items-center gap-2"
          >
            <i className="fas fa-home"></i>
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;
