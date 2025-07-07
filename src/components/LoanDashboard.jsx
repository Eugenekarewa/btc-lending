
import '../index.css'
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Bitcoin, 
  AlertTriangle, 
  TrendingUp, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  CreditCard,
  Shield
} from 'lucide-react';

const LoanDashboard = ({ loans, onRepayLoan, onExtendLoan, btcPrice }) => {
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showRepayModal, setShowRepayModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate summary statistics
  const activeLoansSummary = loans.filter(loan => loan.status === 'active').reduce((acc, loan) => {
    acc.totalBorrowed += loan.loanAmount;
    acc.totalInterest += loan.totalInterest;
    acc.totalRepayment += loan.totalRepayment;
    acc.totalCollateral += loan.collateralValue;
    return acc;
  }, { totalBorrowed: 0, totalInterest: 0, totalRepayment: 0, totalCollateral: 0 });

  const getLoanStatus = (loan) => {
    const now = new Date();
    const dueDate = new Date(loan.dueDate);
    const daysUntilDue = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24));
    
    if (loan.status === 'repaid') {
      return { status: 'Repaid', color: 'text-green-600', bgColor: 'bg-green-50', icon: CheckCircle };
    }
    if (loan.status === 'liquidated') {
      return { status: 'Liquidated', color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle };
    }
    if (daysUntilDue <= 0) {
      return { status: 'Overdue', color: 'text-red-600', bgColor: 'bg-red-50', icon: AlertTriangle };
    }
    if (daysUntilDue <= 7) {
      return { status: 'Due Soon', color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Clock };
    }
    return { status: 'Active', color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle };
  };

  const getHealthFactor = (loan) => {
    const currentCollateralValue = loan.btcAmount * btcPrice;
    return currentCollateralValue / loan.loanAmount;
  };

  const getRiskLevel = (healthFactor) => {
    if (healthFactor >= 2) return { level: 'Low', color: 'text-green-600' };
    if (healthFactor >= 1.5) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'High', color: 'text-red-600' };
  };

  const handleRepayLoan = async (loanId) => {
    setIsProcessing(true);
    try {
      await onRepayLoan(loanId);
      setShowRepayModal(false);
      setSelectedLoan(null);
    } catch (error) {
      console.error('Repayment failed:', error);
      alert('Repayment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExtendLoan = async (loanId, extension) => {
    setIsProcessing(true);
    try {
      await onExtendLoan(loanId, extension);
      setShowExtendModal(false);
      setSelectedLoan(null);
    } catch (error) {
      console.error('Extension failed:', error);
      alert('Extension failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loans.length === 0) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center py-12">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Loans Yet</h2>
          <p className="text-gray-600">Your loan history will appear here once you create your first loan.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Loan Dashboard</h1>
        <p className="text-gray-600">Monitor and manage your Bitcoin-collateralized loans</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Borrowed</h3>
            <DollarSign className="h-5 w-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${activeLoansSummary.totalBorrowed.toLocaleString()}
          </p>
        </div>

        <div className="card border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Interest</h3>
            <TrendingUp className="h-5 w-5 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${activeLoansSummary.totalInterest.toLocaleString()}
          </p>
        </div>

        <div className="card border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Repayment</h3>
            <CreditCard className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${activeLoansSummary.totalRepayment.toLocaleString()}
          </p>
        </div>

        <div className="card border p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-500">Total Collateral</h3>
            <Shield className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            ${activeLoansSummary.totalCollateral.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Loans Table */}
      <div className="card border overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Your Loans</h2>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Loan Details</th>
                <th>Collateral</th>
                <th>Health Factor</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => {
                const loanStatus = getLoanStatus(loan);
                const healthFactor = getHealthFactor(loan);
                const risk = getRiskLevel(healthFactor);
                const StatusIcon = loanStatus.icon;

                return (
                  <tr key={loan.id} className="hover:bg-gray-50">
                    <td>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ${loan.loanAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Interest: ${loan.totalInterest.toFixed(2)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center">
                        <Bitcoin className="h-4 w-4 text-orange-500 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {loan.btcAmount} BTC
                          </div>
                          <div className="text-sm text-gray-500">
                            ${(loan.btcAmount * btcPrice).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className={`text-sm font-medium ${risk.color}`}>
                          {healthFactor.toFixed(2)}
                        </div>
                        <div className={`text-xs ${risk.color}`}>
                          {risk.level} Risk
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="text-sm text-gray-900">
                        {new Date(loan.dueDate).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {Math.ceil((new Date(loan.dueDate) - new Date()) / (1000 * 60 * 60 * 24))} days
                      </div>
                    </td>
                    <td>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${loanStatus.bgColor} ${loanStatus.color}`}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {loanStatus.status}
                      </span>
                    </td>
                    <td className="text-sm font-medium space-x-2">
                      {loan.status === 'active' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowRepayModal(true);
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Repay
                          </button>
                          <button
                            onClick={() => {
                              setSelectedLoan(loan);
                              setShowExtendModal(true);
                            }}
                            className="text-green-600 hover:text-green-900"
                          >
                            Extend
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Repay Modal */}
      {showRepayModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Repay Loan</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to repay this loan? You'll need to pay ${selectedLoan.totalRepayment.toFixed(2)} to release your collateral.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRepayModal(false);
                  setSelectedLoan(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRepayLoan(selectedLoan.id)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Repay Loan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Modal */}
      {showExtendModal && selectedLoan && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Extend Loan</h3>
            <p className="text-gray-600 mb-4">
              Choose how long you want to extend your loan:
            </p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleExtendLoan(selectedLoan.id, 30)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                30 days (+$50 fee)
              </button>
              <button
                onClick={() => handleExtendLoan(selectedLoan.id, 60)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                60 days (+$90 fee)
              </button>
              <button
                onClick={() => handleExtendLoan(selectedLoan.id, 90)}
                disabled={isProcessing}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-left"
              >
                90 days (+$120 fee)
              </button>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowExtendModal(false);
                  setSelectedLoan(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoanDashboard;