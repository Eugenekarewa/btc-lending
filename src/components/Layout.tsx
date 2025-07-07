import React, { ReactNode } from 'react';
import Bitcoin from '../assets/Bitcoin.svg?url';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center py-4 gap-4 sm:gap-0">
            <div className="flex items-center gap-2">
              <img src={Bitcoin} alt="Bitcoin Logo" className="h-8 w-8" />
              <h1 className="text-2xl font-bold text-gray-800">
                BTC Lending Protocol
              </h1>
            </div>
            <nav className="flex flex-wrap justify-center sm:justify-start items-center gap-4 sm:gap-6">
              <a href="#" className="text-gray-600 hover:text-blue-600 font-semibold whitespace-nowrap transition-colors duration-300">
                Dashboard
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 font-semibold whitespace-nowrap transition-colors duration-300">
                Loans
              </a>
              <a href="#" className="text-gray-600 hover:text-blue-600 font-semibold whitespace-nowrap transition-colors duration-300">
                Docs
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-600 text-sm">
              © 2025 BTC Lending Protocol. Built on Sui Network.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500">
                BTC Price: $45,000
              </span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Network Active</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
