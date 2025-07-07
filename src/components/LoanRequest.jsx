import React, { useState, useEffect } from 'react';
import { DollarSign, Calculator, AlertTriangle, CheckCircle, TrendingUp, Clock } from 'lucide-react';

// Mock constants for demo purposes
const LENDING_CONFIG = {
  LOAN_TO_VALUE_RATIO: 0.7, // 70% LTV
  INTEREST_RATE: 0.08, // 8% annual
  LIQUIDATION_THRESHOLD: 1.3 // 130% collateral ratio
};

const VALIDATION_RULES = {
  LOAN_AMOUNT: {
    min: 1000,
    max: 1000000
  }
};

const LoanRequest = ({ lockData, onLoanRequest, btcPrice }) => {
  const [loanAmount, setLoanAmount] = useState('');
  const [duration, setDuration] = useState(90); // Default 90 days
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Calculate loan parameters
  const collateralValue = lockData.btcAmount * btcPrice;
  const maxLoanAmount = collateralValue * LENDING_CONFIG.LOAN_TO_VALUE_RATIO;
  const dailyInterestRate = LENDING_CONFIG.INTEREST_RATE / 365;
  const loanAmountNum = parseFloat(loanAmount) || 0;
  const totalInterest = loanAmountNum * dailyInterestRate * duration;
  const totalRepayment = loanAmountNum + totalInterest;
  const healthFactor = loanAmountNum > 0 ? collateralValue / loanAmountNum : 0;
  const liquidationPrice = loanAmountNum > 0 ? (loanAmountNum * LENDING_CONFIG.LIQUIDATION_THRESHOLD) / lockData.btcAmount : 0;

  // Validate loan amount
  useEffect(() => {
    const newErrors = {};
    if (loanAmount) {
      const amount = parseFloat(loanAmount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.loanAmount = 'Please enter a valid amount';
      } else if (amount < VALIDATION_RULES.LOAN_AMOUNT.min) {
        newErrors.loanAmount = `Minimum loan amount is $${VALIDATION_RULES.LOAN_AMOUNT.min}`;
      } else if (amount > maxLoanAmount) {
        newErrors.loanAmount = `Maximum loan amount is $${maxLoanAmount.toLocaleString()}`;
      } else if (amount > VALIDATION_RULES.LOAN_AMOUNT.max) {
        newErrors.loanAmount = `Maximum loan amount is $${VALIDATION_RULES.LOAN_AMOUNT.max.toLocaleString()}`;
      }
    }
    setErrors(newErrors);
  }, [loanAmount, maxLoanAmount]);

  const handleSubmit = async () => {
    if (Object.keys(errors).length > 0 || !loanAmount) {
      return;
    }
    setShowConfirmation(true);
  };

  const confirmLoan = async () => {
    setIsSubmitting(true);
    try {
      const loanRequest = {
        btcAmount: lockData.btcAmount,
        loanAmount: loanAmountNum,
        duration,
        collateralValue,
        interestRate: LENDING_CONFIG.INTEREST_RATE,
        totalInterest,
        totalRepayment,
        healthFactor,
        liquidationPrice,
        btcAddress: lockData.btcAddress,
        walletAddress: lockData.walletAddress || 'demo-wallet',
      };
      await onLoanRequest(loanRequest);
      setShowConfirmation(false);
    } catch (error) {
      console.error('Loan request failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRiskLevel = () => {
    if (healthFactor >= 2) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
    if (healthFactor >= 1.5) return { level: 'Medium', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
  };

  const risk = getRiskLevel();

  if (showConfirmation) {
    return (
      <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center mb-6">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Loan Request</h2>
          <p className="text-gray-600">Please review your loan details before confirming</p>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Loan Amount</span>
            <span className="font-semibold text-lg">${loanAmountNum.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Duration</span>
            <span className="font-semibold">{duration} days</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Interest</span>
            <span className="font-semibold">${totalInterest.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Total Repayment</span>
            <span className="font-semibold text-lg">${totalRepayment.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
            <span className="text-gray-600">Health Factor</span>
            <span className={`font-semibold ${risk.color}`}>{healthFactor.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setShowConfirmation(false)}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={confirmLoan}
            disabled={isSubmitting}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Processing...' : 'Confirm Loan'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Bitcoin Loan</h2>
        <p className="text-gray-600">Use your locked Bitcoin as collateral for a USD loan</p>
      </div>

      {/* Collateral Info */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">Your Collateral</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-blue-600">BTC Amount:</span>
            <span className="ml-2 font-semibold">{lockData.btcAmount} BTC</span>
          </div>
          <div>
            <span className="text-blue-600">Current Value:</span>
            <span className="ml-2 font-semibold">${collateralValue.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-blue-600">Max Loan:</span>
            <span className="ml-2 font-semibold">${maxLoanAmount.toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Loan Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount (USD)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="number"
              value={loanAmount}
              onChange={(e) => setLoanAmount(e.target.value)}
              placeholder="Enter amount"
              className={`input ${errors.loanAmount ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.loanAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>
          )}
        </div>

        {/* Duration */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Loan Duration (Days)
          </label>
          <div className="relative">
            <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <select
              value={duration}
              onChange={(e) => setDuration(parseInt(e.target.value))}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>1 year</option>
            </select>
          </div>
        </div>

        {/* Loan Summary */}
        {loanAmountNum > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Calculator className="h-5 w-5 mr-2" />
              Loan Summary
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Interest Rate:</span>
                <span className="ml-2 font-semibold">{(LENDING_CONFIG.INTEREST_RATE * 100).toFixed(2)}% APR</span>
              </div>
              <div>
                <span className="text-gray-600">Total Interest:</span>
                <span className="ml-2 font-semibold">${totalInterest.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Total Repayment:</span>
                <span className="ml-2 font-semibold">${totalRepayment.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-gray-600">Health Factor:</span>
                <span className={`ml-2 font-semibold ${risk.color}`}>{healthFactor.toFixed(2)}</span>
              </div>
            </div>
            
            {/* Risk Warning */}
            <div className={`mt-4 p-3 rounded-lg ${risk.bgColor}`}>
              <div className="flex items-center">
                <AlertTriangle className={`h-5 w-5 mr-2 ${risk.color}`} />
                <span className={`font-semibold ${risk.color}`}>Risk Level: {risk.level}</span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Liquidation Price: ${liquidationPrice.toFixed(2)} per BTC
              </p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={Object.keys(errors).length > 0 || !loanAmount || isSubmitting}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          Request Loan
        </button>
      </div>
    </div>
  );
};

// Mock data for demo
const mockLockData = {
  btcAmount: 0.5,
  btcAddress: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
  walletAddress: 'demo-wallet-address'
};

const mockOnLoanRequest = async (loanRequest) => {
  console.log('Loan request submitted:', loanRequest);
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 2000));
  alert('Loan request submitted successfully!');
};

const LoanRequestComponent = ({ lockData, onLoanRequest, btcPrice }) => {
  // The existing LoanRequest component code remains unchanged
  // (Assuming the entire component code is above this export)
};

export default LoanRequestComponent;
