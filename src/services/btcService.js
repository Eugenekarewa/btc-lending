import axios from 'axios';

// Configuration
const BLOCKSTREAM_API = 'https://blockstream.info/api';
const BLOCKSTREAM_TESTNET_API = 'https://blockstream.info/testnet/api';
const MEMPOOL_API = 'https://mempool.space/api';
const BTCPAY_SERVER_URL = process.env.REACT_APP_BTCPAY_SERVER_URL || 'http://localhost:23000';

// Use testnet for development
const USE_TESTNET = process.env.NODE_ENV === 'development';
const BASE_API = USE_TESTNET ? BLOCKSTREAM_TESTNET_API : BLOCKSTREAM_API;

class BTCService {
  constructor() {
    this.network = USE_TESTNET ? 'testnet' : 'mainnet';
    this.apiClient = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get current BTC price
  async getBTCPrice() {
    try {
      const response = await this.apiClient.get('https://api.coindesk.com/v1/bpi/currentprice.json');
      const price = parseFloat(response.data.bpi.USD.rate.replace(',', ''));
      return {
        price,
        currency: 'USD',
        timestamp: new Date(response.data.time.updated),
      };
    } catch (error) {
      console.error('Failed to get BTC price:', error);
      // Fallback to CoinGecko API
      try {
        const response = await this.apiClient.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd');
        return {
          price: response.data.bitcoin.usd,
          currency: 'USD',
          timestamp: new Date(),
        };
      } catch (fallbackError) {
        console.error('Fallback price API also failed:', fallbackError);
        throw new Error('Unable to fetch BTC price from any source');
      }
    }
  }

  // Generate a new Bitcoin address for locking funds
  async generateLockAddress(userAddress, loanAmount) {
    try {
      // In a real implementation, this would generate a multi-sig address
      // or use a time-locked contract. For demo purposes, we'll generate a mock address
      const mockAddress = this.generateMockAddress();
      
      return {
        address: mockAddress,
        redeemScript: 'mock-redeem-script',
        lockingConditions: {
          requiredSignatures: 2,
          timelock: Date.now() + (90 * 24 * 60 * 60 * 1000), // 90 days from now
          userAddress,
          loanAmount,
        },
      };
    } catch (error) {
      console.error('Failed to generate lock address:', error);
      throw error;
    }
  }

  // Generate a mock Bitcoin address for demo purposes
  generateMockAddress() {
    const characters = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = USE_TESTNET ? 'tb1q' : 'bc1q';
    
    for (let i = 0; i < 39; i++) {
      address += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    return address;
  }

  // Validate Bitcoin address format
  validateAddress(address) {
    const mainnetRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const bech32Regex = /^bc1[a-z0-9]{39,59}$/;
    const testnetRegex = /^[2mn][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    const testnetBech32Regex = /^tb1[a-z0-9]{39,59}$/;

    if (USE_TESTNET) {
      return testnetRegex.test(address) || testnetBech32Regex.test(address);
    } else {
      return mainnetRegex.test(address) || bech32Regex.test(address);
    }
  }

  // Get address balance
  async getAddressBalance(address) {
    try {
      const response = await this.apiClient.get(`${BASE_API}/address/${address}`);
      return {
        confirmed: response.data.chain_stats.funded_txo_sum,
        unconfirmed: response.data.mempool_stats.funded_txo_sum,
        total: response.data.chain_stats.funded_txo_sum + response.data.mempool_stats.funded_txo_sum,
      };
    } catch (error) {
      console.error('Failed to get address balance:', error);
      throw error;
    }
  }

  // Get address transactions
  async getAddressTransactions(address) {
    try {
      const response = await this.apiClient.get(`${BASE_API}/address/${address}/txs`);
      return response.data.map(tx => ({
        txid: tx.txid,
        confirmed: tx.status.confirmed,
        blockHeight: tx.status.block_height,
        blockTime: tx.status.block_time,
        fee: tx.fee,
        inputs: tx.vin.map(input => ({
          txid: input.txid,
          vout: input.vout,
          value: input.prevout?.value || 0,
          address: input.prevout?.scriptpubkey_address,
        })),
        outputs: tx.vout.map(output => ({
          value: output.value,
          address: output.scriptpubkey_address,
          scriptType: output.scriptpubkey_type,
        })),
      }));
    } catch (error) {
      console.error('Failed to get address transactions:', error);
      throw error;
    }
  }

  // Monitor address for incoming transactions
  async monitorAddress(address, expectedAmount, callback) {
    const checkInterval = 30000; // Check every 30 seconds
    let isMonitoring = true;
    
    const checkForTransaction = async () => {
      try {
        const balance = await this.getAddressBalance(address);
        if (balance.confirmed >= expectedAmount) {
          callback({
            success: true,
            confirmedAmount: balance.confirmed,
            address,
          });
          isMonitoring = false;
          return;
        }
        
        if (balance.unconfirmed >= expectedAmount) {
          callback({
            success: true,
            confirmedAmount: balance.confirmed,
            unconfirmedAmount: balance.unconfirmed,
            address,
            pending: true,
          });
        }
      } catch (error) {
        console.error('Error monitoring address:', error);
        callback({
          success: false,
          error: error.message,
          address,
        });
        isMonitoring = false;
      }
    };

    // Initial check
    await checkForTransaction();
    
    // Set up interval for continuous monitoring
    const intervalId = setInterval(async () => {
      if (!isMonitoring) {
        clearInterval(intervalId);
        return;
      }
      await checkForTransaction();
    }, checkInterval);

    // Return a function to stop monitoring
    return () => {
      isMonitoring = false;
      clearInterval(intervalId);
    };
  }

  // Get transaction details
  async getTransaction(txid) {
    try {
      const response = await this.apiClient.get(`${BASE_API}/tx/${txid}`);
      return {
        txid: response.data.txid,
        confirmed: response.data.status.confirmed,
        blockHeight: response.data.status.block_height,
        blockTime: response.data.status.block_time,
        confirmations: response.data.status.confirmed ? 
          (await this.getBlockHeight()) - response.data.status.block_height + 1 : 0,
        fee: response.data.fee,
        size: response.data.size,
        weight: response.data.weight,
        inputs: response.data.vin.map(input => ({
          txid: input.txid,
          vout: input.vout,
          value: input.prevout?.value || 0,
          address: input.prevout?.scriptpubkey_address,
        })),
        outputs: response.data.vout.map(output => ({
          value: output.value,
          address: output.scriptpubkey_address,
          scriptType: output.scriptpubkey_type,
        })),
      };
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }

  // Get current block height
  async getBlockHeight() {
    try {
      const response = await this.apiClient.get(`${BASE_API}/blocks/tip/height`);
      return response.data;
    } catch (error) {
      console.error('Failed to get block height:', error);
      throw error;
    }
  }

  // Estimate transaction fee
  async estimateFee(targetBlocks = 6) {
    try {
      const response = await this.apiClient.get(`${BASE_API}/fee-estimates`);
      return {
        fastestFee: response.data['1'] || 20,
        halfHourFee: response.data['3'] || 15,
        hourFee: response.data['6'] || 10,
        economyFee: response.data['144'] || 5,
        targetFee: response.data[targetBlocks.toString()] || 10,
      };
    } catch (error) {
      console.error('Failed to estimate fee:', error);
      return {
        fastestFee: 20,
        halfHourFee: 15,
        hourFee: 10,
        economyFee: 5,
        targetFee: 10,
      };
    }
  }

  // Create a lock transaction (this would be more complex in a real implementation)
  async createLockTransaction(fromAddress, toAddress, amount, privateKey) {
    try {
      // In a real implementation, this would create and broadcast a Bitcoin transaction
      // For demo purposes, we'll simulate the transaction creation
      const mockTxid = this.generateMockTxid();
      
      return {
        txid: mockTxid,
        fromAddress,
        toAddress,
        amount,
        fee: 0.0001, // Mock fee
        status: 'pending',
        confirmations: 0,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to create lock transaction:', error);
      throw error;
    }
  }

  // Generate a mock transaction ID
  generateMockTxid() {
    const chars = '0123456789abcdef';
    let txid = '';
    for (let i = 0; i < 64; i++) {
      txid += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return txid;
  }

  // Verify lock transaction
  async verifyLockTransaction(txid, expectedAddress, expectedAmount) {
    try {
      const transaction = await this.getTransaction(txid);
      
      // Check if transaction sends to expected address
      const output = transaction.outputs.find(out => out.address === expectedAddress);
      if (!output) {
        return {
          valid: false,
          reason: 'Transaction does not send to expected address',
        };
      }

      // Check if amount matches
      if (output.value < expectedAmount) {
        return {
          valid: false,
          reason: 'Transaction amount is less than expected',
        };
      }

      // Check confirmations
      if (transaction.confirmations < 1) {
        return {
          valid: false,
          reason: 'Transaction not yet confirmed',
          pending: true,
        };
      }

      return {
        valid: true,
        confirmedAmount: output.value,
        confirmations: transaction.confirmations,
        blockHeight: transaction.blockHeight,
      };
    } catch (error) {
      console.error('Failed to verify lock transaction:', error);
      return {
        valid: false,
        reason: error.message,
      };
    }
  }

  // Release locked funds (for loan repayment)
  async releaseLockFunds(lockAddress, destinationAddress, amount, redeemScript) {
    try {
      // In a real implementation, this would create a transaction to release the locked funds
      // This would require multi-signature or time-lock conditions to be met
      
      const mockTxid = this.generateMockTxid();
      
      return {
        txid: mockTxid,
        fromAddress: lockAddress,
        toAddress: destinationAddress,
        amount,
        fee: 0.0001,
        status: 'pending',
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to release lock funds:', error);
      throw error;
    }
  }

  // Get network stats
  async getNetworkStats() {
    try {
      const [height, difficulty, hashrate] = await Promise.all([
        this.getBlockHeight(),
        this.apiClient.get(`${BASE_API}/blocks/tip`).then(r => r.data.difficulty),
        this.apiClient.get(`${MEMPOOL_API}/v1/mining/hashrate/3d`).then(r => r.data.currentHashrate),
      ]);

      return {
        blockHeight: height,
        difficulty,
        hashrate,
        network: this.network,
      };
    } catch (error) {
      console.error('Failed to get network stats:', error);
      throw error;
    }
  }

  // Convert satoshis to BTC
  satoshisToBTC(satoshis) {
    return satoshis / 100000000;
  }

  // Convert BTC to satoshis
  btcToSatoshis(btc) {
    return Math.round(btc * 100000000);
  }

  // Format BTC amount
  formatBTC(amount, decimals = 8) {
    return parseFloat(amount).toFixed(decimals);
  }

  // Check if amount is dust (too small to be economical)
  isDustAmount(amount) {
    const dustThreshold = 546; // satoshis
    return this.btcToSatoshis(amount) < dustThreshold;
  }
}

// Export singleton instance
export const btcService = new BTCService();

// Export class for testing
export { BTCService };

// Helper functions
export const formatBTCAmount = (amount, decimals = 8) => {
  return parseFloat(amount).toFixed(decimals);
};

export const formatSatoshis = (satoshis) => {
  return (satoshis / 100000000).toFixed(8);
};

export const isValidBTCAddress = (address) => {
  return btcService.validateAddress(address);
};