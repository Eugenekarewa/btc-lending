import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import WalletConnect from './components/WalletConnect';
import BTCLock from './components/BTCLock';
import LoanRequest from './components/LoanRequest';
import LoanDashboard from './components/LoanDashboard';
import LandingPage from './components/LandingPage';
import DocsPage from './components/DocsPage';

const App = () => {
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
  };

  const handleLockComplete = (lock) => {
    setLockData(lock);
  };

  const handleLoanRequest = (loan) => {
    setLoanData(loan);
  };

  const resetApp = () => {
    setWalletData(null);
    setLockData(null);
    setLoanData(null);
  };

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/dashboard"
            element={
              <LoanDashboard
                loans={loanData ? [loanData] : []}
                onRepayLoan={() => {}}
                onExtendLoan={() => {}}
                btcPrice={btcPrice}
              />
            }
          />
          <Route
            path="/loans"
            element={
              <LoanRequest
                lockData={lockData || { btcAmount: 0 }}
                onLoanRequest={handleLoanRequest}
                btcPrice={btcPrice}
              />
            }
          />
          <Route path="/docs" element={<DocsPage />} />
          <Route
            path="/connect"
            element={
              <WalletConnect onConnect={handleWalletConnect} />
            }
          />
          <Route
            path="/lock"
            element={
              <BTCLock
                onLockComplete={handleLockComplete}
                btcPrice={btcPrice}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;
