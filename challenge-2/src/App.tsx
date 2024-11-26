import dedotLogo from './assets/dedot-dark-logo.png';
import { Container, Flex, Heading, Text, Button, Select, Input, FormControl, FormLabel, Box } from '@chakra-ui/react';
import React, { useState, useEffect } from 'react';
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from "@polkadot/extension-inject/types";
import { DedotClient, LegacyClient, WsProvider } from 'dedot';
import { WestendApi, WestendPeopleApi } from '@dedot/chaintypes';
import { WESTEND } from './networks.ts';
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils.ts';

import { PalletIdentityIdentityInfo } from '@dedot/chaintypes/aleph/types';

function App() {
  const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [injectedAcct, setInjectedAcct] = useState<Injected | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<string | null>(null);
  const [addressIdentity, setAddressIdentity] = useState<any | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [discordHandle, setDiscordHandle] = useState("");
  const [client, setClient] = useState<any | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [destAddress, setDestAddress] = useState("");
  const [amountToTransfer, setAmountToTransfer] = useState<string>("");

  useEffect(() => {
    const initializeClient = async () => {
      const client  = new DedotClient<WestendPeopleApi>(new WsProvider(WESTEND.endpoint));
      await client.connect();
      console.log(client.status);
      
      setClient(client);
    };
    initializeClient();
  }, []);

  const connectToSubWalletAndShowAccount = async () => {
    try {
      const injectedWindow = window as Window & InjectedWindow;
      const provider = injectedWindow.injectedWeb3['subwallet-js'];
      
      if (!provider) {
        setErrorMessage("Connection failed, please install SubWallet.");
        return;
      }

      const injected = await provider.enable!('Open Hack Dapp');
      setInjectedAcct(injected);
      const accounts = await injected.accounts.get();
      setAccounts(accounts);
      setIsConnected(true);

      if (accounts.length > 0) {
        const account = accounts[0];
        await updateAccountBalance(account.address);
        await fetchIdentity(account.address);
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  };

  const updateAccountBalance = async (address: string) => {
    if (!client) return;
    try {
      const balance = await client.query.system.account(address);
      setSelectedAccountBalance(formatBalance(balance.data.free, WESTEND.decimals));
    } catch (error) {
      console.error("Error fetching balance:", error);
    }
  };

  const fetchIdentity = async (address: string) => {
    if (!client) return;
    try {
      const identity = await client.query.identity.identityOf(address);
     console.log(identity);
     
     
      if (identity) {
        setAddressIdentity(JSON.stringify(identity[0].info));
        
      
        
        
      } else {
        setIsFormVisible(true);
      }
    } catch (error) {
      console.error("Error fetching identity:", error);
    }
  };

  const handleAccountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const address = event.target.value;
    setSelectedAccount(address);
    updateAccountBalance(address);
    fetchIdentity(address);
  };

  const handleTransfer = async () => {
    if (!client || !injectedAcct || !selectedAccount) return;
    try {
      const amount = BigInt(amountToTransfer) * BigInt(Math.pow(10, WESTEND.decimals));
      await client.tx.balances
        .transferKeepAlive(destAddress, amount)
        .signAndSend(selectedAccount, { signer: injectedAcct.signer }, async (result: { status: { type: string; }; }) => {
          if (result.status.type == "Finalized" || result.status.type == "BestChainBlockIncluded") {
            await updateAccountBalance(selectedAccount);
          }
        });
    } catch (error) {
      setErrorMessage("Transfer failed.");
      console.error("Error during transfer:", error);
    }
  };

  const setOnchainIdentity = async () => {
    if (!client || !injectedAcct || !selectedAccount) return;
    try {
      const identityInfo: PalletIdentityIdentityInfo = {
        additional: [[
          { type: 'None' },
          { type: 'Raw', value: discordHandle }
      ]],
        email: { type: 'Raw', value: email },
        display: { type: 'Raw', value: displayName },
        image: { type: 'Raw', value: 'None' },
        legal: { type: 'Raw', value: 'None' },
        riot: { type: 'Raw', value: 'None' },
        twitter: { type: 'Raw', value: 'None' },
        web: { type: 'Raw', value: 'None' }
      };
      
      const tx = client.tx.identity.setIdentity(identityInfo);
      await tx.signAndSend(selectedAccount, { signer: injectedAcct.signer }, (result: { status: { type: string; }; }) => {
        if (result.status.type == "Finalized"|| result.status.type == "BestChainBlockIncluded") {
          console.log("Identity set successfully.");
          console.log(result.status.type);
          
        }
      });
    } catch (error) {
      setErrorMessage("Failed to set identity.");
      console.error("Error setting identity:", error);
    }
  };

  return (
    <Container maxW='container.md' my={16}>
      <Flex justifyContent='center'>
        <a href='https://dedot.dev' target='_blank'>
          <img width='100' src={dedotLogo} alt='Dedot Logo' />
        </a>
      </Flex>
      <Heading my={4} textAlign='center'>Open Hack Dedot</Heading>
      
      {isConnected ? (
        <>
          <Text my={4}>SubWallet Connected, Accounts found: {accounts.length}</Text>
          <Select placeholder='Select Wallet Account' onChange={handleAccountChange} my={3}>
            {accounts.map(account => (
              <option key={account.address} value={account.address}>
                {account.name || "No Name"} - {account.address}
              </option>
            ))}
          </Select>
          {selectedAccount && (
            <Text my={3} textAlign={'center'}>Selected Account Balance: {selectedAccountBalance || 'fetching'}</Text>
          )}
        </>
      ) : (
        <>
          <Text>{errorMessage}</Text>
          <Button onClick={connectToSubWalletAndShowAccount}>Connect SubWallet</Button>
        </>
      )}

      <Heading mt={6}>Transfer Money here</Heading>
      <FormControl mt={6}>
        <Input placeholder='Enter Destination Address' onChange={(e) => setDestAddress(e.target.value)} />
      </FormControl>
      <FormControl mt={6}>
        <Input placeholder='Enter Amount to Transfer' type='number' onChange={(e) => setAmountToTransfer(e.target.value)} />
      </FormControl>
      <Button onClick={handleTransfer} mt={6}>Transfer</Button>

      {addressIdentity ? (
        <Box mt={8} p={4} borderColor='blue.300'>
          <Heading textAlign='center'>Identity Details</Heading>
          <Text>{addressIdentity}</Text>
        </Box>
      ) : (
        isFormVisible && (
          <Box>
            <Heading>Enter Your Identity Information</Heading>
            <FormControl>
              <FormLabel>Display Name</FormLabel>
              <Input placeholder='Enter your Display Name' value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Input type='email' placeholder='Enter your Email' value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormControl>
            <FormControl>
              <FormLabel>Discord Handle</FormLabel>
              <Input placeholder='Enter Your Discord Handle' value={discordHandle} onChange={(e) => setDiscordHandle(e.target.value)} />
            </FormControl>
            <Button color='blue-300' onClick={setOnchainIdentity}>Submit</Button>
          </Box>
        )
      )}
    </Container>
  );
}

export default App;