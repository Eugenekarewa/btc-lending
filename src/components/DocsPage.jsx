import React from 'react';

const DocsPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8 bg-white rounded-lg shadow-lg text-gray-900">
      <h1 className="text-3xl font-bold mb-6">Documentation</h1>
      <p className="mb-4">
        Welcome to the BTC Lending Protocol documentation. Here you will find all the information you need to use the platform effectively.
      </p>
      <h2 className="text-2xl font-semibold mb-3">Getting Started</h2>
      <p className="mb-4">
        Connect your wallet, lock your BTC, and request loans seamlessly.
      </p>
      <h2 className="text-2xl font-semibold mb-3">Features</h2>
      <ul className="list-disc list-inside mb-4">
        <li>Secure Bitcoin collateral locking</li>
        <li>Flexible loan requests with competitive interest rates</li>
        <li>Loan management dashboard</li>
        <li>Real-time BTC price updates</li>
      </ul>
      <h2 className="text-2xl font-semibold mb-3">Support</h2>
      <p>
        For support, please contact our team at support@btclendingprotocol.com.
      </p>
    </div>
  );
};

export default DocsPage;
