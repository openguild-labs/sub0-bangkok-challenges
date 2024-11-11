import React, { useState, useEffect } from 'react';
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from '@polkadot/extension-inject/types';
import { LegacyClient, WsProvider } from 'dedot';
import { WestendApi, WestendPeopleApi } from '@dedot/chaintypes';
import { WESTEND_PEOPLE } from './networks';
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [client, setClient] = useState<LegacyClient<WestendPeopleApi> | null>(null);

  const [connected, setConnected] = useState<boolean>(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [injected, setInjected] = useState<Injected | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingIden, setIsLoadingIden] = useState<boolean>(false);

  const [destAddress, setDestAddress] = useState<string>('');
  const [amount, setAmount] = useState<number>(1);

  const [displayName, setDisplayName] = useState<any>('');
  const [email, setEmail] = useState<any>('');
  const [discord, setDiscord] = useState<any>('');
  const [identity, setIdentity] = useState<any>();

  //   // 1. Connect to SubWallet
  //   // 2. Show connected account (name & address)

  const connectSubWalletAndShowAccount = async (): Promise<InjectedAccount[]> => {
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

  //   // 3. Initialize `DedotClient` to connect to the network (Westend testnet)
  const initializeClient = async (endpoint: string): Promise<LegacyClient<WestendPeopleApi>> => {
    // initialize the client and connect to the network
    const client = new LegacyClient<WestendPeopleApi>(new WsProvider(WESTEND_PEOPLE.endpoint));
    console.log(client);
    await client.connect();

    return client;
  };

  //   // 4. Fetch & show balance for connected account
  const fetchBalance = async (client: LegacyClient<any>, connectedAccounts: InjectedAccount): Promise<string> => {
    //
    const account: InjectedAccount = connectedAccounts; // get from accounts list - 6.2
    const balance: FrameSystemAccountInfo = await client.query.system.account(account.address);

    // Get free/transferable balance
    const freeBalance = formatBalance(balance.data.free, WESTEND_PEOPLE.decimals);
    return freeBalance;
  };

  // 5. Build a form to transfer balance (destination address & amount to transfer)
  const handleTransfer = async () => {
    if (!client || !accounts || !injected) {
      setError('Missing necessary information (client, account, or injected wallet)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Convert the amount (DOT, or WND) to Planck unit
      const amountToTransfer: bigint = BigInt(amount) * BigInt(Math.pow(10, WESTEND_PEOPLE.decimals));

      await client.tx.balances
        .transferKeepAlive(destAddress, amountToTransfer)
        .signAndSend(accounts[0].address, { signer: injected.signer }, (result) => {
          console.log(result.status);

          // 'BestChainBlockIncluded': Transaction is included in the best block of the chain
          // 'Finalized': Transaction is finalized
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

  //   // 6. Check transaction status (in-block & finalized)
  //   // 7. Check transaction result (success or not)
  //   // 8. Subscribe to balance changing

  const subscribeToBalanceChanges = async (
    client: LegacyClient<any>,
    connectedAccounts: InjectedAccount,
  ): Promise<() => void> => {
    try {
      const account: InjectedAccount = connectedAccounts; // get from accounts list - 6.2

      // Pass in a callback to be called whenver the balance is changed/updated
      const unsub = await client.query.system.account(account.address, (balance: FrameSystemAccountInfo) => {
        // Get free/transferable balance
        const freeBalance = formatBalance(balance.data.free, WESTEND_PEOPLE.decimals);
        setBalance(freeBalance);
      });
      return unsub;
    } catch (err) {
      console.error('Failed to subscribe to balance changes', err);
      throw new Error('Failed to subscribe to balance changes');
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
               fetchIdentity(client,accounts[0]);
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
    console.log('🚀 ~ fetchIdentity ~ identity:', identity);
    setIdentity(identity);

  };

  useEffect(() => {
    const setup = async () => {
      try {
        const connectedAccounts = await connectSubWalletAndShowAccount();
        setAccounts(connectedAccounts);

        if (connectedAccounts.length > 0) {
          const dedotClient = await initializeClient(WESTEND_PEOPLE.endpoint);
          setClient(dedotClient);

          const balance = await fetchBalance(dedotClient, connectedAccounts[0]);
          setBalance(balance);

         await fetchIdentity(dedotClient, connectedAccounts[0]);
         
          if (dedotClient) {
            const unsub = await subscribeToBalanceChanges(dedotClient, connectedAccounts[0]);

            // Cleanup khi component unmount
            return () => {
              unsub(); // Hủy đăng ký khi component bị hủy
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
    <div>
      <h1
        style={{
          color: '#333',
          marginBottom: '20px',
        }}>
        Connect to SubWallet
      </h1>
      {error ? (
        <p
          style={{
            color: 'red',
            textAlign: 'center',
            fontWeight: 'bold',
            marginTop: '10px',
          }}>
          {error}
        </p>
      ) : (
        <div>
          {accounts.length > 0 ? (
            <p
              style={{
                fontSize: '16px',
                margin: '8px 0',
                color: '#555',
              }}>
              <strong style={{ color: '#222' }}>Account:</strong> {accounts[0].name || 'Unnamed'} ({accounts[0].address}
              )
            </p>
          ) : (
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                margin: '8px 0',
              }}>
              Loading accounts...
            </p>
          )}

          {balance ? (
            <p
              style={{
                fontSize: '16px',
                margin: '8px 0',
                color: '#555',
              }}>
              <strong style={{ color: '#222' }}>Free Balance:</strong> {balance} WND
            </p>
          ) : (
            <p
              style={{
                fontSize: '14px',
                color: '#666',
                margin: '8px 0',
              }}>
              Loading balance...
            </p>
          )}

          {identity ? (
            <div
              style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '16px',
                backgroundColor: '#f9f9f9',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                maxWidth: '400px',
                margin: '20px auto',
              }}>
              <h2
                style={{
                  textAlign: 'center',
                  color: '#333',
                  borderBottom: '2px solid #ccc',
                  paddingBottom: '8px',
                  marginBottom: '16px',
                }}>
                Identity
              </h2>
              <p
                style={{
                  fontSize: '16px',
                  margin: '8px 0',
                  color: '#555',
                }}>
                <strong style={{ color: '#222' }}>Display Name:</strong> {identity[0].info.display.value || 'N/A'}
              </p>
              <p
                style={{
                  fontSize: '16px',
                  margin: '8px 0',
                  color: '#555',
                }}>
                <strong style={{ color: '#222' }}>Email:</strong> {identity[0].info.email.value || 'N/A'}
              </p>
              <p
                style={{
                  fontSize: '16px',
                  margin: '8px 0',
                  color: '#555',
                }}>
                <strong style={{ color: '#222' }}>Discord:</strong> {identity[0].info.discord.value || 'N/A'}
              </p>
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: '#666' }}>Loading identity...</p>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: '100%',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              marginBottom: '10px',
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              gap: '2px',
            }}>
            <h1>Transfer Funds</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                Destination Address:
                <input
                  style={{
                    border: '1px solid',
                    padding: '4px',
                    marginBottom: '10px',
                    width: '300px',
                    borderRadius: '5px',
                    outline: 'none',
                  }}
                  type='text'
                  value={destAddress}
                  onChange={(e) => setDestAddress(e.target.value)}
                  placeholder='Enter destination address'
                />
              </label>
            </div>
            <div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                Amount:
                <input
                  style={{
                    border: '1px solid',
                    padding: '4px',
                    marginBottom: '10px',
                    width: '300px',
                    borderRadius: '5px',
                    outline: 'none',
                  }}
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder='Enter amount to transfer'
                />
              </label>
            </div>
            <button
              style={{
                backgroundColor: 'green',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                outline: 'none',
                border: 'none',
              }}
              onClick={handleTransfer}
              disabled={isLoading}>
              {isLoading ? 'Transferring...' : 'Transfer'}
            </button>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              width: '100%',
              padding: '20px',
              backgroundColor: '#f5f5f5',
              borderRadius: '5px',
              marginBottom: '10px',
              boxShadow: '0 0 5px rgba(0, 0, 0, 0.2)',
              gap: '2px',
            }}>
            <h1>Identity Information</h1>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                Display Name:
                <input
                  style={{
                    border: '1px solid',
                    padding: '4px',
                    marginBottom: '10px',
                    width: '300px',
                    borderRadius: '5px',
                    outline: 'none',
                  }}
                  type='text'
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </label>
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                Email:
                <input
                  style={{
                    border: '1px solid',
                    padding: '4px',
                    marginBottom: '10px',
                    width: '300px',
                    borderRadius: '5px',
                    outline: 'none',
                  }}
                  type='text'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </label>
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}>
                Discord:
                <input
                  style={{
                    border: '1px solid',
                    padding: '4px',
                    marginBottom: '10px',
                    width: '300px',
                    borderRadius: '5px',
                    outline: 'none',
                  }}
                  type='text'
                  value={discord}
                  onChange={(e) => setDiscord(e.target.value)}
                />
              </label>
            </div>

            <button
              onClick={handleIdentity}
              style={{
                backgroundColor: 'green',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                cursor: 'pointer',
                outline: 'none',
                border: 'none',
              }}
              disabled={isLoadingIden}>
              {isLoadingIden ? 'Identity...' : 'Identity'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
