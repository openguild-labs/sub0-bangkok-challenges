#![allow(missing_docs)]
use futures::StreamExt;
use std::fs::OpenOptions;
use std::io::Write;
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};

// Generate an interface that we can use from the node's metadata.
#[subxt::subxt(runtime_metadata_path = "artifacts/polkadot_metadata_small.scale")]
pub mod polkadot {}

// Examples chain specs.
const POLKADOT_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot.json");
const POLKADOT_ASSET_HUB_SPEC: &str =
    include_str!("../artifacts/chain_specs/polkadot_asset_hub.json");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // The lightclient logs are informative:
    tracing_subscriber::fmt::init();

    // Instantiate a light client with the Polkadot relay chain,
    // and connect it to Asset Hub, too.
    let (lightclient, polkadot_rpc) = LightClient::relay_chain(POLKADOT_SPEC)?;
    let asset_hub_rpc = lightclient.parachain(POLKADOT_ASSET_HUB_SPEC)?;

    // TODO: `🍭 Easy` Initialize RPCs to new relaychains and parachains.

    // Create Subxt clients from these Smoldot backed RPC clients.
    let polkadot_api = OnlineClient::<PolkadotConfig>::from_rpc_client(polkadot_rpc).await?;
    let asset_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;

    // TODO: `🍭 Easy` Create Subxt clients from newly added Smoldot backed RPC clients.

    let paseo_sub = polkadot_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("Polkadot", block));
    let paseo_asset_sub = asset_api
        .blocks()
        .subscribe_finalized()
        .await?
        .map(|block| ("AssetHub", block));

    // // TODO: `🍭 Easy` Fetch blocks from new chains using the added APIs.

    let mut stream_combinator = futures::stream::select(paseo_sub, paseo_asset_sub);

    let mut block_numbers = std::collections::HashMap::new();

    while let Some((chain, block)) = stream_combinator.next().await {
        let block = block?;
        println!(
            "📦 Chain {:?} | hash={:?} | height={:?}",
            chain,
            block.hash(),
            block.number()
        );

        // TODO: `🍫 Intermediate` Store the fetched block data to a log file.

        let log_entry = format!(
            "Chain: {}, Hash: {:?}, Height: {}\n",
            chain,
            block.hash(),
            block.number()
        );

        write_logs("./output/logs.txt", &log_entry)?;

        // TODO: `🍫 Intermediate` Finding the chain with highest block number.

        // TODO: `🍫 Intermediate` Finding the chain with lowest block number.

        let block_number = block.number();

        block_numbers.insert(chain.to_string(), block_number);

        // Find the chain with the highest block number
        let highest_chain = block_numbers
            .iter()
            .max_by_key(|(_, &number)| number)
            .map(|(chain, number)| format!("{} ({})", chain, number))
            .unwrap_or_default();

        // Find the chain with the lowest block number
        let lowest_chain = block_numbers
            .iter()
            .min_by_key(|(_, &number)| number)
            .map(|(chain, number)| format!("{} ({})", chain, number))
            .unwrap_or_default();

        println!(
            "  Highest chain: {} | Lowest chain: {}",
            highest_chain, lowest_chain
        );

        // TODO: `🔥 Advanced` Processing extrinsics of each block and aggregate the number of transactions made based on the pallet name. Store the data in the log file named `pallets.txt`.

        // TODO: `🔥 Advanced` Processing events emitted from each block and aggregate the number of events made based on the event name. Store the data in the log file named `events.txt`.
        let extrinsics = block.extrinsics().await?;

        for ext in extrinsics.iter() {
            let idx = ext.index();
            let pallet_name = ext.pallet_name()?;
            let pallet_function = ext.variant_name()?;
            let events = ext.events().await?;



            let log_entry = format!(
                "Extrinsic ID: {}, Pallet Name:{},  Pallet Function: {:?}\n",
                idx, pallet_name, pallet_function
            );

            write_logs("./output/pallets.txt", &log_entry)?;

            for evt in events.iter() {
                let evt = evt?;
                let pallet_name = evt.pallet_name();
                let event_name = evt.variant_name();
                let event_values = evt.field_values()?;

                let log_entry = format!(
                    "Pallet: {}, Events:{},  Event Values: {:?}\n",
                    pallet_name, event_name, event_values
                );

                write_logs("./output/events.txt", &log_entry)?;


            }
        }
    }

    Ok(())
}



fn write_logs(file_path:&str, log_entry:&str) -> Result<(), Box<dyn std::error::Error>> {
    let mut file = OpenOptions::new()
    .create(true)
    .append(true)
    .open(file_path)?;

    file.write_all(log_entry.as_bytes())?;
    Ok(())
}