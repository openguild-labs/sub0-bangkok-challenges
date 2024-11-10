# Challenge 1: Using `subxt` and light client to collect and process data

```
Goal: 🎯 Read the data from parachains and relaychains using `subxt` and light client feature and process to return deliverables.
```

## Description

- Get the chain spec here: https://github.com/sodazone/substrate-chain-specs

### Initializing new chains tasks

- [ ] `🍭 Easy` Add chain specs to PASEO Relaychain.
- [ ] `🍭 Easy` Add chain specs to Asset Hub and HydraDX Parachain.
- [ ] `🍭 Easy` Initialize RPCs to new relaychains and parachains.
- [ ] `🍭 Easy` Create Subxt clients from newly added Smoldot backed RPC clients.
- [ ] `🍭 Easy` Fetch blocks from new chains using the added APIs.

### Data process tasks

- [ ] `🍫 Intermediate` Store the fetched block data to a log file (.txt).

```csv
📦 Chain "Polkadot" | hash=0x0e7736efa657c9e092632cdf6adde699841e94f7a7ef720e42fa32f1939bc589 | height=23230552
📦 Chain "AssetHub" | hash=0xeeba7973b5e0205781ea1ca1c9a49be6be2acaa3f892c6dd736c2036bf4c7b06 | height=7468235
📦 Chain "AssetHub" | hash=0x747c8fa9e1723cba6c843996da84d39226900d17d1442c83618288c12ab47b79 | height=7468236
```

- [ ] `🍫 Intermediate` Fetch blocks from new chains using the added APIs.
- [ ] `🍫 Intermediate` Finding the chain with highest block number.
- [ ] `🍫 Intermediate` Finding the chain with lowest block number.
- [ ] `🍫 Intermediate` Finding the chain with lowest block number.
- [ ] `🔥 Advanced` Processing extrinsics of each block and aggregate the number of transactions made based on the pallet name. Store the data in the log file named `pallets.txt`.

```json
{
  "pallet-assets": {
    "PopNetwork": 10,
    "Polkadot": 55,
    "Paseo": 25,
    "AssetHub": 35
  },
  ...
}
```

- [ ] `🔥 Advanced` Processing events emitted from each block and aggregate the number of events made based on the event name. Store the data in the log file named `events.txt`.

```json
{
  "pallet-assets::Create": {
    "PopNetwork": 12,
    "Polkadot": 30,
    "Paseo": 26,
    "AssetHub": 33
  },
  "pallet-balance::Transfer": {
    "PopNetwork": 10,
    "Polkadot": 55,
    "Paseo": 25,
    "AssetHub": 35
  },
  ...
}
```

## How to claim the bounty?

- ✅ Finish all the TODOs.
- ✅ Create a pull request to submit your work for this challenge to the repository.
- ✅ Show your work to the DevRel of OpenGuild and get the confirmation to claim the bounty.

## 👉 Contribute to OpenGuild Community

OpenGuild is a builder-driven community centered around Polkadot. OpenGuild is built by Web3 builders for Web3 builders. Our primary aim is to cater to developers seeking a comprehensive understanding of the Polkadot blockchain, providing curated, in-depth materials with a low-level approach.

- **About us:** [Learn more about us](https://openguild.wtf/about)
- **Website:** [OpenGuild Website](https://openguild.wtf/)
- **Github:** [OpenGuild Labs](https://github.com/openguild-labs)
- **Discord**: [Openguild Discord Channel](https://discord.gg/bcjMzxqtD7)
