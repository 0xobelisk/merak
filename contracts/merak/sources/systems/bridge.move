module merak::merak_bridge_system {
    use std::ascii::String;
    use std::u64;
    use merak::merak_dapp_schema::Dapp;
    use merak::dubhe::DUBHE;
    use sui::coin::TreasuryCap;
    use sui::coin;
    use merak::merak_wrapper_system;
    use merak::merak_bridge_config;
    use merak::merak_schema::Schema;
    use merak::merak_errors::{
        asset_not_found_error, overflows_error, chain_not_supported_error, bridge_not_opened_error
    };
    use merak::merak_assets_functions;
    use merak::merak_events::{ bridge_deposit_event, bridge_withdraw_event };
    use merak::merak_dapp_system::ensure_has_authority;

    public entry fun set_bridge(schema: &mut Schema, dapp: &Dapp, chain: String, fee: u256, opened: bool, ctx: &TxContext) {
        ensure_has_authority(dapp, ctx);
        schema.bridge().set(chain, merak_bridge_config::new(fee, opened));
    }

    public entry fun withdraw(schema: &mut Schema, asset_id: u256, to: address, to_chain: String, amount: u256, ctx: &mut TxContext) {
        asset_not_found_error(schema.asset_metadata().contains(asset_id));
        chain_not_supported_error(schema.bridge().contains(to_chain));
        let from = ctx.sender();
        let (fee, opened) = schema.bridge()[to_chain].get();
        bridge_not_opened_error(opened);
        let fee_to = schema.fee_to()[];
        merak_assets_functions::do_transfer(schema, asset_id, from, fee_to, fee);

        // Transfer DUBHE to fee_to address, wait for burn
        let coin = merak_wrapper_system::do_unwrap<DUBHE>(schema, amount, ctx);
        transfer::public_transfer(coin, fee_to);

        bridge_withdraw_event(asset_id, from, to, to_chain, amount, fee);
    }

    public entry fun deposit(schema: &mut Schema, treasury_cap: &mut TreasuryCap<DUBHE>, asset_id: u256, from: address, to: address, from_chain: String, amount: u256, ctx: &mut TxContext) {
        asset_not_found_error(schema.asset_metadata().contains(asset_id));
        overflows_error(amount <= u64::max_value!() as u256);
        let coin = coin::mint(treasury_cap, amount as u64, ctx);
        merak_wrapper_system::wrap<DUBHE>(schema, coin, to);
        bridge_deposit_event(asset_id, from, to, from_chain, amount);
    }
}