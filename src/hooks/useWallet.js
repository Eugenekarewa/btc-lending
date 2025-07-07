import { useState, useEffect, useCallback } from 'react';
import { 
  ZKLOGIN_CONFIG, 
  ERROR_MESSAGES, 
  SUCCESS_MESSAGES, 
  STORAGE_KEYS,
  FEATURE_FLAGS 
} from '../utils/constants';

const useWallet = () => {
  const [walletData, setWalletData] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load wallet data from localStorage on mount
  useEffect(() => {
    const loadWalletData = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEYS.WALLET_DATA);
        if (saved) {
          const parsed = JSON.parse(saved);
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
  const saveWalletData = useCallback((data) => {
    try {
      localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving wallet data:', error);
    }
  }, []);

  // Connect wallet using zkLogin
  const connectWallet = useCallback(async (provider) => {
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
        
        const mockWalletData = {
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
      // This is where you'd integrate with @mysten/zklogin
      
      /*
      Example real implementation:
      
      const { SuiClient, getFullnodeUrl } = require('@mysten/sui.js/client');
      const { Ed25519Keypair } = require('@mysten/sui.js/keypairs/ed25519');
      
      // 1. Initialize OAuth flow
      const authUrl = buildAuthUrl(providerConfig);
      const authResult = await initiateOAuthFlow(authUrl);
      
      // 2. Get JWT token
      const jwt = await exchangeCodeForToken(authResult.code, providerConfig);
      
      // 3. Generate zkLogin proof
      const zkProof = await generateZkLoginProof(jwt, providerConfig);
      
      // 4. Derive Sui address
      const suiAddress = await deriveZkLoginAddress(zkProof);
      
      // 5. Get account balance
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      const balance = await client.getBalance({ owner: suiAddress });
      
      const walletData = {
        address: suiAddress,
        provider: providerConfig.name,
        balance: balance.totalBalance,
        zkProof,
        connectedAt: new Date().toISOString(),
      };
      */

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
      /*
      const client = new SuiClient({ url: getFullnodeUrl('testnet') });
      const balance = await client.getBalance({ owner: walletData.address });
      
      const updatedWalletData = {
        ...walletData,
        balance: balance.totalBalance,
      };
      
      setWalletData(updatedWalletData);
      saveWalletData(updatedWalletData);
      */

    } catch (error) {
      console.error('Balance refresh error:', error);
      setError('Failed to refresh balance');
    }
  }, [walletData, saveWalletData]);

  // Check if wallet is connected
  const isConnected = Boolean(walletData?.address);

  // Get formatted address
  const getFormattedAddress = useCallback(() => {
    if (!walletData?.address) return '';
    const addr = walletData.address;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, [walletData?.address]);

  // Get formatted balance
  const getFormattedBalance = useCallback(() => {
    if (!walletData?.balance) return '0';
    return (walletData.balance / 1000000000).toFixed(2); // Convert from MIST to SUI
  }, [walletData?.balance]);

  // Validate transaction
  const validateTransaction = useCallback((amount) => {
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