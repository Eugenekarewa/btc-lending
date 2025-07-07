// Network Configuration
export const NETWORK_CONFIG = {
  SUI_NETWORK: 'testnet', // testnet, mainnet, devnet
  RPC_URL: 'https://fullnode.testnet.sui.io:443',
};

// Lending Protocol Constants
export const LENDING_CONFIG = {
  LOAN_TO_VALUE_RATIO: 0.7, // 70% LTV
  INTEREST_RATE: 0.08, // 8% APR
  LIQUIDATION_THRESHOLD: 0.8, // 80% - when liquidation becomes possible
  MINIMUM_BTC_LOCK: 0.001, // Minimum BTC amount to lock
  MAXIMUM_LOAN_DURATION: 365, // Maximum loan duration in days
  GRACE_PERIOD: 30, // Grace period in days before liquidation
};

// zkLogin Configuration
export const ZKLOGIN_CONFIG = {
  PROVIDERS: [
    {
      id: 'google',
      name: 'Google',
      clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
      scope: 'openid email profile',
    },
    {
      id: 'facebook',
      name: 'Facebook',
      clientId: process.env.REACT_APP_FACEBOOK_CLIENT_ID,
      scope: 'email',
    },
    {
      id: 'twitch',
      name: 'Twitch',
      clientId: process.env.REACT_APP_TWITCH_CLIENT_ID,
      scope: 'user:read:email',
    },
  ],
  REDIRECT_URI: window.location.origin,
  SALT: process.env.REACT_APP_ZKLOGIN_SALT || 'your-salt-here',
};

// Smart Contract Addresses (These would be real addresses after deployment)
export const CONTRACT_ADDRESSES = {
  LENDING_POOL: '0x...', // Main lending pool contract
  BTC_BRIDGE: '0x...', // BTC bridge contract
  PRICE_ORACLE: '0x...', // Price oracle contract
  LIQUIDATION: '0x...', // Liquidation contract
};

// Bitcoin Configuration
export const BTC_CONFIG = {
  NETWORK: 'testnet', // testnet, mainnet
  CONFIRMATION_BLOCKS: 3, // Number of confirmations required
  FEE_RATE: 10, // Satoshis per byte
};

// UI Constants
export const UI_CONFIG = {
  POLLING_INTERVAL: 30000, // 30 seconds
  MAX_RETRIES: 3,
  TIMEOUT: 30000,
  PRICE_UPDATE_INTERVAL: 30000,
};

// Error Messages
export const ERROR_MESSAGES = {
  WALLET_CONNECTION_FAILED: 'Failed to connect wallet. Please try again.',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction.',
  TRANSACTION_FAILED: 'Transaction failed. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  INVALID_AMOUNT: 'Please enter a valid amount.',
  AMOUNT_TOO_LOW: `Minimum amount is ${LENDING_CONFIG.MINIMUM_BTC_LOCK} BTC`,
  LOAN_AMOUNT_TOO_HIGH: 'Loan amount exceeds maximum allowed.',
  COLLATERAL_INSUFFICIENT: 'Insufficient collateral for requested loan.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully!',
  BTC_LOCKED: 'Bitcoin locked successfully!',
  LOAN_REQUESTED: 'Loan requested successfully!',
  LOAN_REPAID: 'Loan repaid successfully!',
  TRANSACTION_CONFIRMED: 'Transaction confirmed!',
};

// Loan Status
export const LOAN_STATUS = {
  PENDING: 'pending',
  ACTIVE: 'active',
  REPAID: 'repaid',
  LIQUIDATED: 'liquidated',
  DEFAULTED: 'defaulted',
};

// Transaction Types
export const TRANSACTION_TYPES = {
  LOCK_BTC: 'lock_btc',
  REQUEST_LOAN: 'request_loan',
  REPAY_LOAN: 'repay_loan',
  LIQUIDATE: 'liquidate',
  WITHDRAW_COLLATERAL: 'withdraw_collateral',
};

// API Endpoints
export const API_ENDPOINTS = {
  BTC_PRICE: 'https://api.coinbase.com/v2/exchange-rates?currency=BTC',
  TRANSACTION_STATUS: '/api/transaction-status',
  LOAN_DATA: '/api/loan-data',
  USER_PROFILE: '/api/user-profile',
};

// Local Storage Keys
export const STORAGE_KEYS = {
  WALLET_DATA: 'btc_lending_wallet_data',
  USER_PREFERENCES: 'btc_lending_user_preferences',
  LOAN_HISTORY: 'btc_lending_loan_history',
  CACHED_PRICE: 'btc_lending_cached_price',
};

// Validation Rules
export const VALIDATION_RULES = {
  BTC_AMOUNT: {
    min: LENDING_CONFIG.MINIMUM_BTC_LOCK,
    max: 100, // Maximum 100 BTC
    decimals: 8,
  },
  LOAN_AMOUNT: {
    min: 100, // Minimum $100 loan
    max: 1000000, // Maximum $1M loan
    decimals: 2,
  },
  ADDRESSES: {
    BTC_ADDRESS_LENGTH: [25, 35, 42, 62], // Valid Bitcoin address lengths
    SUI_ADDRESS_LENGTH: 66, // Sui address length (0x + 64 hex chars)
  },
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_DEMO_MODE: process.env.NODE_ENV === 'development',
  ENABLE_NOTIFICATIONS: true,
  ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
  ENABLE_TESTNET: process.env.REACT_APP_ENABLE_TESTNET === 'true',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

export default {
  NETWORK_CONFIG,
  LENDING_CONFIG,
  ZKLOGIN_CONFIG,
  CONTRACT_ADDRESSES,
  BTC_CONFIG,
  UI_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  LOAN_STATUS,
  TRANSACTION_TYPES,
  API_ENDPOINTS,
  STORAGE_KEYS,
  VALIDATION_RULES,
  FEATURE_FLAGS,
  NOTIFICATION_TYPES,
};