import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Bitcoin from '../assets/Bitcoin.svg?url';
import WalletConnect from './WalletConnect';

const Layout = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [walletData, setWalletData] = useState(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleConnect = (data) => {
    setWalletData(data);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-gray-100 font-sans">
      
      {/* Header */}
      <header className="backdrop-blur bg-gray-800/80 shadow-md border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center gap-3">
              <img src={Bitcoin} alt="Bitcoin Logo" className="h-9 w-9" />
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                BTC Lending Protocol
              </h1>
            </div>
            {/* Hamburger menu button for mobile */}
            <button
              onClick={toggleMenu}
              className="sm:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-300 hover:text-blue-400 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded={isMenuOpen}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
            {/* Navigation links */}
            <nav
              className={`flex flex-col sm:flex-row justify-center sm:justify-start items-center gap-4 sm:gap-6 ${
                isMenuOpen ? 'block' : 'hidden'
              } sm:flex w-full sm:w-auto`}
            >
              <Link
                to="/dashboard"
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/loans"
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Loans
              </Link>
              <Link
                to="/docs"
                className="text-gray-300 hover:text-blue-400 font-medium transition-colors duration-200"
                onClick={() => setIsMenuOpen(false)}
              >
                Docs
              </Link>
            </nav>
            {/* Wallet connect or wallet info */}
            <div className="ml-4">
              {walletData ? (
                <div className="text-gray-300">
                  Connected: {walletData.provider} ({walletData.address.slice(0, 6)}...
                  {walletData.address.slice(-4)})
                </div>
              ) : (
                <WalletConnect onConnect={handleConnect} />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800/90 backdrop-blur-sm border-t border-gray-700 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>© 2025 BTC Lending Protocol. Built on Sui Network.</p>
            <div className="flex items-center gap-6">
              <span>BTC Price: $109850</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>Network Active</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
