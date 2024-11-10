#![allow(missing_docs)]
use futures::StreamExt;
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};
use std::fs::OpenOptions;
use std::io::Write;

// Generate an interface that we can use from the node's metadata.
#[subxt::subxt(runtime_metadata_path = "artifacts/polkadot_metadata_small.scale")]
pub mod polkadot {}

// Examples chain specs.
const PASEO_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot.json");

const POLKADOT_PEOPLE_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot_people.json");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // The lightclient logs are informative:
    tracing_subscriber::fmt::init();

    // Instantiate a light client with the Polkadot relay chain,
    // and connect it to Asset Hub, too.
    // let (lightclient, polkadot_rpc) = LightClient::relay_chain(POLKADOT_SPEC)?;
    // let asset_hub_rpc = lightclient.parachain(ASSET_HUB_SPEC)?;

    let (paseo_light_client, paseo_rpc) = LightClient::relay_chain(PASEO_SPEC)?;
    let pp_rpc = paseo_light_client.parachain(POLKADOT_PEOPLE_SPEC)?;

    // Create Subxt clients from these Smoldot backed RPC clients.
    // let polkadot_api = OnlineClient::<PolkadotConfig>::from_rpc_client(polkadot_rpc).await?;
    // let asset_hub_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;

    let paseo_api = OnlineClient::<PolkadotConfig>::from_rpc_client(paseo_rpc).await?;
    let pp_api = OnlineClient::<PolkadotConfig>::from_rpc_client(pp_rpc).await?;

    // let polkadot_sub = polkadot_api
    //     .blocks()
    //     .subscribe_finalized()
    //     .await?
    //     .map(|block| ("Polkadot", block));
    // let parachain_sub = asset_hub_api
    //     .blocks()
    //     .subscribe_finalized()
    //     .await?
    //     .map(|block| ("AssetHub", block));

    let paseo_sub = paseo_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("PASEO", block));

    let pp_sub = pp_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("POLKADOT_PEOPLE", block));

    let mut stream_combinator = futures::stream::select(
        paseo_sub, pp_sub,
    );

    while let Some((chain, block)) = stream_combinator.next().await {
        let block = block?;
        println!(
            "📦 Chain {:?} | hash={:?} | height={:?}",
            chain,
            block.hash(),
            block.number()
        );

        let log_data = format!(
            "Chain: {}, hash: {:?}, height: {}\n",
            chain,
            block.hash(),
            block.number()
        );

        init_logs(&log_data)?;

        // TODO: `🍫 Intermediate` Finding the chain with highest block number.

        // TODO: `🍫 Intermediate` Finding the chain with lowest block number.

        // TODO: `🔥 Advanced` Processing extrinsics of each block and aggregate the number of transactions made based on the pallet name. Store the data in the log file named `pallets.txt`.

        // TODO: `🔥 Advanced` Processing events emitted from each block and aggregate the number of events made based on the event name. Store the data in the log file named `events.txt`.
    }

    Ok(())
}

fn init_logs(log_data:&str) -> Result<(), Box<dyn std::error::Error>> {
    let mut log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open("blocks_log.txt")?;

    log_file.write_all(log_data.as_bytes())?;
    Ok(())
}