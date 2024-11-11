import React, { useState, useEffect } from 'react';
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from '@polkadot/extension-inject/types';
import { LegacyClient, WsProvider } from 'dedot';
import { WestendPeopleApi } from '@dedot/chaintypes';
import { WESTEND_PEOPLE } from './networks';
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils';
import TransferForm from './TransferForm';
import IdentityDisplay from './IdentityDisplay';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [client, setClient] = useState<LegacyClient<WestendPeopleApi> | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [balance, setBalance] = useState<string | null>(null);
  const [injected, setInjected] = useState<Injected | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [isLoadingIden, setIsLoadingIden] = useState<boolean>(false);

  const [displayName, setDisplayName] = useState<any>('');
  const [email, setEmail] = useState<any>('');
  const [discord, setDiscord] = useState<any>('');
  const [identity, setIdentity] = useState<any>();

  /// 1. Connect to SubWallet
  /// 2. Show connected account (name & address)
  const connectSubWallet = async (): Promise<InjectedAccount[]> => {
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
  const initializeDedotClient = async (endpoint: string): Promise<LegacyClient<WestendPeopleApi>> => {
    // initialize the client
    const client = new LegacyClient<WestendPeopleApi>(new WsProvider(WESTEND_PEOPLE.endpoint));
    console.log('Client initialized', client);

    await client.connect();

    return client;
  };

  /// 4. Fetch & show balance for connected account
  const fetchBalance = async (
    client: LegacyClient<WestendPeopleApi>,
    connectedAccounts: InjectedAccount,
  ): Promise<string> => {
    const account: InjectedAccount = connectedAccounts;
    const balance: FrameSystemAccountInfo = await client.query.system.account(account.address);

    // Get free/transferable balance
    const freeBalance = formatBalance(balance.data.free, WESTEND_PEOPLE.decimals);
    return freeBalance;
  };

  /// 5. Go to TransferForm.tsx

  /// 6. Check transaction status (in-block & finalized)
  /// 7. Check transaction result (success or not)
  /// 8. Subscribe to balance changing

  const subscribeToBalanceChanges = async (
    client: LegacyClient<any>,
    connectedAccounts: InjectedAccount,
  ): Promise<() => void> => {
    try {
      const account: InjectedAccount = connectedAccounts;

      // Subscribe to balance changes
      const unsub = await client.query.system.account(account.address, (balance: FrameSystemAccountInfo) => {
        const freeBalance = formatBalance(balance.data.free, WESTEND_PEOPLE.decimals);
        setBalance(freeBalance);
      });
      return unsub;
    } catch (err) {
      console.error('Balance subscription failed', err);
      throw new Error('Balance subscription failed');
    }
  };

  const handleIdentity = async () => {
    if (!client || !accounts || !injected) {
      setError('Missing necessary information (client, account, or injected wallet)');
      return;
    }

    setIsLoadingIden(true);
    setError(null);

    if (!displayName) {
      alert('Enter displayName!');
      return;
    }

    if (!email) {
      alert('Enter email!');
      return;
    }

    if (!discord) {
      alert('Enter Discord!');
      return;
    }

    console.log({
      display: { type: 'Raw', value: displayName },
      legal: { type: 'None' },
      web: { type: 'None' },
      matrix: { type: 'None' },
      email: { type: 'Raw', value: email },
      image: { type: 'None' },
      twitter: { type: 'None' },
      github: { type: 'None' },
      discord: { type: 'None' },
    });
    try {
      await client.tx.identity
        .setIdentity({
          display: { type: 'Raw', value: displayName },
          legal: { type: 'None' },
          web: { type: 'None' },
          matrix: { type: 'None' },
          email: { type: 'Raw', value: email },
          image: { type: 'None' },
          twitter: { type: 'None' },
          github: { type: 'None' },
          discord: { type: 'Raw', value: discord },
        })
        .signAndSend(accounts[0].address, { signer: injected.signer }, (result) => {
          console.log(result.status);

          // 'BestChainBlockIncluded': Transaction is included in the best block of the chain
          // 'Finalized': Transaction is finalized
          if (result.status.type === 'BestChainBlockIncluded' || result.status.type === 'Finalized') {
            if (result.dispatchError) {
              const error = `${JSON.stringify(Object.values(result.dispatchError))}`;
              setError(`Identity error: ${error}`);
            } else {
              alert('Identity successful!');
              fetchIdentity(client, accounts[0]);
            }
          }
        });
    } catch (err) {
      console.error('Identity failed:', err);
      setError('Identity failed. Please try again.');
    } finally {
      setIsLoadingIden(false);
    }
  };

  //    9. Fetch & render your on-chain identity (via client.query.identity.identityOf)
  const fetchIdentity = async (client: LegacyClient<any>, connectedAccounts: InjectedAccount) => {
    const account: InjectedAccount = connectedAccounts; // get from accounts list - 6.2
    const identity: FrameSystemAccountInfo = await client.query.identity.identityOf(account.address);
    console.log('Identity:', identity);
    setIdentity(identity);
  };

  useEffect(() => {
    const setup = async () => {
      try {
        const connectedAccounts = await connectSubWallet();
        setAccounts(connectedAccounts);

        if (connectedAccounts.length > 0) {
          const dedotClient = await initializeDedotClient(WESTEND_PEOPLE.endpoint);
          setClient(dedotClient);

          const balance = await fetchBalance(dedotClient, connectedAccounts[0]);
          setBalance(balance);

          // Fetch Identity
          await fetchIdentity(dedotClient, connectedAccounts[0]);

          if (dedotClient) {
            const unsub = await subscribeToBalanceChanges(dedotClient, connectedAccounts[0]);

            // Cleanup
            return () => {
              unsub();
            };
          }
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Failed');
      }
    };

    setup();
  }, []);
  return (
    <div
      style={{
        background: 'linear-gradient(to bottom, #e0e0e0, #00f0f8)',
        color: '#333',
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <h1 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '2.5em' }}>
        Connect to SubWallet
      </h1>
      {error ? (
        <div style={{ color: 'red', textAlign: 'center' }}>Error!: Check your wallet!</div>
      ) : (
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          {accounts.length > 0 ? (
            accounts.map((account, index) => (
              <div
                key={index}
                style={{
                  padding: '10px',
                  border: '1px solid #ccc',
                  borderRadius: '5px',
                  marginBottom: '10px',
                  backgroundColor: 'white',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ color: '#333', textAlign: 'center' }}>
                  <strong style={{ display: 'block', marginBottom: '5px' }}>
                    {account.name || 'Unnamed'}
                  </strong>
                  <span style={{ color: '#333' }}>{account.address}</span>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(account.address);
                    alert('Address copied!');
                  }}
                  style={{
                    marginLeft: '10px',
                    padding: '5px 10px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    transition: 'background-color 0.3s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
                >
                  Copy
                </button>
              </div>
            ))
          ) : (
            <p style={{ textAlign: 'center' }}>No accounts connected...</p>
          )}
          {balance ? (
            <p style={{ textAlign: 'center' }}>
              Balance: <strong>{balance} WND</strong>
            </p>
          ) : (
            <p style={{ textAlign: 'center' }}>Balance...</p>
          )}
          {identity ? (
            <IdentityDisplay identity={identity} />
          ) : (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading identity...</p>
          )}

          <TransferForm
            client={client}
            accounts={accounts}
            injected={injected}
            isLoading={isLoading}
            setError={setError}
            setIsLoading={setIsLoading}
            setBalance={setBalance}
          />
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: '100%',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '15px',
              marginTop: '10px',
              marginBottom: '10px',
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              gap: '2px',
            }}
          >
            <h1 style={{ color: '#333', fontSize: '2em', marginBottom: '20px' }}>Identity Information</h1>
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}

            {['Display Name', 'Email', 'Discord'].map((label, index) => (
              <div key={index} style={{ marginBottom: '15px', width: '100%' }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 'bold', color: '#555' }}>
                  {label}:
                  <input
                    style={{
                      border: '1px solid #333',
                      padding: '12px',
                      borderRadius: '8px',
                      outline: 'none',
                      backgroundColor: '#ffffff',
                      color: '#333',
                      transition: 'border-color 0.3s',
                    }}
                    type='text'
                    value={label === 'Display Name' ? displayName : label === 'Email' ? email : discord}
                    onChange={(e) => {
                      if (label === 'Display Name') setDisplayName(e.target.value);
                      if (label === 'Email') setEmail(e.target.value);
                      if (label === 'Discord') setDiscord(e.target.value);
                    }}
                  />
                </label>
              </div>
            ))}

            <button
              onClick={handleIdentity}
              style={{
                backgroundColor: '#007bff',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '5px',
                cursor: 'pointer',
                outline: 'none',
                border: 'none',
                fontSize: '1em',
                transition: 'background-color 0.3s',
              }}
              disabled={isLoadingIden}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0056b3')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#007bff')}
            >
              {isLoadingIden ? 'Identity...' : 'Identity'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
