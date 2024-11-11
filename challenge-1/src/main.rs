#![allow(missing_docs)]
use futures::StreamExt;
use std::{fs::OpenOptions, io::Write, sync::{Arc, Mutex}};
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};
use tracing_subscriber;

// Generate an interface that we can use from the node's metadata.
#[subxt::subxt(runtime_metadata_path = "artifacts/polkadot_metadata_small.scale")]
pub mod polkadot {}

// Examples chain specs.
const POLKADOT_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot.json");
const ASSET_HUB_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot_asset_hub.json");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging for the light client.
    tracing_subscriber::fmt::init();

    // Instantiate a light client with the Polkadot relay chain and connect it to Asset Hub.
    let (lightclient, polkadot_rpc) = LightClient::relay_chain(POLKADOT_SPEC)?;
    let asset_hub_rpc = lightclient.parachain(ASSET_HUB_SPEC)?;

    // Create Subxt clients from the Smoldot backed RPC clients.
    let polkadot_api = OnlineClient::<PolkadotConfig>::from_rpc_client(polkadot_rpc).await?;
    let asset_hub_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;

    // Subscribe to finalized blocks from both chains.
    let polkadot_sub = polkadot_api.blocks().subscribe_finalized().await?;
    let parachain_sub = asset_hub_api.blocks().subscribe_finalized().await?;

    let mut stream_combinator = futures::stream::select(polkadot_sub.map(|block| ("Polkadot", block)), parachain_sub.map(|block| ("AssetHub", block)));

    // Prepare log files for blocks, pallets, and events.
    let log_file = Arc::new(Mutex::new(OpenOptions::new().append(true).create(true).open("blocks_log.txt")?));
    let pallet_file = Arc::new(Mutex::new(OpenOptions::new().append(true).create(true).open("pallets.txt")?));
    let events_file = Arc::new(Mutex::new(OpenOptions::new().append(true).create(true).open("events.txt")?));

    let mut highest_block = None;
    let mut lowest_block = None;
    
    while let Some((chain, block_result)) = stream_combinator.next().await {
        let block = block_result?;
        let block_number = block.number();
    
        // Log block information.
        let block_log = format!("📦 Chain: {:?} | Hash: {:?} | Height: {:?}\n", chain, block.hash(), block_number);
        {
            let mut file = log_file.lock().unwrap();
            file.write_all(block_log.as_bytes())?;
        }
    
        // Update highest and lowest block numbers.
        highest_block = match highest_block {
            Some((_, highest)) if block_number > highest => Some((chain, block_number)),
            None => Some((chain, block_number)),
            _ => highest_block,
        };
    
        lowest_block = match lowest_block {
            Some((_, lowest)) if block_number < lowest => Some((chain, block_number)),
            None => Some((chain, block_number)),
            _ => lowest_block,
        };
    
        // Process extrinsics and log pallet names.
        let extrinsics = block.extrinsics().await?;
        let extrinsics_data: Vec<_> = extrinsics.iter()
            .filter_map(|ext| {
                match ext.pallet_name() {
                    Ok(name) => Some(name.to_string()),
                    Err(_) => None,
                }
            })
            .collect();

        {
            let mut file = pallet_file.lock().unwrap();
            for pallet in extrinsics_data {
                writeln!(file, "Chain: {:?} | Pallet: {:?}", chain, pallet)?;
            }
        }

        let events: subxt::events::Events<PolkadotConfig> = block.events().await?;        
        {
            let mut file = events_file.lock().unwrap();
            for event in events.iter() {
                writeln!(file, "Chain: {:?} | Event: {:?}", chain, event?.pallet_name())?;
            }
        }
    }

    // Log the highest and lowest block information.
    if let Some((chain, highest_block)) = highest_block {
        println!("🚀 Highest Block: Chain: {:?} | Height: {:?}", chain, highest_block);
    }
    if let Some((chain, lowest_block)) = lowest_block {
        println!("🐢 Lowest Block: Chain: {:?} | Height: {:?}", chain, lowest_block);
    }

    Ok(())
}