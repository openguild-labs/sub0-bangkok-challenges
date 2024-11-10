import React, { useState, useEffect } from 'react';
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from '@polkadot/extension-inject/types';
import { DedotClient, WsProvider } from 'dedot';
import { WestendApi } from '@dedot/chaintypes';
import { WESTEND } from './networks';
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils';
import TransferForm from './TransferForm';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [client, setClient] = useState<DedotClient<WestendApi> | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [injected, setInjected] = useState<Injected | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  /// 1. Connect to SubWallet
  /// 2. Show connected account (name & address)
  const connectSubWallet= async (): Promise<InjectedAccount[]> => {
    const injectedWindow = window as Window & InjectedWindow;

    // Get subwallet-js injected provider to connect with SubWallet
    const provider: InjectedWindowProvider = injectedWindow.injectedWeb3['subwallet-js'];

    // Connect with SubWallet from the dapp
    const injected: Injected = await provider.enable!('Open Hack Dapp');
    setInjected(injected);
    // Get connected accounts
    const accounts: InjectedAccount[] = await injected.accounts.get();
    return accounts;
  };

  /// 3. Initialize `DedotClient` to connect to the network (Westend testnet)
  const initializeDedotClient = async (endpoint: string): Promise<DedotClient<WestendApi>> => {
    // initialize the client and connect to the network
    const client = new DedotClient<WestendApi>(new WsProvider(WESTEND.endpoint));
    await client.connect();

    return client;
  };

  /// 4. Fetch & show balance for connected account
  const fetchBalance = async (client: DedotClient<any>, connectedAccounts: InjectedAccount): Promise<string> => {
    const account: InjectedAccount = connectedAccounts;
    const balance: FrameSystemAccountInfo = await client.query.system.account(account.address);

    // Get free/transferable balance
    const freeBalance = formatBalance(balance.data.free, WESTEND.decimals);
    return freeBalance;
  };

  /// 6. Check transaction status (in-block & finalized)
  /// 7. Check transaction result (success or not)
  /// 8. Subscribe to balance changing

  const subscribeToBalanceChanges = async (
    client: DedotClient<any>, connectedAccounts: InjectedAccount
  ) : Promise<() => void>  => {
    try {
      const account: InjectedAccount = connectedAccounts; 

      // Subscribe to balance changes
      const unsub = await client.query.system.account(account.address, (balance: FrameSystemAccountInfo) => {
        const freeBalance = formatBalance(balance.data.free, WESTEND.decimals);  
        setBalance(freeBalance);
      });
      return unsub;
    } catch (err) {
      console.error('Failed to subscribe to balance changes', err);
      throw new Error('Failed to subscribe to balance changes');
    }
  };
  useEffect(() => {
    const setup = async () => {
      try {
        const connectedAccounts = await connectSubWallet();
        setAccounts(connectedAccounts);

        if (connectedAccounts.length > 0) {
          const dedotClient = await initializeDedotClient(WESTEND.endpoint);
          setClient(dedotClient);

          const balance = await fetchBalance(dedotClient, connectedAccounts[0]);
          setBalance(balance);

          if(dedotClient) {
            const unsub = await subscribeToBalanceChanges(dedotClient, connectedAccounts[0]);

            // Cleanup
            return () => {
              unsub(); 
            };
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to connect or fetch data');
      }
    };

    setup();
  }, []);
  return (
    <div style={{ background: 'linear-gradient(to bottom, #e0e0e0, #00f0f8)', color: '#333', minHeight: '100vh', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2.5em' }}>Connect to SubWallet</h1>
      {error ? (
        <div style={{ color: '#808088', textAlign: 'center' }}>Check your wallet!</div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {accounts.length > 0 ? (
            accounts.map((account, index) => (
              <p key={index} style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '5px', marginBottom: '10px', backgroundColor: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{account.name || 'Unnamed'} ({account.address})</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(account.address);
                    alert('Address copied!');
                  }} 
                  style={{ marginLeft: '10px', padding: '5px 10px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  Copy
                </button>
              </p>
            ))
          ) : (
            <p style={{ textAlign: 'center' }}>No accounts connected...</p>
          )}
          {balance ? <p style={{ textAlign: 'center' }}>Balance: <strong>{balance} WND</strong></p> : <p style={{ textAlign: 'center' }}>Balance...</p>}
          <TransferForm
            client={client}
            accounts={accounts}
            injected={injected}
            isLoading={isLoading}
            setError={setError}
            setIsLoading={setIsLoading}
            setBalance={setBalance}
          />
        </div>
      )}
    </div>
  );
};

export default App;
