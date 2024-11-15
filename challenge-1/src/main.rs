#![allow(missing_docs)]
use futures::StreamExt;
use subxt::{client::OnlineClient, lightclient::LightClient, PolkadotConfig};
use std::io::Write;
use std::collections::HashMap;
use std::fs::OpenOptions;
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

   // println!("Connected to {:?}", polkadot_api);

    let asset_hub_api = OnlineClient::<PolkadotConfig>::from_rpc_client(asset_hub_rpc).await?;
   // println!("Connected to {:?}", asset_hub_api);

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
        // println!(
        //     "📦 Chain {:?} | hash={:?} | height={:?}",
        //     chain,
        //     block.hash(),
        //     block.number()
        // );

        // TODO: `🍫 Intermediate` Store the fetched block data to a log file.

        let fetched_data = format!(
                    "Chain :{}, hash:{:?}, height:{}\n",
                    chain,
                    block.hash(),
                    block.number(),

        );
       
        init_logs(&fetched_data, "./output/log.text" )?;
        

        let block_number = block.number();

        //let all_block_numbers.insert(chain.to_string(), block_mumber);

            let mut highest_blocks: HashMap<&str, u32> = HashMap::new();
            let mut lowest_blocks: HashMap<&str, u32> = HashMap::new();

        // TODO: `🍫 Intermediate` Finding the chain with highest block number.

           highest_blocks
           .entry(chain)
           .and_modify(|highest| {
            if block_number > *highest {
                *highest = block_number;
            }
           })
           .or_insert(block_number);
       // println!("highest block is {:?}", highest_blocks);
        // TODO: `🍫 Intermediate` Finding the chain with lowest block number.

        lowest_blocks
        .entry(chain)
        .and_modify(|lowest| {
            if block_number < *lowest {
                *lowest = block_number;
            }
        })
        .or_insert(block_number);
        // TODO: `🔥 Advanced` Processing extrinsics of each block and aggregate the number of transactions made based on the pallet name. Store the data in the log file named `pallets.txt`.

        let extrinsics = block.extrinsics().await?;

        for extrinsic in extrinsics.iter(){
            let index = extrinsic.index();
            match (extrinsic.pallet_name(), 
            extrinsic.variant_name(),
            extrinsic.events().await){
                (Ok(pallet_name), 
                Ok(pallet_function),
                Ok(events)) =>{
                    let extrinsic_log = format!(
                        "extrinsic ID: {}, pallet name: {}, pallet function: {}\n",
                        index, pallet_name, pallet_function
                    );
                    init_logs(&extrinsic_log, "./output/pallets.txt")?;

                      // TODO: `🔥 Advanced` Processing events emitted from each block and aggregate the number of events made based on the event name. Store the data in the log file named `events.txt`.

        

                    for evt in events.iter() {
                        match evt {
                            Ok(evt) => {
                                let event_pallet = evt.pallet_name();
                                let event_name =  evt.variant_name();
                                
                                match evt.field_values() {
                                    Ok(event_values) => {
                                        let event_log = format!("event_pallet: {}, event_name: {}, event_values: {:?}\n",
                                    event_pallet, event_name, event_values);
                                    
                                    init_logs(&event_log,  "./output/events.txt")?;
                                    }
                                    Err(e) => eprintln!(
                                        "event values are not gotten {:?}", e),
                                }
                            }
                            Err(e) => eprintln!("event not processed {}", e),
                        }
                    
                    }

                }
                    (Err(e), _, _) | (_, Err(e), _) | (_,_, Err(e)) => {
                        eprintln!("Extrinsic data not processed {:?}", e);
                    }
            }
        }

      
    }

    Ok(())
}

fn init_logs(log_data:&str, file_name:&str) -> Result<(), Box<dyn std::error::Error>> {
    let mut log_file = OpenOptions::new()
    .create(true)
    .append(true)
    .open(file_name)?;

    log_file.write_all(log_data.as_bytes())?;
    Ok(())
}
