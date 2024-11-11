import { useState, useEffect } from 'react';
import dedotLogo from './assets/dedot-dark-logo.png';
import { Container, Flex, Heading, Button, Text, Select, Input, FormControl, FormLabel, Box } from '@chakra-ui/react';
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from '@polkadot/extension-inject/types';
import { DedotClient, WsProvider } from 'dedot';
import { WestendApi } from '@dedot/chaintypes';
import { WESTEND_PEOPLE } from './networks.ts';
import { formatBalance } from "./utils.ts";
import { FrameSystemAccountInfo } from "@dedot/chaintypes/aleph";
import { PalletIdentityLegacyIdentityInfo } from "@dedot/chaintypes/westend/types";

function App() {
    const [accounts, setAccounts] = useState<InjectedAccount[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [selectedAccount, setSelectedAccount] = useState<string>('');
    const [injectedSign, setInjectedSign] = useState<Injected | null>(null);

    const [selectedAccountBalance, setSelectedAccountBalance] = useState<string | null>(null);
    const [addressIdentity, setAddressIdentity] = useState<string | null>(null);
    const [isFormEnabled, setIsFormEnabled] = useState(false);

    // Form state variables
    const [displayName, setDisplayName] = useState('');
    const [email, setEmail] = useState('');
    const [image, setImage] = useState('');
    const [legal, setLegal] = useState('');
    const [riot, setRiot] = useState('');
    const [twitter, setTwitter] = useState('');
    const [web, setWeb] = useState('');

    const connectToSubWallet = async () => {
        try {
            const injectedWindow = window as Window & InjectedWindow;
            const provider: InjectedWindowProvider | undefined = injectedWindow.injectedWeb3 && injectedWindow.injectedWeb3['subwallet-js'];

            if (provider) {
                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                // @ts-expect-error
                const injected: Injected = await provider.enable('Open Hack Dapp');
                setInjectedSign(injected);
                const accounts: InjectedAccount[] = await injected.accounts.get();
                setAccounts(accounts);
                setIsConnected(true);
            } else {
                setErrorMessage('SubWallet provider not found. Please ensure SubWallet is installed.');
            }
        } catch (error) {
            console.error('Failed to connect to SubWallet:', error);
            setErrorMessage('Failed to connect to SubWallet. Check console for details.');
        }
    };

    const initDedotClientAndFetchBalance = async (address: string) => {
        const client = new DedotClient<WestendApi>(new WsProvider(WESTEND_PEOPLE.endpoint));
        await client.connect();

        const balance: FrameSystemAccountInfo = await client.query.system.account(address);
        const freeBalance = formatBalance(balance.data.free, WESTEND_PEOPLE.decimals);
        setSelectedAccountBalance(freeBalance);
        console.log('Free balance:', freeBalance);

        const identity = await client.query.identity.identityOf(address);
        console.log('Identity:', identity);
        if (identity) {
            setAddressIdentity(JSON.stringify(identity[0].info));
        }else  {
            setIsFormEnabled(true);
        }

    };

    const handleAccountChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const address = event.target.value;
        setSelectedAccount(address);
        if (address) {
            initDedotClientAndFetchBalance(address);
        }
    };

    const handleFormSubmit = async () => {
        if (!selectedAccount) {
            return;
        }

        const client = new DedotClient<WestendApi>(new WsProvider(WESTEND_PEOPLE.endpoint));
        await client.connect();

        try {
            const info: PalletIdentityLegacyIdentityInfo = {
                additional: [[
                    { type: 'None' },
                    { type: 'Raw', value: 'Some raw value' }
                ]],
                email: { type: 'Raw', value: email },
                image: { type: 'Raw', value: image },
                legal: { type: 'Raw', value: legal },
                riot: { type: 'Raw', value: riot },
                twitter: { type: 'Raw', value: twitter },
                web: { type: 'Raw', value: web },
                display: { type: 'Raw', value: displayName }
            };
            const tx = client.tx.identity.setIdentity(info);
            console.log('Transaction hash:', tx.hash);
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            tx.signAndSend(selectedAccount, { signer: injectedSign.signer }).then((result) => {
                console.log('Transaction result:', result);
            }).catch((error) => {
                console.error('Failed to submit transaction:', error);
            });

        } catch (error) {
            console.error('Failed to submit transaction:', error);
        }
    };

    return (
        <Container maxW='container.md' my={16}>
            <Flex justifyContent='center'>
                <a href='https://dedot.dev' target='_blank'>
                    <img width='100' src={dedotLogo} className='logo' alt='Dedot logo' />
                </a>
            </Flex>
            <Heading my={4} textAlign='center'>
                Open Hack Dedot
            </Heading>
            {isConnected ? (
                <>
                    <Text my={4} textAlign='center'>Connected to SubWallet. Found {accounts.length} account(s).</Text>
                    <Select placeholder='Select an account' onChange={handleAccountChange} my={4}>
                        {accounts.map((account) => (
                            <option key={account.address} value={account.address}>
                                {account.name || 'Unnamed Account'} - {account.address}
                            </option>
                        ))}
                    </Select>
                    {selectedAccount && (
                        <Text my={4} textAlign='center'>
                            Selected Account Balance: {selectedAccountBalance || 'Fetching...'}
                        </Text>
                    )}

                    {addressIdentity && (
                        <Box mt={8} p={4} border='1px solid' borderColor='gray.200' borderRadius='md'>
                            <Heading size='md' mb={4} textAlign='center'>Identity Information</Heading>
                            <Text>{addressIdentity}</Text>
                        </Box>
                    )}

                    {isFormEnabled && (
                        <Box mt={8} p={4} border='1px solid' borderColor='gray.200' borderRadius='md'>
                            <Heading size='md' mb={4} textAlign='center'>Enter Identity Information</Heading>
                            <FormControl mb={4}>
                                <FormLabel>Display Name</FormLabel>
                                <Input
                                    placeholder='Enter display name'
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Email</FormLabel>
                                <Input
                                    type='email'
                                    placeholder='Enter email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Image</FormLabel>
                                <Input
                                    placeholder='Enter image URL or info'
                                    value={image}
                                    onChange={(e) => setImage(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Legal</FormLabel>
                                <Input
                                    placeholder='Enter legal name or info'
                                    value={legal}
                                    onChange={(e) => setLegal(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Riot</FormLabel>
                                <Input
                                    placeholder='Enter Riot handle'
                                    value={riot}
                                    onChange={(e) => setRiot(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Twitter</FormLabel>
                                <Input
                                    placeholder='Enter Twitter handle'
                                    value={twitter}
                                    onChange={(e) => setTwitter(e.target.value)}
                                />
                            </FormControl>
                            <FormControl mb={4}>
                                <FormLabel>Web</FormLabel>
                                <Input
                                    placeholder='Enter website URL'
                                    value={web}
                                    onChange={(e) => setWeb(e.target.value)}
                                />
                            </FormControl>
                            <Button colorScheme='blue' mt={4} onClick={handleFormSubmit} w='full'>Submit</Button>
                        </Box>
                    )}
                </>
            ) : (
                <>
                    <Text my={4} textAlign='center' color='red.500'>{errorMessage}</Text>
                    <Flex justifyContent='center' mt={4}>
                        <Button colorScheme='green' onClick={connectToSubWallet}>Connect to SubWallet</Button>
                    </Flex>
                </>
            )}
        </Container>
    );
}

export default App;
