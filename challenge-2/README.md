# Challenge 2: Set an on-chain identity from the client with Dedot   

```
Goal: 🎯 Make a transaction to set on-chain identity for connected account
```

## Description
Made by the collaboration between [OpenGuild Labs](https://openguild.wtf) and [Dedot](https://dedot.dev) to introduce to participants about building decentralized applications on Polkadot.

[Learn about the on-chain identity on Polkadot](https://openguild.wtf/blog/polkadot/polkadot-opengov-introduction#:~:text=Setting%20Up%20a%20Verified%20On%2DChain%20Identity%20on%20PolkAssembly)

- [ ] `🍭 Easy` Finish the tasks in *"Learn how to use Dedot to build an application"*.
- [ ] `🍭 Easy` Initialize `DedotClient` to connect to Westend People testnet ([`WestendPeopleApi`](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/index.d.ts#L24))
- [ ] `🍫 Intermediate` Build a form to enter identity information: Display name, Email, Discord handle
- [ ] `🍫 Advanced` Make a transaction to set on-chain identity for connected account (via [`client.tx.identity.setIdentity`](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/tx.d.ts#L2283-L2295))
- [ ] `🍫 Intermediate` Fetch & render your on-chain identity (via [`client.query.identity.identityOf`](https://github.com/dedotdev/chaintypes/blob/7baa48e8e8e3c8e2dce4ad9ece0a11b9ae98934a/packages/chaintypes/src/westendPeople/query.d.ts#L1130-L1134))
- [ ] `🍫 Intermediate` If connected account is already set on-chain identity, show the identity information instead the form
- [ ] `🔥 Advanced` Migrating to light client and install Substrate Connect to connect with your applicaiton.

## How to claim the bounty?
- ✅ Create a pull request to submit your work for this challenge to the repository.
- ✅ Show your work to the DevRel of OpenGuild and get the confirmation to claim the bounty.

## Learn how to use Dedot to build an application

🎯 Build a simple dapp to show & transfer balance on Polkadot testnet

### 1. Install SubWallet & create your wallet account
- Install SubWallet Extension: https://www.subwallet.app/download.html
- Create your first wallet
- Enable Polkadot testnet: Rococo & Westend

<div align="center">

<p float="left">
<img float="left" width="200" alt="Xnapper-2024-07-18-21 55 02" src="https://github.com/user-attachments/assets/df3625ec-2103-4b80-9e19-7fbd618da859">
<img float="left" width="200" alt="Xnapper-2024-07-18-21 55 52" src="https://github.com/user-attachments/assets/9dc271e1-74f6-47c6-8f5c-595b6b9f578b">
<img float="left" width="200" alt="Xnapper-2024-07-18-21 55 33" src="https://github.com/user-attachments/assets/4895a38f-cc19-4b1f-86b6-6681fea2a2dd">
</p>

</div>


- Claim testnet token from faucet: https://faucet.polkadot.io/

<div align="center">

<p float="left">
<img float="left" width="250" alt="Xnapper-2024-07-18-22 00 14" src="https://github.com/user-attachments/assets/97ce3d78-ac8d-48eb-819c-059d3a989721">
<img float="left" width="350" alt="Xnapper-2024-07-18-22 01 16" src="https://github.com/user-attachments/assets/eb37ac35-a314-4733-97ac-614a1c47019d">
</p>

</div>

### 2. Install Node.js

- Follow instruction at: https://nodejs.org/en/download/package-manager
- Or install via nvm:
```shell
# installs nvm (Node Version Manager)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# download and install Node.js (you may need to restart the terminal)
nvm install 20

# verifies the right Node.js version is in the environment
node -v # should print `v20.15.1`

# verifies the right NPM version is in the environment
npm -v # should print `10.7.0`
```

### 3. Fork, clone the repo

- Fork the repo
<img width="800" alt="Xnapper-2024-07-18-22 10 30" src="https://github.com/user-attachments/assets/c8be2790-e75f-488b-9e43-b2e7726ffa77">

- Clone the repo
```shell
git clone https://github.com/phapdev/openhack-dedot
```
E.g: `https://github.com/sinzii/openhack-dedot`

### 4. Install dependencies & start development mode

- Install dependencies
```shell
npm i
```

- Start development mode
```shell
npm run dev
```
- The development application starts at: http://localhost:5173
  

### 5. Start building the dapp

- [] `🍭 Easy` Connect to wallet
- [] `🍭 Easy` Show connected account (name & address)
- [] `🍭 Easy` Initialize `DedotClient` to connect to the network (Westend testnet)
- [] `🍭 Easy` Fetch & show balance for connected account
- [] `🍭 Easy` Build a form to transfer balance (destination address & amount to transfer)
- [ ] `🍭 Easy` Check transaction status (in-block & finalized)
- [ ] `🍭 Easy` Check transaction result (success or not)
- [ ] `🍭 Easy` Subscribe to balance changing

### 6. How to interact with the network via Dedot?

#### 6.1 Install dedot and necessary dependencies

```typescript
npm i dedot

npm i -D @dedot/chaintypes @polkadot/extension-inject
```

#### 6.2 Connect to SubWallet & fetch connected accounts

```typescript
import { Injected, InjectedAccount, InjectedWindowProvider, InjectedWindow } from '@polkadot/extension-inject/types';

const injectedWindow = window as Window & InjectedWindow;

// Get subwallet-js injected provider to connect with SubWallet
const provider: InjectedWindowProvider = injectedWindow.injectedWeb3['subwallet-js'];

// Connect with SubWallet from the dapp
const injected: Injected = await provider.enable!('Open Hack Dapp');

// Get connected accounts
const accounts: InjectedAccount[] = await injected.accounts.get();
```

#### 6.3 Initialize `DedotClinet` to connect to `Westend` network

```typescript
import { DedotClient, WsProvider } from 'dedot';
import { WestendApi } from '@dedot/chaintypes';
import { WESTEND } from './networks.ts';

// initialize the client and connect to the network
const client = new DedotClient<WestendApi>(new WsProvider(WESTEND.endpoint));
await client.connect();

// OR via static factory
const client = await DedotClient.new<WestendApi>(new WsProvider(WESTEND.endpoint));
```

#### 6.4 Fetching balance for an account

```typescript
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils.ts';
import { WESTEND } from './networks.ts';

const account: InjectedAccount = accounts[0]; // get from accounts list - 6.2
const balance: FrameSystemAccountInfo = await client.query.system.account(account.address);

// Get free/transferable balance
const freeBalance = formatBalance(balance.data.free, WESTEND.decimals);
```

#### 6.5 Transfer balance to destination address

```typescript
import { Injected, InjectedAccount } from '@polkadot/extension-inject/types';

const client: DedotClinet = ...;

// Get injected instance & connected account - 6.2
const injected: Injected = ...; 
const account: InjectedAccount = ...;

const amount: number = 1; // how many token in DOT or WND

// Convert the amount (DOT, or WND) to Planck unit
const amountToTransfer: bigint = BigInt(amount) * BigInt(Math.pow(10, WESTEND.decimals));
const destAddress: string = '...';

await client.tx.balances
      .transferKeepAlive(destAddress, amountToTransfer)
      .signAndSend(account.address, { signer: injected.signer }, (result) => {
        console.log(result.status);

        // 'BestChainBlockIncluded': Transaction is included in the best block of the chain
        // 'Finalized': Transaction is finalized  
        if (result.status.type === 'BestChainBlockIncluded' || result.status.type === 'Finalized') {
          if (result.dispatchError) {
            // Transaction is included but has an error
            const error = `${JSON.stringify(Object.values(result.dispatchError))}`;
          } else {
            // Transaction is included and executed successfully
          }
        }
      });

```

#### 6.6 Subscribe to balance changing

```typescript
import { FrameSystemAccountInfo } from '@dedot/chaintypes/westend';
import { formatBalance } from './utils.ts';
import { WESTEND } from './networks.ts';

const account: InjectedAccount = accounts[0]; // get from accounts list - 6.2

// Pass in a callback to be called whenver the balance is changed/updated
const unsub = await client.query.system.account(account.address, (balance: FrameSystemAccountInfo) => {
  // Get free/transferable balance
  const freeBalance = formatBalance(balance.data.free, WESTEND.decimals);   
});
```

## 👉 Contribute to OpenGuild Community

OpenGuild is a builder-driven community centered around Polkadot. OpenGuild is built by Web3 builders for Web3 builders. Our primary aim is to cater to developers seeking a comprehensive understanding of the Polkadot blockchain, providing curated, in-depth materials with a low-level approach.

- **About us:** [Learn more about us](https://openguild.wtf/about)
- **Website:** [OpenGuild Website](https://openguild.wtf/)
- **Github:** [OpenGuild Labs](https://github.com/openguild-labs)
- **Discord**: [Openguild Discord Channel](https://discord.gg/bcjMzxqtD7)
