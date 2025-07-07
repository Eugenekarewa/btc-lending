import { useState, useEffect, useCallback } from 'react';
import { 
  ZKLOGIN_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  STORAGE_KEYS,
  FEATURE_FLAGS 
} from '../utils/constants';

interface WalletData {
  address: string;
  provider: string;
  balance: number;
  zkProof?: string;
  connectedAt?: string;
}

interface ValidationResult {
  valid: boolean;
  error?: string;
}

const useWallet = () => {
  const [walletData, setWalletData] = useState<WalletData | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load wallet data from localStorage on mount
  useEffect(() => {
    const loadWalletData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
        if (saved) {
          const parsed: WalletData = JSON.parse(saved);
          // Validate the saved data
          if (parsed.address && parsed.provider) {
            setWalletData(parsed);
          }
        }
      } catch (error) {
        console.error('Error loading wallet data:', error);
        localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
      } finally {
        setIsLoading(false);
      }
    };

    loadWalletData();
  }, []);

  // Save wallet data to localStorage
  const saveWalletData = useCallback((data: WalletData) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  }, []);

  // Connect wallet using zkLogin
  const connectWallet = useCallback(async (provider: string): Promise<WalletData> => {
    setIsConnecting(true);
    setError(null);

    try {
      // Find the provider config
      const providerConfig = ZKLOGIN_CONFIG.PROVIDERS.find(p => p.id === provider);
      if (!providerConfig) {
        throw new Error('Invalid provider');
      }

      // In demo mode, simulate the connection
      if (FEATURE_FLAGS.ENABLE_DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockWalletData: WalletData = {
          address: '0x' + Math.random().toString(16).substr(2, 40),
          provider: providerConfig.name,
          balance: Math.random() * 1000000,
          zkProof: 'mock-zk-proof-' + Math.random().toString(36).substr(2, 9),
          connectedAt: new Date().toISOString(),
        };

        setWalletData(mockWalletData);
        saveWalletData(mockWalletData);
        return mockWalletData;
      }

      // Real zkLogin implementation would go here
      throw new Error('Real zkLogin not implemented yet');

    } catch (error) {
      console.error('Wallet connection error:', error);
      setError(ERROR_MESSAGES.WALLET_CONNECTION_FAILED);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, [saveWalletData]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWalletData(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA);
  }, []);

  // Refresh wallet balance
  const refreshBalance = useCallback(async () => {
    if (!walletData?.address) return;

    try {
      if (FEATURE_FLAGS.ENABLE_DEMO_MODE) {
        // Simulate balance refresh
        const updatedWalletData = {
          ...walletData,
          balance: Math.random() * 1000000,
        };
        setWalletData(updatedWalletData);
        saveWalletData(updatedWalletData);
        return;
      }

      // Real balance refresh would go here

    } catch (error) {
      console.error('Balance refresh error:', error);
      setError('Failed to refresh balance');
    }
  }, [walletData, saveWalletData]);

  // Check if wallet is connected
  const isConnected = Boolean(walletData?.address);

  // Get formatted address
  const getFormattedAddress = useCallback((): string => {
    if (!walletData?.address) return '';
    const addr = walletData.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [walletData?.address]);

  // Get formatted balance
  const getFormattedBalance = useCallback((): string => {
    if (!walletData?.balance) return '0';
    return (walletData.balance / 1000000000).toFixed(2); // Convert from MIST to SUI
  }, [walletData?.balance]);

  // Validate transaction
  const validateTransaction = useCallback((amount: number): ValidationResult => {
    if (!isConnected) {
      return { valid: false, error: 'Wallet not connected' };
    }

    if (!walletData?.balance || walletData.balance < amount) {
      return { valid: false, error: ERROR_MESSAGES.INSUFFICIENT_BALANCE };
    }

    return { valid: true };
  }, [isConnected, walletData?.balance]);

  return {
    // State
    walletData,
    isConnecting,
    isLoading,
    error,
    isConnected,

    // Actions
    connectWallet,
    disconnectWallet,
    refreshBalance,
    validateTransaction,

    // Computed values
    formattedAddress: getFormattedAddress(),
    formattedBalance: getFormattedBalance(),

    // Clear error
    clearError: () => setError(null),
  };
};

export default useWallet;
