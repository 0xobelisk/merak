module merak::wrapper_system {
    use std::ascii::String;
    use std::ascii::string;
    use merak::assets_functions;
    use sui::balance;
    use sui::balance::Balance;
    use sui::coin;
    use sui::coin::{Coin, CoinMetadata};
    use merak::wrapper_schema::WrapperCoin;
    use merak::wrapper_schema;
    use merak::schema::Schema;
    use std::type_name;

    public entry fun force_register<T>(schema: &mut Schema, name: String, symbol: String, description: String, decimals: u8, url: String, info: String, ctx: &mut TxContext) {
        let asset_id = assets_functions::do_create(schema, false, false, true, ctx.sender(), name, symbol, description, decimals, url, info);
        wrapper_schema::wrapper_assets(schema).add<WrapperCoin<T>, u128>(wrapper_schema::new(), asset_id);
        let coin_type = type_name::get<T>().into_string();
        dubhe::storage_event::emit_set_record<String, String, u128>(string(b"wrapper_assets"), option::some(coin_type), option::none(), option::some(asset_id));
        wrapper_schema::wrapper_pools(schema).add<u128, Balance<T>>(asset_id, balance::zero<T>());
        dubhe::storage_event::emit_set_record<u128, u128, u64>(string(b"wrapper_pools"), option::some(asset_id), option::none(), option::some(0));
    }

    public entry fun register<T>(schema: &mut Schema, metadata: &CoinMetadata<T>, ctx: &mut TxContext) {
        let name = metadata.get_name().to_ascii();
        let decimals = metadata.get_decimals();
        let symbol = metadata.get_symbol();
        let description = metadata.get_description().to_ascii();
        let icon_url = if (metadata.get_icon_url().is_some()) {
            metadata.get_icon_url().borrow().inner_url()
        } else {
            string(b"")
        };
        let asset_id = assets_functions::do_create(schema, false, false, true, ctx.sender(), name, symbol, description, decimals, icon_url, string(b""));
        wrapper_schema::wrapper_assets(schema).add<WrapperCoin<T>, u128>(wrapper_schema::new(), asset_id);
        let coin_type = type_name::get<T>().into_string();
        dubhe::storage_event::emit_set_record<String, String, u128>(string(b"wrapper_assets"), option::some(coin_type), option::none(), option::some(asset_id));
        wrapper_schema::wrapper_pools(schema).add<u128, Balance<T>>(asset_id, balance::zero<T>());
        dubhe::storage_event::emit_set_record<u128, u128, u64>(string(b"wrapper_pools"), option::some(asset_id), option::none(), option::some(0));
    }

    public entry fun wrap<T>(schema: &mut Schema, coin: Coin<T>, beneficiary: address) {
        let wrapper_coin = wrapper_schema::new<T>();
        assert!(wrapper_schema::wrapper_assets(schema).contains(wrapper_coin), 0);
        let asset_id = *wrapper_schema::wrapper_assets(schema).borrow<WrapperCoin<T>, u128>(wrapper_coin);
        let amount = coin.value();
        let pool_balance = wrapper_schema::wrapper_pools(schema).borrow_mut<u128, Balance<T>>(asset_id);
        pool_balance.join(coin.into_balance());
        dubhe::storage_event::emit_set_record<u128, u128, u64>(string(b"wrapper_pools"), option::some(asset_id), option::none(), option::some(pool_balance.value()));
        assets_functions::do_mint(schema, asset_id, beneficiary, amount as u256);
    }

    public entry fun unwrap<T>(schema: &mut Schema, amount: u256, beneficiary: address, ctx: &mut TxContext) {
        let wrapper_coin = wrapper_schema::new<T>();
        assert!(wrapper_schema::wrapper_assets(schema).contains(wrapper_coin), 0);
        let asset_id = *wrapper_schema::wrapper_assets(schema).borrow<WrapperCoin<T>, u128>(wrapper_coin);
        assets_functions::do_burn(schema, asset_id, ctx.sender(), amount);

        let pool_balance = wrapper_schema::wrapper_pools(schema).borrow_mut<u128, Balance<T>>(asset_id);
        let coin =  coin::from_balance<T>(pool_balance.split(amount as u64), ctx);
        transfer::public_transfer(coin, beneficiary);
        dubhe::storage_event::emit_set_record<u128, u128, u64>(string(b"wrapper_pools"), option::some(asset_id), option::none(), option::some(pool_balance.value()));
    }
}