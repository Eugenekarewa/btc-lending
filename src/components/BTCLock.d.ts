import React from 'react';

interface LockData {
  btcAmount: number;
  usdValue: number;
  maxBorrowAmount: number;
  btcAddress: string;
  lockTimestamp: string;
  txId: string;
}

interface BTCLockProps {
  onLockComplete: (lockData: LockData) => void;
  btcPrice?: number;
}

declare const BTCLock: React.FC<BTCLockProps>;

export default BTCLock;
