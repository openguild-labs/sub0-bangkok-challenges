#![allow(missing_docs)]
use futures::StreamExt;
use std::{fs::OpenOptions, io::Write, sync::{Arc, Mutex}};
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig, Block, EventDetails, ExtrinsicDetails, blocks::ExtrinsicEvents};
use tracing_subscriber;

#[subxt::subxt(runtime_metadata_path = "artifacts/polkadot_metadata_small.scale")]
pub mod polkadot {}

const POLKADOT_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot.json");
const ASSET_HUB_SPEC: &str = include_str!("../artifacts/chain_specs/polkadot_asset_hub.json");

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    tracing_subscriber::fmt::init();

    let (lightclient, polkadot_rpc) = LightClient::relay_chain(POLKADOT_SPEC)?;
    let asset_hub_rpc = lightclient.parachain(ASSET_HUB_SPEC)?;

    let polkadot_api = OnlineClient::<PolkadotConfig>::from_rpc_client(polkadot_rpc).await?;
    let asset_hub_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;

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

    let mut stream_combinator = futures::stream::select(polkadot_sub, parachain_sub);

    let log_file = Arc::new(Mutex::new(OpenOptions::new()
        .append(true)
        .create(true)
        .open("blocks_log.txt")?));
    let pallet_file = Arc::new(Mutex::new(OpenOptions::new()
        .append(true)
        .create(true)
        .open("pallets.txt")?));
    let events_file = Arc::new(Mutex::new(OpenOptions::new()
        .append(true)
        .create(true)
        .open("events.txt")?));

    let mut highest_block = None;
    let mut lowest_block = None;

    while let Some((chain, block_result)) = stream_combinator.next().await {
        let block = block_result?;
        let block_number = block.number();

        let block_log = format!(
            "📦 Chain: {:?} | Hash: {:?} | Height: {:?}\n",
            chain, block.hash(), block_number
        );

        {
            let mut file = log_file.lock().unwrap();
            file.write_all(block_log.as_bytes())?;
        }

        if let Some((_, highest)) = highest_block {
            if block_number > highest {
                highest_block = Some((chain, block_number));
            }
        } else {
            highest_block = Some((chain, block_number));
        }

        if let Some((_, lowest)) = lowest_block {
            if block_number < lowest {
                lowest_block = Some((chain, block_number));
            }
        } else {
            lowest_block = Some((chain, block_number));
        }

        let extrinsics = block.extrinsics();
        let extrinsics_data: Vec<_> = extrinsics.iter()
            .filter_map(|ext| ext.as_ref().ok())
            .map(|ext| ext.pallet_name())
            .collect();

        {
            let mut file = pallet_file.lock().unwrap();
            for pallet in extrinsics_data {
                writeln!(file, "Chain: {:?} | Pallet: {:?}", chain, pallet)?;
            }
        }

        let events: ExtrinsicEvents<PolkadotConfig> = block.events().await?;
        {
            let mut file = events_file.lock().unwrap();
            for event in events.iter() {
                let event_name = event?.event().pallet_name();
                writeln!(file, "Chain: {:?} | Event: {:?}", chain, event_name)?;
            }
        }
    }

    if let Some((chain, highest_block)) = highest_block {
        println!("🚀 Highest Block: Chain: {:?} | Height: {:?}", chain, highest_block);
    }
    if let Some((chain, lowest_block)) = lowest_block {
        println!("🐢 Lowest Block: Chain: {:?} | Height: {:?}", chain, lowest_block);
    }

    Ok(())
}
