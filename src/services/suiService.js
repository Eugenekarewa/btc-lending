import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { Ed25519Keypair } from '@mysten/sui.js/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';

// Configuration
const SUI_NETWORK = 'testnet'; // or 'mainnet' or 'devnet'
const PACKAGE_ID = '0x1234567890abcdef'; // Replace with your package ID
const LENDING_POOL_ID = '0xabcdef1234567890'; // Replace with your lending pool object ID

class SuiService {
  constructor() {
    this.client = new SuiClient({
      url: getFullnodeUrl(SUI_NETWORK),
    });
    this.keypair = null;
    this.address = null;
  }

  // Initialize wallet connection
  async connect(privateKey = null) {
    try {
      if (privateKey) {
        // Connect with private key (for testing)
        this.keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
        this.address = this.keypair.getPublicKey().toSuiAddress();
      } else {
        // Connect with wallet (Sui Wallet, Suiet, etc.)
        if (window.suiWallet) {
          const wallet = window.suiWallet;
          await wallet.requestPermissions();
          const accounts = await wallet.getAccounts();
          this.address = accounts[0];
        } else {
          throw new Error('Sui wallet not found');
        }
      }
      
      return {
        address: this.address,
        connected: true
      };
    } catch (error) {
      console.error('Failed to connect to Sui wallet:', error);
      throw error;
    }
  }

  // Disconnect wallet
  disconnect() {
    this.keypair = null;
    this.address = null;
    return { connected: false };
  }

  // Get account balance
  async getBalance(address = this.address) {
    try {
      const balance = await this.client.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI'
      });
      return {
        balance: balance.totalBalance,
        formattedBalance: (parseInt(balance.totalBalance) / 1e9).toFixed(6)
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  // Create a new loan request
  async createLoan(loanData) {
    try {
      if (!this.address) {
        throw new Error('Wallet not connected');
      }

      const tx = new TransactionBlock();
      
      // Call the create_loan function on the smart contract
      tx.moveCall({
        target: `${PACKAGE_ID}::lending::create_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.pure(loanData.btcAmount * 1e8), // Convert BTC to satoshis
          tx.pure(loanData.loanAmount * 1e6), // Convert USD to micro-dollars
          tx.pure(loanData.duration),
          tx.pure(loanData.btcAddress),
          tx.pure(loanData.interestRate * 1e4), // Convert percentage to basis points
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
      });

      return {
        success: true,
        transactionHash: result.digest,
        loanId: result.effects?.created?.[0]?.reference?.objectId,
      };
    } catch (error) {
      console.error('Failed to create loan:', error);
      throw error;
    }
  }

  // Repay a loan
  async repayLoan(loanId, repaymentAmount) {
    try {
      if (!this.address) {
        throw new Error('Wallet not connected');
      }

      const tx = new TransactionBlock();
      
      // Get SUI coins for payment
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: '0x2::sui::SUI'
      });

      if (coins.data.length === 0) {
        throw new Error('No SUI coins available for repayment');
      }

      // Call the repay_loan function
      tx.moveCall({
        target: `${PACKAGE_ID}::lending::repay_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.object(loanId),
          tx.object(coins.data[0].coinObjectId),
          tx.pure(repaymentAmount * 1e6), // Convert to micro-dollars
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
      });

      return {
        success: true,
        transactionHash: result.digest,
      };
    } catch (error) {
      console.error('Failed to repay loan:', error);
      throw error;
    }
  }

  // Extend loan duration
  async extendLoan(loanId, extensionDays, extensionFee) {
    try {
      if (!this.address) {
        throw new Error('Wallet not connected');
      }

      const tx = new TransactionBlock();
      
      // Get SUI coins for extension fee
      const coins = await this.client.getCoins({
        owner: this.address,
        coinType: '0x2::sui::SUI'
      });

      if (coins.data.length === 0) {
        throw new Error('No SUI coins available for extension fee');
      }

      // Call the extend_loan function
      tx.moveCall({
        target: `${PACKAGE_ID}::lending::extend_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.object(loanId),
          tx.pure(extensionDays),
          tx.object(coins.data[0].coinObjectId),
          tx.pure(extensionFee * 1e6), // Convert to micro-dollars
        ],
      });

      const result = await this.client.signAndExecuteTransactionBlock({
        signer: this.keypair,
        transactionBlock: tx,
      });

      return {
        success: true,
        transactionHash: result.digest,
      };
    } catch (error) {
      console.error('Failed to extend loan:', error);
      throw error;
    }
  }

  // Get loan details
  async getLoan(loanId) {
    try {
      const loanObject = await this.client.getObject({
        id: loanId,
        options: {
          showType: true,
          showContent: true,
        },
      });

      if (!loanObject.data) {
        throw new Error('Loan not found');
      }

      const fields = loanObject.data.content.fields;
      
      return {
        id: loanId,
        borrower: fields.borrower,
        btcAmount: parseInt(fields.btc_amount) / 1e8,
        loanAmount: parseInt(fields.loan_amount) / 1e6,
        interestRate: parseInt(fields.interest_rate) / 1e4,
        duration: parseInt(fields.duration),
        startDate: new Date(parseInt(fields.start_date)),
        dueDate: new Date(parseInt(fields.due_date)),
        btcAddress: fields.btc_address,
        status: fields.status,
        totalRepayment: parseInt(fields.total_repayment) / 1e6,
      };
    } catch (error) {
      console.error('Failed to get loan:', error);
      throw error;
    }
  }

  // Get all loans for a user
  async getUserLoans(userAddress = this.address) {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: {
          StructType: `${PACKAGE_ID}::lending::Loan`
        },
        options: {
          showType: true,
          showContent: true,
        },
      });

      const loans = await Promise.all(
        objects.data.map(async (obj) => {
          const fields = obj.data.content.fields;
          return {
            id: obj.data.objectId,
            borrower: fields.borrower,
            btcAmount: parseInt(fields.btc_amount) / 1e8,
            loanAmount: parseInt(fields.loan_amount) / 1e6,
            interestRate: parseInt(fields.interest_rate) / 1e4,
            duration: parseInt(fields.duration),
            startDate: new Date(parseInt(fields.start_date)),
            dueDate: new Date(parseInt(fields.due_date)),
            btcAddress: fields.btc_address,
            status: fields.status,
            totalRepayment: parseInt(fields.total_repayment) / 1e6,
          };
        })
      );

      return loans;
    } catch (error) {
      console.error('Failed to get user loans:', error);
      throw error;
    }
  }

  // Get lending pool statistics
  async getPoolStats() {
    try {
      const poolObject = await this.client.getObject({
        id: LENDING_POOL_ID,
        options: {
          showType: true,
          showContent: true,
        },
      });

      if (!poolObject.data) {
        throw new Error('Lending pool not found');
      }

      const fields = poolObject.data.content.fields;
      
      return {
        totalLoans: parseInt(fields.total_loans),
        totalBorrowed: parseInt(fields.total_borrowed) / 1e6,
        totalCollateral: parseInt(fields.total_collateral) / 1e8,
        activeLoanCount: parseInt(fields.active_loan_count),
        averageInterestRate: parseInt(fields.avg_interest_rate) / 1e4,
      };
    } catch (error) {
      console.error('Failed to get pool stats:', error);
      throw error;
    }
  }

  // Check if BTC address is valid for locking
  async validateBTCLock(btcAddress, amount) {
    try {
      // This would integrate with a Bitcoin service to verify the lock
      // For now, we'll simulate the validation
      return {
        valid: true,
        lockTransactionId: 'mock-tx-id',
        confirmations: 6,
        lockAmount: amount,
      };
    } catch (error) {
      console.error('Failed to validate BTC lock:', error);
      throw error;
    }
  }

  // Listen for transaction events
  subscribeToEvents(callback) {
    // Subscribe to events from the lending contract
    this.client.subscribeEvent({
      filter: {
        Package: PACKAGE_ID,
      },
      onMessage: (event) => {
        callback(event);
      },
    });
  }

  // Get transaction details
  async getTransaction(transactionHash) {
    try {
      const transaction = await this.client.getTransactionBlock({
        digest: transactionHash,
        options: {
          showEffects: true,
          showEvents: true,
          showObjectChanges: true,
        },
      });

      return transaction;
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const suiService = new SuiService();

// Export class for testing
export { SuiService };

// Helper functions
export const formatSuiAmount = (amount) => {
  return (parseInt(amount) / 1e9).toFixed(6);
};

export const formatUSDAmount = (amount) => {
  return (parseInt(amount) / 1e6).toFixed(2);
};

export const formatBTCAmount = (amount) => {
  return (parseInt(amount) / 1e8).toFixed(8);
};