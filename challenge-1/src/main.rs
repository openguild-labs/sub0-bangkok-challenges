#![allow(missing_docs)]
use futures::StreamExt;
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};

// Generate an interface that we can use from the node's metadata.
#[subxt::subxt(runtime_metadata_path = "artifacts/polkadot_metadata_small.scale")]
pub mod polkadot {}

// Examples chain specs.
const POLKADOT_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot.json");
const ASSET_HUB_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot_asset_hub.json");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // The lightclient logs are informative:
    tracing_subscriber::fmt::init();

    // Instantiate a light client with the Polkadot relay chain,
    // and connect it to Asset Hub, too.
    let (lightclient, polkadot_rpc) = LightClient::relay_chain(POLKADOT_SPEC)?;
    let asset_hub_rpc = lightclient.parachain(ASSET_HUB_SPEC)?;

    // TODO: `🍭 Easy` Initialize RPCs to new relaychains and parachains.

    // Create Subxt clients from these Smoldot backed RPC clients.
    let polkadot_api = OnlineClient::<PolkadotConfig>::from_rpc_client(polkadot_rpc).await?;
    let asset_hub_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;

    // TODO: `🍭 Easy` Create Subxt clients from newly added Smoldot backed RPC clients.

    let polkadot_sub = polkadot_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("Polkadot", block));
    let parachain_sub = asset_hub_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("AssetHub", block));

    // TODO: `🍭 Easy` Fetch blocks from new chains using the added APIs.

    let mut stream_combinator = futures::stream::select(polkadot_sub, parachain_sub);

    while let Some((chain, block)) = stream_combinator.next().await {
        let block = block?;
        println!(
            "📦 Chain {:?} | hash={:?} | height={:?}",
            chain,
            block.hash(),
            block.number()
        );

        // TODO: `🍫 Intermediate` Store the fetched block data to a log file.

        // TODO: `🍫 Intermediate` Finding the chain with highest block number.

        // TODO: `🍫 Intermediate` Finding the chain with lowest block number.

        // TODO: `🔥 Advanced` Processing extrinsics of each block and aggregate the number of transactions made based on the pallet name. Store the data in the log file named `pallets.txt`.

        // TODO: `🔥 Advanced` Processing events emitted from each block and aggregate the number of events made based on the event name. Store the data in the log file named `events.txt`.
    }

    Ok(())
}
