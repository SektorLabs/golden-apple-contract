/// Module: golden_apple
module golden_apple::golden_apple;

use sui::display;
use sui::event;
use sui::package;
use sui::transfer_policy;

#[error]
const EMaxSupplyMinted: vector<u8> = b"Max supply minted out";
#[error]
const EWrongVersion: vector<u8> = b"Wrong version contract interaction";

// === CONSTANTS ===

const VERSION: u64 = 1;

/// The total max supply of guaranteed whitelist
const TOTAL_MAX_SUPPLY: u64 = 2000;

// === STRUCTS ===

public struct GOLDEN_APPLE {} has drop;

public struct AdminCap has key {
    id: UID,
}

public struct Version has key, store {
    id: UID,
    version: u64,
}

public struct GoldenApple has key, store {
    id: UID,
    number: u64,
}

public struct Supply has key {
    id: UID,
    total_supply: u64,
}

// === EVENTS ===

public struct GoldenAppleMinted has copy, drop {
    nft_id: ID,
}

#[allow(lint(share_owned))]
fun init(_witness: GOLDEN_APPLE, ctx: &mut TxContext) {
    let publisher = package::claim(_witness, ctx);
    let mut golden_apple_display = display::new<GoldenApple>(&publisher, ctx);

    let admin_cap = AdminCap {
        id: object::new(ctx),
    };

    let version = Version {
        id: object::new(ctx),
        version: VERSION,
    };

    let supply = Supply {
        id: object::new(ctx),
        total_supply: 0,
    };
    
    golden_apple_display.add(b"name".to_string(), b"The Golden Apple".to_string());
    golden_apple_display.add(
        b"description".to_string(),
        b"The age of the apple falling from the sky is behind us. Now, we rise into the skies in search of it.\nThe era of Eris casting it down is over— for now, the apple needs only to exist.\nTo the bearers of this fruit: May you guard it with your sanity, not your heart.\nThis is where the myths are made real.".to_string(),
    );
    golden_apple_display.add(b"number".to_string(), b"{number}".to_string());
    golden_apple_display.add(
        b"image_url".to_string(),
        b"https://walrus.tusky.io/e48ZWPbBV9DK933KdYIlGFiCHFMnsV4Qot28Ktafj50".to_string(),
    );
    golden_apple_display.update_version();

    let (policy, policy_cap) = transfer_policy::new<GoldenApple>(&publisher, ctx);
    transfer::public_transfer(policy_cap, ctx.sender());
    transfer::public_share_object(policy);

    transfer::public_transfer(golden_apple_display, ctx.sender());
    transfer::public_transfer(publisher, ctx.sender());

    transfer::transfer(admin_cap, ctx.sender());
    transfer::share_object(version);
    transfer::share_object(supply);
}

public fun checkVersion(version: &Version, curr_version: u64) {
    assert!(curr_version == version.version, EWrongVersion);
}

public entry fun migrate(_: &AdminCap, ver: &mut Version, new_version: u64) {
    assert!(new_version > ver.version, EWrongVersion);
    ver.version = new_version
}

public fun mint_golden_apple(
    _: &AdminCap,
    version: &Version,
    supply: &mut Supply,
    ctx: &mut TxContext,
): GoldenApple {
    checkVersion(version, VERSION);

    let current_supply = get_total_supply(supply);
    assert!(current_supply < TOTAL_MAX_SUPPLY, EMaxSupplyMinted);

    let number = current_supply + 1;
    let golden_apple = GoldenApple { id: object::new(ctx), number };

    event::emit(GoldenAppleMinted {
        nft_id: object::id(&golden_apple),
    });

    // increase supply by 1
    supply.total_supply = supply.total_supply + 1;
    golden_apple
}

public fun get_total_supply(supply: &Supply): u64 {
    supply.total_supply
}

#[test_only]
public fun init_for_testing(ctx: &mut TxContext) {
    init(GOLDEN_APPLE{}, ctx);
}

