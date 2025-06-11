
#[test_only]
module golden_apple::golden_apple_tests;

use sui::test_scenario::{Self as ts, Scenario, next_tx, ctx};
use golden_apple::golden_apple::{Self, AdminCap, Version, Supply};
use sui::test_utils::assert_eq; 

const ADMIN: address = @0xBABE;
const RECIPIENT: address = @0xCCAB;


#[test_only]
public struct World {
    scenario: Scenario, 
    admin_cap: AdminCap,
    version: Version,
    supply: Supply,
}

#[test_only]
public fun start_world(): World {
    let mut scenario = ts::begin(ADMIN); 
    golden_apple::init_for_testing(ctx(&mut scenario));

    next_tx(&mut scenario, ADMIN);
    let admin_cap = ts::take_from_sender<AdminCap>(&scenario);
    let version = ts::take_shared<Version>(&scenario);
    let supply = ts::take_shared<Supply>(&scenario);
    World {
        scenario, 
        admin_cap,
        version,
        supply,
    }
}

#[test_only]
public fun end_world(world : World) {
    let World {
        scenario, 
        admin_cap,
        version,
        supply,
    } = world;
    ts::return_to_sender<AdminCap>(&scenario, admin_cap);
    ts::return_shared<Version>(version);
    ts::return_shared<Supply>(supply);
    scenario.end();
}

#[test]
public fun test_publish() {
    let world = start_world();
    end_world(world);
}


#[test, allow(unused_mut_ref)]
fun test_mint_golden_apple() {
    let mut world = start_world();  
    
    (&mut world.scenario, ADMIN);

    let total_supply = golden_apple::get_total_supply(&world.supply);
    assert_eq(total_supply, 0);

    // mint golden apple to recipient
    let user_golden_apple = golden_apple::mint_golden_apple(
        &world.admin_cap,
        &world.version,
        &mut world.supply,
        ctx(&mut world.scenario)
    );
    transfer::public_transfer(user_golden_apple, RECIPIENT);

    let total_supply = golden_apple::get_total_supply(&world.supply);
    assert_eq(total_supply, 1);

    next_tx(&mut world.scenario, ADMIN);
    end_world(world);
}

