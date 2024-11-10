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

        init_logs(&log_data,"block_log.txt")?;


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


        let extrinsics = block.extrinsics().await?;

        for ext in extrinsics.iter() {
            let idx = ext.index();
            match (ext.pallet_name(), ext.variant_name(), ext.events().await) {
                (Ok(pallet_name), Ok(pallet_function), Ok(events)) => {

                    let log_data = format!(
                        "Extrinsic ID: {}, Pallet Name: {}, Pallet Function: {}\n",
                        idx, pallet_name, pallet_function
                    );

                    init_logs(&log_data,"pallets.txt")?;

                    // Iterate over events associated with the extrinsic
                    for evt in events.iter() {
                        match evt {
                            Ok(evt) => {
                                let event_pallet_name = evt.pallet_name();
                                let event_name = evt.variant_name();
                                match evt.field_values() {
                                    Ok(event_values) => {

                                        let log_data = format!(
                                            "Pallet: {}, Event: {}, Event Values: {:?}\n",
                                            event_pallet_name, event_name, event_values
                                        );

                                        init_logs(&log_data,"events.txt")?;
                                    }
                                    Err(e) => eprintln!("Error getting field values for event: {:?}", e),
                                }
                            }
                            Err(e) => eprintln!("Error processing event: {:?}", e),
                        }
                    }
                }
                (Err(e), _, _) | (_, Err(e), _) | (_, _, Err(e)) => {
                    eprintln!("Error processing extrinsic data: {:?}", e);
                }
            }
        }
    }

    Ok(())
}

fn init_logs(log_data:&str,file_name:&str) -> Result<(), Box<dyn std::error::Error>> {
    let mut log_file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(file_name)?;

    log_file.write_all(log_data.as_bytes())?;
    Ok(())
}