import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import WalletConnect from './components/WalletConnect';
import BTCLock from './components/BTCLock';
// We'll create these components next
// import LoanRequest from './components/LoanRequest';
// import LoanDashboard from './components/LoanDashboard';

const App = () => {
  // Application state
  const [currentStep, setCurrentStep] = useState('connect');
  const [walletData, setWalletData] = useState(null);
  const [lockData, setLockData] = useState(null);
  const [loanData, setLoanData] = useState(null);
  const [btcPrice, setBtcPrice] = useState(45000);

  // Simulate BTC price updates
  useEffect(() => {
    const interval = setInterval(() => {
      setBtcPrice(prev => prev + (Math.random() - 0.5) * 1000);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const handleWalletConnect = (wallet) => {
    setWalletData(wallet);
    setCurrentStep('lock');
  };

  const handleLockComplete = (lock) => {
    setLockData(lock);
    setCurrentStep('borrow');
  };

  const handleLoanRequest = (loan) => {
    setLoanData(loan);
    setCurrentStep('manage');
  };

  const resetApp = () => {
    setWalletData(null);
    setLockData(null);
    setLoanData(null);
    setCurrentStep('connect');
  };

  return (
    <Layout>
      <div className="space-y-8">
        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {[
              { key: 'connect', label: 'Connect Wallet', completed: !!walletData },
              { key: 'lock', label: 'Lock BTC', completed: !!lockData },
              { key: 'borrow', label: 'Request Loan', completed: !!loanData },
              { key: 'manage', label: 'Manage Loan', completed: false },
            ].map((step, index) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold ${
                  currentStep === step.key 
                    ? 'bg-blue-600 text-white' 
                    : step.completed 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-300 text-gray-500'
                }`}>
                  {step.completed ? '✓' : index + 1}
                </div>
                <div className="ml-3 text-sm">
                  <div className={`font-semibold ${
                    currentStep === step.key ? 'text-blue-600' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </div>
                </div>
                {index < 3 && (
                  <div className={`ml-4 w-20 h-1 rounded ${
                    step.completed ? 'bg-green-600' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Wallet Status */}
        {walletData && (
          <div className="bg-white rounded-lg shadow-md p-5 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-4 h-4 bg-green-600 rounded-full"></div>
                <div>
                  <div className="font-semibold text-gray-900">
                    Connected via {walletData.provider}
                  </div>
                  <div className="text-sm text-gray-500">
                    {walletData.address.slice(0, 6)}...{walletData.address.slice(-4)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {walletData.balance.toLocaleString()} SUI
                </div>
                <div className="text-sm text-gray-500">
                  BTC: ${btcPrice.toLocaleString()}
                </div>
              </div>
              <button
                onClick={resetApp}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div>
          {currentStep === 'connect' && (
            <WalletConnect onConnect={handleWalletConnect} />
          )}
          
          {currentStep === 'lock' && (
            <BTCLock 
              onLockComplete={handleLockComplete}
              btcPrice={btcPrice}
            />
          )}
          
          {currentStep === 'borrow' && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Request Loan</h2>
              <p className="text-gray-600 mb-6">
                Coming next! This is where users will request loans against their locked BTC.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Available Collateral</h3>
                <div className="space-y-1 text-sm">
                  <div>BTC Locked: {lockData?.btcAmount} BTC</div>
                  <div>USD Value: ${lockData?.usdValue.toLocaleString()}</div>
                  <div>Max Borrow: ${lockData?.maxBorrowAmount.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => setCurrentStep('manage')}
                className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg"
              >
                Continue to Loan Management
              </button>
            </div>
          )}
          
          {currentStep === 'manage' && (
            <div className="bg-white rounded-xl shadow-lg p-8 max-w-2xl mx-auto text-center">
              <h2 className="text-2xl font-bold mb-4">Loan Management</h2>
              <p className="text-gray-600 mb-6">
                Coming next! This is where users will manage their active loans.
              </p>
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">Your Loan</h3>
                <div className="space-y-1 text-sm">
                  <div>Status: Active</div>
                  <div>Amount: $10,000</div>
                  <div>Interest: 8% APR</div>
                  <div>Collateral: {lockData?.btcAmount} BTC</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default App;
