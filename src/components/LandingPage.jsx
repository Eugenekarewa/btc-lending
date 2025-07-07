import React from 'react';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-r from-blue-900 via-purple-900 to-pink-900 text-white px-6">
      <div className="max-w-4xl text-center">
        <h1 className="text-5xl font-extrabold mb-6 drop-shadow-lg">
          Welcome to BTC Lending Protocol
        </h1>
        <p className="text-lg mb-8 drop-shadow-md">
          Secure and transparent Bitcoin-backed loans on the Sui Network.
          Lock your BTC, request loans, and manage your assets with confidence.
        </p>
        <div className="space-x-4">
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors duration-300"
          >
            Go to Dashboard
          </a>
          <a
            href="/"
            className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg shadow-lg transition-colors duration-300"
          >
            Request a Loan
          </a>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
