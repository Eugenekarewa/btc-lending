import React, { useState, useEffect } from 'react';
import { Bitcoin, Lock, AlertTriangle, CheckCircle, Copy } from 'lucide-react';

const BTCLock = ({ onLockComplete, btcPrice = 45000 }) => {
  const [btcAmount, setBtcAmount] = useState('');
  const [isLocking, setIsLocking] = useState(false);
  const [lockStep, setLockStep] = useState('input'); // input, generate, confirm, locked
  const [btcAddress, setBtcAddress] = useState('');
  const [copied, setCopied] = useState(false);

  const usdValue = btcAmount ? parseFloat(btcAmount) * btcPrice : 0;
  const maxBorrowAmount = usdValue * 0.7; // 70% LTV

  const generateBTCAddress = () => {
    // Generate a mock Bitcoin address (in real app, this would be a real address)
    const mockAddress = 'bc1q' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    setBtcAddress(mockAddress);
    setLockStep('generate');
  };

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(btcAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy address:', err);
    }
  };

  const confirmLock = async () => {
    setIsLocking(true);
    
    try {
      // Simulate waiting for Bitcoin confirmation
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const lockData = {
        btcAmount: parseFloat(btcAmount),
        usdValue,
        maxBorrowAmount,
        btcAddress,
        lockTimestamp: new Date().toISOString(),
        txId: '0x' + Math.random().toString(16).substr(2, 64),
      };
      
      setLockStep('locked');
      onLockComplete(lockData);
    } catch (error) {
      console.error('Lock failed:', error);
    } finally {
      setIsLocking(false);
    }
  };

  const simulateReceived = () => {
    // Simulate BTC received
    setLockStep('confirm');
  };

  return (
    <div className="card max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-8">
        <div className="mx-auto mb-4 p-3 bg-orange-100 rounded-full w-fit">
          <Bitcoin className="text-orange-600" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Lock Bitcoin Collateral
        </h2>
        <p className="text-gray-600">
          Secure your Bitcoin to enable borrowing on Sui
        </p>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-center mb-8">
        <div className="flex items-center space-x-2">
          {['input', 'generate', 'confirm', 'locked'].map((step, index) => (
            <React.Fragment key={step}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                lockStep === step ? 'bg-orange-500 text-white' : 
                ['input', 'generate', 'confirm', 'locked'].indexOf(lockStep) > index ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {['input', 'generate', 'confirm', 'locked'].indexOf(lockStep) > index ? 
                  <CheckCircle size={16} /> : index + 1
                }
              </div>
              {index < 3 && <div className="w-8 h-0.5 bg-gray-200" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step 1: Input Amount */}
      {lockStep === 'input' && (
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bitcoin Amount to Lock
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.00001"
                value={btcAmount}
                onChange={(e) => setBtcAmount(e.target.value)}
                placeholder="0.1"
                className="input"
              />
              <div className="absolute right-3 top-3 text-gray-500">
                BTC
              </div>
            </div>
          </div>

          {btcAmount && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">BTC Amount:</span>
                <span className="font-medium">{btcAmount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">USD Value:</span>
                <span className="font-medium">${usdValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Max Borrow Amount:</span>
                <span className="font-medium">${maxBorrowAmount.toLocaleString()}</span>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-blue-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-blue-800 mb-1">Important Notes</h4>
                <ul className="text-sm text-blue-600 space-y-1">
                  <li>• Your Bitcoin will be locked in a secure multi-sig wallet</li>
                  <li>• You can borrow up to 70% of your Bitcoin's value</li>
                  <li>• Interest rate: 8% APR</li>
                  <li>• Minimum lock amount: 0.001 BTC</li>
                </ul>
              </div>
            </div>
          </div>

          <button
            onClick={generateBTCAddress}
            disabled={!btcAmount || parseFloat(btcAmount) < 0.001}
            className="btn btn-primary w-full"
          >
            Generate Lock Address
          </button>
        </div>
      )}

      {/* Step 2: Generate Address */}
      {lockStep === 'generate' && (
        <div className="space-y-6">
          <div className="text-center">
            <Lock className="mx-auto mb-4 text-orange-500" size={48} />
            <h3 className="text-lg font-semibold mb-2">Send Bitcoin to Lock Address</h3>
            <p className="text-gray-600 mb-4">
              Send exactly {btcAmount} BTC to the address below
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Lock Address:</span>
              <button
                onClick={copyAddress}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
              >
                <Copy size={16} />
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <div className="bg-white p-3 rounded border font-mono text-sm break-all">
              {btcAddress}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-yellow-600 mt-0.5" size={20} />
              <div>
                <h4 className="font-medium text-yellow-800 mb-1">Important</h4>
                <p className="text-sm text-yellow-600">
                  Only send the exact amount ({btcAmount} BTC) to this address. 
                  Any other amount will not be recognized.
                </p>
              </div>
            </div>
          </div>

          {/* For demo purposes, let's add a simulate button */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-500 mb-2">Demo Mode:</p>
            <button
              onClick={simulateReceived}
              className="w-full bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Simulate BTC Received
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Confirm Lock */}
      {lockStep === 'confirm' && (
        <div className="space-y-6">
          <div className="text-center">
            <CheckCircle className="mx-auto mb-4 text-green-500" size={48} />
            <h3 className="text-lg font-semibold mb-2">Bitcoin Received!</h3>
            <p className="text-gray-600 mb-4">
              Confirm to lock your Bitcoin and enable borrowing
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Amount Received:</span>
                <div className="font-medium">{btcAmount} BTC</div>
              </div>
              <div>
                <span className="text-gray-600">USD Value:</span>
                <div className="font-medium">${usdValue.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Max Borrow:</span>
                <div className="font-medium text-green-600">${maxBorrowAmount.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <div className="font-medium text-green-600">Ready to Lock</div>
              </div>
            </div>
          </div>

          <button
            onClick={confirmLock}
            disabled={isLocking}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isLocking ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Confirming Lock...
              </>
            ) : (
              <>
                <Lock size={20} />
                Confirm Lock
              </>
            )}
          </button>
        </div>
      )}

      {/* Step 4: Locked */}
      {lockStep === 'locked' && (
        <div className="text-center space-y-6">
          <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
            <CheckCircle className="text-green-600" size={48} />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-green-800 mb-2">
              Bitcoin Successfully Locked!
            </h3>
            <p className="text-gray-600">
              Your collateral is now secured and ready for borrowing
            </p>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span>Locked Amount:</span>
                <span className="font-medium">{btcAmount} BTC</span>
              </div>
              <div className="flex justify-between">
                <span>Collateral Value:</span>
                <span className="font-medium">${usdValue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Available to Borrow:</span>
                <span className="font-medium text-green-600">${maxBorrowAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BTCLock;