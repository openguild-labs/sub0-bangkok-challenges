import { useEffect, useState } from 'react';
import dedotLogo from './assets/dedot-dark-logo.png';
import { Container, Flex, Heading, Box, Button, Text, Input, FormControl, FormLabel, Spinner } from '@chakra-ui/react';
import { web3Enable, web3Accounts } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';

function App() {
  const [account, setAccount] = useState<{ name: string; address: string } | null>(null);
  const [api, setApi] = useState<ApiPromise | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState<number | string>('');
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // 1. Connect to SubWallet and get account
  const connectWallet = async () => {
    const extensions = await web3Enable('DedotClient');
    if (extensions.length === 0) {
      alert('Please install SubWallet to continue.');
      return;
    }

    const accounts = await web3Accounts();
    if (accounts.length > 0) {
      const { address, meta } = accounts[0];
      setAccount({ address, name: meta.name || 'Unnamed Account' });
    }
  };

  // 3. Initialize DedotClient to connect to Westend testnet
  const connectToNetwork = async () => {
    const provider = new WsProvider('wss://westend-rpc.polkadot.io');
    const apiInstance = await ApiPromise.create({ provider });
    setApi(apiInstance);
  };

  // 4. Fetch & show balance for connected account
  const fetchBalance = async () => {
    if (api && account) {
      const { data: { free } } = await api.query.system.account(account.address);
      setBalance(free.toHuman());
    }
  };

  // 6. Check transaction status and 7. transaction result
  const sendTransaction = async () => {
    if (!api || !account) return;
    setLoading(true);

    try {
      const transfer = api.tx.balances.transfer(destination, amount);
      const unsub = await transfer.signAndSend(account.address, ({ status, dispatchError }) => {
        if (status.isInBlock) {
          setStatus('Transaction included in block');
        } else if (status.isFinalized) {
          setStatus('Transaction finalized');
          unsub();
        }

        if (dispatchError) {
          setStatus('Transaction failed');
          console.error('Error:', dispatchError.toString());
        }
      });
    } catch (error) {
      setStatus('Transaction failed');
      console.error('Transaction error:', error);
    } finally {
      setLoading(false);
    }
  };

  // 8. Subscribe to balance changes
  useEffect(() => {
    if (api && account) {
      const unsub = api.query.system.account(account.address, ({ data: { free } }) => {
        setBalance(free.toHuman());
      });
      return () => unsub();
    }
  }, [api, account]);

  // Initial setup
  useEffect(() => {
    connectToNetwork();
  }, []);

  return (
    <Container maxW='container.md' my={16}>
      <Flex justifyContent='center'>
        <a href='https://dedot.dev' target='_blank' rel='noreferrer'>
          <img width='100' src={dedotLogo} className='logo' alt='Dedot logo' />
        </a>
      </Flex>
      <Heading my={4} textAlign='center'>
        Open Hack Dedot
      </Heading>

      {!account ? (
        <Button onClick={connectWallet} colorScheme='blue' my={4}>
          Connect SubWallet
        </Button>
      ) : (
        <>
          <Box my={4}>
            <Text><strong>Connected Account:</strong> {account.name} ({account.address})</Text>
            <Text><strong>Balance:</strong> {balance || 'Loading...'}</Text>
          </Box>

          <FormControl my={4}>
            <FormLabel>Destination Address</FormLabel>
            <Input
              placeholder='Enter destination address'
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </FormControl>

          <FormControl my={4}>
            <FormLabel>Amount to Transfer</FormLabel>
            <Input
              placeholder='Enter amount to transfer'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </FormControl>

          <Button
            onClick={sendTransaction}
            colorScheme='teal'
            my={4}
            isLoading={loading}
          >
            Send Transaction
          </Button>

          {status && (
            <Text color={status.includes('failed') ? 'red.500' : 'green.500'}>
              {status}
            </Text>
          )}
        </>
      )}
    </Container>
  );
}

export default App;
