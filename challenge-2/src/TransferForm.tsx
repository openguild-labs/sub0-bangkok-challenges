import React, { useState } from 'react';
import { DedotClient } from 'dedot';
import { InjectedAccount } from '@polkadot/extension-inject/types';
import { formatBalance } from './utils';
import { WESTEND } from './networks';

interface TransferFormProps {
  client: DedotClient<any> | null;
  accounts: InjectedAccount[];
  injected: any;
  isLoading: boolean;
  setError: (error: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setBalance: (balance: string | null) => void;
}

const TransferForm: React.FC<TransferFormProps> = ({ client, accounts, injected, isLoading, setError, setIsLoading, setBalance }) => {
  const [destAddress, setDestAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);

  const handleTransfer = async () => {
    if (!client || !accounts || !injected) {
      setError('Missing necessary information (client, account, or injected wallet)');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      const amountToTransfer: bigint = BigInt(amount) * BigInt(Math.pow(10, WESTEND.decimals));

      await client.tx.balances
        .transferKeepAlive(destAddress, amountToTransfer)
        .signAndSend(accounts[0].address, { signer: injected.signer }, (result) => {
          console.log(result.status);

          if (result.status.type === 'BestChainBlockIncluded' || result.status.type === 'Finalized') {
            if (result.dispatchError) {
              const error = `${JSON.stringify(Object.values(result.dispatchError))}`;
              setError(`Transaction error: ${error}`);
            } else {
              alert('Transaction successful!');
            }
          }
        });
    } catch (err) {
      console.error('Transfer failed:', err);
      setError('Transfer failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      width: '100%',
      padding: '30px',
      backgroundColor: '#f9f9f9',
      borderRadius: '15px',
      boxShadow: '0 6px 30px rgba(0, 0, 0, 0.15)',
      marginTop: '30px'
    }}>
      <h2 style={{ marginBottom: '35px', color: '#333', fontSize: '34px' }}>Transfer Funds</h2>
      <div style={{ width: '100%' }}>
        <label style={{ display: 'flex', flexDirection: 'column', marginBottom: '15px' }}>
          <span style={{ marginBottom: '8px', fontWeight: 'bold' }}>Destination Address:</span>
          <input
            style={{
              border: '1px solid #007bff',
              padding: '12px',
              borderRadius: '8px',
              outline: 'none',
              backgroundColor: '#ffffff',
              color: '#333',
              transition: 'border-color 0.3s',
            }}
            type='text'
            value={destAddress}
            onChange={(e) => setDestAddress(e.target.value)}
            placeholder='Enter destination address'
            onFocus={(e) => e.target.style.borderColor = '#0056b3'}
            onBlur={(e) => e.target.style.borderColor = '#007bff'}
          />
        </label>
      </div>
      <div style={{ width: '100%' }}>
        <label style={{ display: 'flex', flexDirection: 'column', marginBottom: '10px' }}>
          <span style={{ marginBottom: '5px' }}>Amount:</span>
          <input
            style={{
              border: '1px solid #ccc',
              padding: '10px',
              borderRadius: '5px',
              outline: 'none',
              backgroundColor: '#fafafa',
              color: '#333',
              transition: 'border-color 0.3s',
            }}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder='Enter amount to transfer'
            onFocus={(e) => e.target.style.borderColor = '#007bff'}
            onBlur={(e) => e.target.style.borderColor = '#ccc'}
          />
        </label>
      </div>
      <button
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          borderRadius: '5px',
          cursor: 'pointer',
          outline: 'none',
          border: 'none',
          transition: 'background-color 0.3s',
        }}
        onClick={handleTransfer} disabled={isLoading}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0056b3'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#007bff'}
      >
        {isLoading ? 'Transferring...' : 'Transfer'}
      </button>
    </div>
  );
};

export default TransferForm; 