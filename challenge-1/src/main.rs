#![allow(missing_docs)]
use futures::StreamExt;
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};
use std::fs::OpenOptions;
use std::io::Write;
use std::collections::HashMap;

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
    let (paseo_light_client, paseo_rpc) = LightClient::relay_chain(PASEO_SPEC)?;
    let pp_rpc = paseo_light_client.parachain(POLKADOT_PEOPLE_SPEC)?;

    // Create Subxt clients from these Smoldot backed RPC clients.
    let paseo_api = OnlineClient::<PolkadotConfig>::from_rpc_client(paseo_rpc).await?;
    let pp_api = OnlineClient::<PolkadotConfig>::from_rpc_client(pp_rpc).await?;

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

    // Track the highest and lowest block numbers for each chain.
    let mut highest_blocks: HashMap<&str, u32> = HashMap::new();
    let mut lowest_blocks: HashMap<&str, u32> = HashMap::new();

    while let Some((chain, block)) = stream_combinator.next().await {
        let block = block?;
        let block_number = block.number();
        println!(
            "📦 Chain {:?} | hash={:?} | height={:?}",
            chain,
            block.hash(),
            block_number
        );

        let log_data = format!(
            "Chain: {}, hash: {:?}, height: {}\n",
            chain,
            block.hash(),
            block_number
        );

        init_logs(&log_data)?;

        // TODO: `🍫 Intermediate` Finding the chain with highest block number.
        highest_blocks
            .entry(chain)
            .and_modify(|highest| {
                if block_number > *highest {
                    *highest = block_number;
                }
            })
            .or_insert(block_number);
        println!("Current highest blocks: {:?}", highest_blocks);

        lowest_blocks
            .entry(chain)
            .and_modify(|lowest| {
                if block_number < *lowest {
                    *lowest = block_number;
                }
            })
            .or_insert(block_number);
        println!("Current lowest blocks: {:?}", lowest_blocks);

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