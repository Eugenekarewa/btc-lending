import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/bcs';

const SUI_NETWORK = 'testnet';
const PACKAGE_ID = '0x1234567890abcdef';
const LENDING_POOL_ID = '0xabcdef1234567890';

interface LoanData {
  btcAmount: number;
  loanAmount: number;
  duration: number;
  btcAddress: string;
  interestRate: number;
}

interface Loan {
  id: string;
  borrower: string;
  btcAmount: number;
  loanAmount: number;
  interestRate: number;
  duration: number;
  startDate: Date;
  dueDate: Date;
  btcAddress: string;
  status: string;
  totalRepayment: number;
}

interface ValidationResult {
  valid: boolean;
  lockTransactionId?: string;
  confirmations?: number;
  lockAmount?: number;
}

class SuiService {
  client: SuiClient;
  keypair: Ed25519Keypair | null;
  address: string | null;

  constructor() {
    this.client = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });
    this.keypair = null;
    this.address = null;
  }

  async connect(privateKey: string | null = null): Promise<{ address: string | null; connected: boolean }> {
    try {
      if (privateKey) {
        this.keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
        this.address = this.keypair.getPublicKey().toSuiAddress();
      } else if ((window as any).suiWallet) {
        const wallet = (window as any).suiWallet;
        await wallet.requestPermissions();
        const accounts = await wallet.getAccounts();
        this.address = accounts[0];
      } else {
        throw new Error('Sui wallet not found');
      }
      return { address: this.address, connected: true };
    } catch (error) {
      console.error('Failed to connect to Sui wallet:', error);
      throw error;
    }
  }

  disconnect(): { connected: false } {
    this.keypair = null;
    this.address = null;
    return { connected: false };
  }

  async getBalance(address: string = this.address!): Promise<{ balance: number; formattedBalance: string }> {
    try {
      const balance = await this.client.getBalance({
        owner: address,
        coinType: '0x2::sui::SUI',
      });
      const rawBalance = Number(balance.totalBalance);
      return {
        balance: rawBalance,
        formattedBalance: (rawBalance / 1e9).toFixed(6),
      };
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }

  async createLoan(loanData: LoanData): Promise<{ success: boolean; transactionHash: string; loanId?: string }> {
    try {
      if (!this.address) throw new Error('Wallet not connected');

      const tx = new Transaction();
      tx.moveCall({
        target: `${PACKAGE_ID}::lending::create_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.pure.u64(BigInt(Math.floor(loanData.btcAmount * 1e8))),
          tx.pure.u64(BigInt(Math.floor(loanData.loanAmount * 1e6))),
          tx.pure.u64(BigInt(loanData.duration)),
          tx.pure.string(loanData.btcAddress),
          tx.pure.u64(BigInt(Math.floor(loanData.interestRate * 1e4))),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair!,
        transaction: tx,
      });

      const loanId = result.objectChanges?.find(obj => obj.type === 'created')?.objectId;
      return { success: true, transactionHash: result.digest, loanId };
    } catch (error) {
      console.error('Failed to create loan:', error);
      throw error;
    }
  }

  async repayLoan(loanId: string, repaymentAmount: number): Promise<{ success: boolean; transactionHash: string }> {
    try {
      if (!this.address) throw new Error('Wallet not connected');

      const tx = new Transaction();
      const coins = await this.client.getCoins({ owner: this.address, coinType: '0x2::sui::SUI' });
      if (coins.data.length === 0) throw new Error('No SUI coins available');

      tx.moveCall({
        target: `${PACKAGE_ID}::lending::repay_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.object(loanId),
          tx.object(coins.data[0].coinObjectId),
          tx.pure.u64(BigInt(Math.floor(repaymentAmount * 1e6))),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair!,
        transaction: tx,
      });

      return { success: true, transactionHash: result.digest };
    } catch (error) {
      console.error('Failed to repay loan:', error);
      throw error;
    }
  }

  async extendLoan(loanId: string, extensionDays: number, extensionFee: number): Promise<{ success: boolean; transactionHash: string }> {
    try {
      if (!this.address) throw new Error('Wallet not connected');

      const tx = new Transaction();
      const coins = await this.client.getCoins({ owner: this.address, coinType: '0x2::sui::SUI' });
      if (coins.data.length === 0) throw new Error('No SUI coins available');

      tx.moveCall({
        target: `${PACKAGE_ID}::lending::extend_loan`,
        arguments: [
          tx.object(LENDING_POOL_ID),
          tx.object(loanId),
          tx.pure.u64(BigInt(extensionDays)),
          tx.object(coins.data[0].coinObjectId),
          tx.pure.u64(BigInt(Math.floor(extensionFee * 1e6))),
        ],
      });

      const result = await this.client.signAndExecuteTransaction({
        signer: this.keypair!,
        transaction: tx,
      });

      return { success: true, transactionHash: result.digest };
    } catch (error) {
      console.error('Failed to extend loan:', error);
      throw error;
    }
  }

  async getLoan(loanId: string): Promise<Loan> {
    try {
      const loanObject = await this.client.getObject({
        id: loanId,
        options: { showType: true, showContent: true },
      });

      if (!loanObject.data || !('fields' in loanObject.data.content)) throw new Error('Loan not found');
      const fields = (loanObject.data.content as any).fields;

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

  async getUserLoans(userAddress: string = this.address!): Promise<Loan[]> {
    try {
      const objects = await this.client.getOwnedObjects({
        owner: userAddress,
        filter: { StructType: `${PACKAGE_ID}::lending::Loan` },
        options: { showType: true, showContent: true },
      });

      return await Promise.all(objects.data.map(async (obj) => {
        if (!obj.data || !('fields' in obj.data.content)) throw new Error('Invalid object data');
        const fields = (obj.data.content as any).fields;
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
      }));
    } catch (error) {
      console.error('Failed to get user loans:', error);
      throw error;
    }
  }

  async getPoolStats() {
    try {
      const poolObject = await this.client.getObject({
        id: LENDING_POOL_ID,
        options: { showType: true, showContent: true },
      });

      if (!poolObject.data || !('fields' in poolObject.data.content)) throw new Error('Invalid pool object');
      const fields = (poolObject.data.content as any).fields;

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

  async validateBTCLock(btcAddress: string, amount: number): Promise<ValidationResult> {
    return {
      valid: true,
      lockTransactionId: 'mock-tx-id',
      confirmations: 6,
      lockAmount: amount,
    };
  }

  subscribeToEvents(callback: (event: any) => void): void {
    this.client.subscribeEvent({
      filter: {
        MoveModule: {
          package: PACKAGE_ID,
          module: 'lending',
        },
      },
      onMessage: callback,
    });
  }

  async getTransaction(transactionHash: string): Promise<any> {
    try {
      return await this.client.getTransactionBlock({
        digest: transactionHash,
        options: { showEffects: true, showEvents: true, showObjectChanges: true },
      });
    } catch (error) {
      console.error('Failed to get transaction:', error);
      throw error;
    }
  }
}

export const suiService = new SuiService();
export { SuiService };

export const formatSuiAmount = (amount: number): string => (Number(amount) / 1e9).toFixed(6);
export const formatUSDAmount = (amount: number): string => (Number(amount) / 1e6).toFixed(2);
export const formatBTCAmount = (amount: number): string => (Number(amount) / 1e8).toFixed(8);
