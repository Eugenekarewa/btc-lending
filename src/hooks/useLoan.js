import { useState, useEffect, useCallback } from 'react';
import { 
  LENDING_CONFIG, 
  LOAN_STATUS, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES,
  STORAGE_KEYS,
  FEATURE_FLAGS 
} from '../utils/constants';

const useLoan = () => {
  const [loans, setLoans] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [btcPrice, setBtcPrice] = useState(45000);

  // Load loans from localStorage on mount
  useEffect(() => {
    const loadLoans = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.LOAN_HISTORY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setLoans(Array.isArray(parsed) ? parsed : []);
        }
      } catch (error) {
        console.error('Error loading loans:', error);
        localStorage.removeItem(STORAGE_KEYS.LOAN_HISTORY);
      }
    };

    loadLoans();
  }, []);

  // Save loans to localStorage
  const saveLoans = useCallback((loansData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOAN_HISTORY, JSON.stringify(loansData));
    } catch (error) {
      console.error('Error saving loans:', error);
    }
  }, []);

  // Update BTC price
  const updateBtcPrice = useCallback((newPrice) => {
    setBtcPrice(newPrice);
    
    // Update all active loans with new collateral values
    setLoans(prevLoans => 
      prevLoans.map(loan => {
        if (loan.status === LOAN_STATUS.ACTIVE) {
          const collateralValue = loan.collateralAmount * newPrice;
          const healthFactor = collateralValue / loan.loanAmount;
          const liquidationRisk = healthFactor < LENDING_CONFIG.LIQUIDATION_THRESHOLD;
          
          return {
            ...loan,
            collateralValue,
            healthFactor,
            liquidationRisk,
            updatedAt: new Date().toISOString(),
          };
        }
        return loan;
      })
    );
  }, []);

  // Calculate loan parameters
  const calculateLoanParams = useCallback((btcAmount, btcPrice) => {
    const collateralValue = btcAmount * btcPrice;
    const maxLoanAmount = collateralValue * LENDING_CONFIG.LOAN_TO_VALUE_RATIO;
    const dailyInterestRate = LENDING_CONFIG.INTEREST_RATE / 365;
    
    return {
      collateralValue,
      maxLoanAmount,
      dailyInterestRate,
      liquidationThreshold: collateralValue * LENDING_CONFIG.LIQUIDATION_THRESHOLD,
    };
  }, []);

  // Create new loan
  const createLoan = useCallback(async (loanRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const { btcAmount, loanAmount, walletAddress } = loanRequest;
      
      // Validate loan parameters
      const loanParams = calculateLoanParams(btcAmount, btcPrice);
      
      if (loanAmount > loanParams.maxLoanAmount) {
        throw new Error(ERROR_MESSAGES.LOAN_AMOUNT_TOO_HIGH);
      }

      if (btcAmount < LENDING_CONFIG.MINIMUM_BTC_LOCK) {
        throw new Error(ERROR_MESSAGES.AMOUNT_TOO_LOW);
      }

      // In demo mode, simulate loan creation
      if (FEATURE_FLAGS.ENABLE_DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const newLoan = {
          id: 'loan-' + Date.now(),
          walletAddress,
          loanAmount,
          collateralAmount: btcAmount,
          collateralValue: loanParams.collateralValue,
          interestRate: LENDING_CONFIG.INTEREST_RATE,
          status: LOAN_STATUS.ACTIVE,
          createdAt: new Date().toISOString(),
          dueDate: new Date(Date.now() + LENDING_CONFIG.MAXIMUM_LOAN_DURATION * 24 * 60 * 60 * 1000).toISOString(),
          healthFactor: loanParams.collateralValue / loanAmount,
          liquidationRisk: false,
          totalInterest: 0,
          paidInterest: 0,
          remainingBalance: loanAmount,
          transactionHash: '0x' + Math.random().toString(16).substr(2, 64),
        };

        const updatedLoans = [...loans, newLoan];
        setLoans(updatedLoans);
        saveLoans(updatedLoans);
        
        return newLoan;
      }

      // Real loan creation would go here
      /*
      Example real implementation:
      
      const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
      const { TransactionBlock } = require('@mysten/sui.js/transactions');
      
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      const tx = new TransactionBlock();
      
      // Call smart contract to create loan
      tx.moveCall({
        target: `${CONTRACT_ADDRESSES.LENDING_POOL}::lending::create_loan`,
        arguments: [
          tx.pure(btcAmount),
          tx.pure(loanAmount),
          tx.pure(walletAddress),
        ],
      });
      
      const result = await client.signAndExecuteTransactionBlock({
        transactionBlock: tx,
        signer: keypair,
      });
      */

      throw new Error('Real loan creation not implemented yet');

    } catch (error) {
      console.error('Loan creation error:', error);
      setError(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [btcPrice, loans, calculateLoanParams, saveLoans]);

  // Repay loan
  const repayLoan = useCallback(async (loanId, amount) => {
    setIsLoading(true);
    setError(null);

    try {
      const loan = loans.find(l => l.id === loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== LOAN_STATUS.ACTIVE) {
        throw new Error('Loan is not active');
      }

      if (amount > loan.remainingBalance) {
        throw new Error('Amount exceeds remaining balance');
      }

      // In demo mode, simulate repayment
      if (FEATURE_FLAGS.ENABLE_DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const updatedLoan = {
          ...loan,
          remainingBalance: loan.remainingBalance - amount,
          paidInterest: loan.paidInterest + (amount * 0.1), // Simulate interest portion
          status: loan.remainingBalance - amount <= 0 ? LOAN_STATUS.REPAID : LOAN_STATUS.ACTIVE,
          updatedAt: new Date().toISOString(),
        };

        const updatedLoans = loans.map(l => l.id === loanId ? updatedLoan : l);
        setLoans(updatedLoans);
        saveLoans(updatedLoans);
        
        return updatedLoan;
      }

      // Real repayment would go here
      throw new Error('Real loan repayment not implemented yet');

    } catch (error) {
      console.error('Loan repayment error:', error);
      setError(error.message || ERROR_MESSAGES.TRANSACTION_FAILED);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [loans, saveLoans]);

  // Get loan by ID
  const getLoan = useCallback((loanId) => {
    return loans.find(loan => loan.id === loanId);
  }, [loans]);

  // Get active loans
  const getActiveLoans = useCallback(() => {
    return loans.filter(loan => loan.status === LOAN_STATUS.ACTIVE);
  }, [loans]);

  // Get loans at risk of liquidation
  const getLoansAtRisk = useCallback(() => {
    return loans.filter(loan => 
      loan.status === LOAN_STATUS.ACTIVE && 
      loan.liquidationRisk
    );
  }, [loans]);

  // Calculate total borrowed amount
  const getTotalBorrowed = useCallback(() => {
    return loans
      .filter(loan => loan.status === LOAN_STATUS.ACTIVE)
      .reduce((total, loan) => total + loan.loanAmount, 0);
  }, [loans]);

  // Calculate total collateral value
  const getTotalCollateralValue = useCallback(() => {
    return loans
      .filter(loan => loan.status === LOAN_STATUS.ACTIVE)
      .reduce((total, loan) => total + loan.collateralValue, 0);
  }, [loans]);

  // Calculate portfolio health factor
  const getPortfolioHealthFactor = useCallback(() => {
    const totalCollateral = getTotalCollateralValue();
    const totalBorrowed = getTotalBorrowed();
    
    if (totalBorrowed === 0) return null;
    return totalCollateral / totalBorrowed;
  }, [getTotalCollateralValue, getTotalBorrowed]);

  // Check if liquidation is needed
  const checkLiquidation = useCallback(() => {
    const activeLoans = getActiveLoans();
    const loansToLiquidate = [];

    activeLoans.forEach(loan => {
      if (loan.healthFactor < LENDING_CONFIG.LIQUIDATION_THRESHOLD) {
        loansToLiquidate.push(loan);
      }
    });

    return loansToLiquidate;
  }, [getActiveLoans]);

  // Get loan statistics
  const getLoanStats = useCallback(() => {
    const activeLoans = getActiveLoans();
    const totalLoans = loans.length;
    const repaidLoans = loans.filter(l => l.status === LOAN_STATUS.REPAID).length;
    const liquidatedLoans = loans.filter(l => l.status === LOAN_STATUS.LIQUIDATED).length;

    return {
      totalLoans,
      activeLoans: activeLoans.length,
      repaidLoans,
      liquidatedLoans,
      totalBorrowed: getTotalBorrowed(),
      totalCollateralValue: getTotalCollateralValue(),
      portfolioHealthFactor: getPortfolioHealthFactor(),
      loansAtRisk: getLoansAtRisk().length,
    };
  }, [loans, getActiveLoans, getTotalBorrowed, getTotalCollateralValue, getPortfolioHealthFactor, getLoansAtRisk]);

  return {
    // State
    loans,
    isLoading,
    error,
    btcPrice,

    // Actions
    createLoan,
    repayLoan,
    updateBtcPrice,
    checkLiquidation,

    // Getters
    getLoan,
    getActiveLoans,
    getLoansAtRisk,
    getTotalBorrowed,
    getTotalCollateralValue,
    getPortfolioHealthFactor,
    getLoanStats,

    // Utilities
    calculateLoanParams,
    clearError: () => setError(null),
  };
};

export default useLoan;