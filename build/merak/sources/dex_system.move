module merak::dex_system {
    use std::ascii;
    use merak::dex_pool::Pool;
    use merak::dex_functions::{sort_assets};
    use sui::address;
    use merak::dex_pool;
    use merak::assets_functions;
    use merak::dex_functions;
    use merak::assets_schema::Assets;
    use merak::dex_schema::Dex;
    use merak::dex_pool_created_event;
    use merak::dex_liquidity_removed_event;
    use merak::dex_liquidity_added_event;
    use merak::math_system;

    const LP_ASSET_DESCRIPTION: vector<u8> = b"Poils LP Asset";

    const ENoPermission: u64 = 0;
    const EAssetNotFound: u64 = 1;
    const EOverflows: u64 = 2;
    const EPoolAlreadyExists: u64 = 3;
    const EBelowMinAmount: u64 = 4;

    public entry fun create_pool(dex: &mut Dex, assets: &mut Assets, asset1: u32, asset2: u32, ctx: &mut TxContext) {
        let sender = ctx.sender();

        let (asset1, asset2) = sort_assets(asset1, asset2);

        assert!(assets.borrow_metadata().contains_key(asset1), EAssetNotFound);
        assert!(assets.borrow_metadata().contains_key(asset2), EAssetNotFound);
        assert!(!dex.borrow_pool_id().contains_key(asset1, asset2), EPoolAlreadyExists);

        let pool_id = dex.borrow_mut_next_pool_id().get();
        assert!(!dex.borrow_pools().contains_key(pool_id), EPoolAlreadyExists);

        let asset1_metadata = assets.borrow_mut_metadata().get(asset1);
        let asset2_metadata = assets.borrow_mut_metadata().get(asset2);
        let lp_asset_symbol = dex_functions::pool_asset_symbol(asset1_metadata, asset2_metadata);

        let pool_address = address::from_u256((pool_id as u256));
        let lp_asset_id = assets.borrow_mut_next_asset_id().get();

        assets_functions::do_create(
            assets,
            false,
            false,
            true,
            @dubhe,
            lp_asset_symbol,
            lp_asset_symbol,
            ascii::string(LP_ASSET_DESCRIPTION),
            9,
            ascii::string(b""),
            ascii::string(b""),
        );

        dex.borrow_mut_pool_id().set(asset1, asset2, pool_id);
        dex.borrow_mut_pools().set(pool_id, dex_pool::new(pool_id, pool_address, lp_asset_id, asset1, asset2));
        dex.borrow_mut_next_pool_id().set(pool_id + 1);

        dex_pool_created_event::emit(sender, pool_id, pool_address, asset1, asset2, lp_asset_id, lp_asset_symbol);
    }

    public entry fun add_liquidity(dex: &Dex, assets: &mut Assets, asset1: u32, asset2: u32, amount1_desired: u256, amount2_desired: u256, amount1_min: u256, amount2_min: u256, ctx: &mut TxContext) {
        let sender = ctx.sender();

        let pool = dex_functions::get_pool(dex, asset1, asset2);

        let reserve1 = assets_functions::balance_of(assets, asset1, pool.get_pool_address());
        let reserve2 = assets_functions::balance_of(assets, asset2, pool.get_pool_address());
        let amount1;
        let amount2;
        if(reserve1 == 0 || reserve2 == 0) {
            amount1 = amount1_desired;
            amount2 = amount2_desired;
        } else {
            let amount2_optimal = dex_functions::quote(amount1_desired, reserve1, reserve2);
            if(amount2_optimal <= amount2_desired) {
                assert!(amount2_optimal >= amount2_min, 0);
                amount1 = amount1_desired;
                amount2 = amount2_optimal;
            } else {
                let amount1_optimal = dex_functions::quote(amount2_desired, reserve2, reserve1);
                assert!(amount1_optimal <= amount1_desired, 0);
                assert!(amount1_optimal >= amount1_min, 0);
                amount1 = amount1_optimal;
                amount2 = amount2_desired;
            }
        };

        assets_functions::do_transfer(asset1, sender, pool.get_pool_address(), amount1, assets);
        assets_functions::do_transfer(asset2, sender, pool.get_pool_address(), amount2, assets);

        let total_supply = assets_functions::supply_of(assets, pool.get_lp_asset_id());
        let mut lp_token_amount;
        let min_liquidity = dex.borrow_min_liquidity().get();
        if (total_supply == 0) {
            lp_token_amount = dex_functions::calc_lp_amount_for_zero_supply(dex, amount1, amount2);
            assets_functions::do_mint(
                pool.get_lp_asset_id(),
                pool.get_pool_address(),
                min_liquidity,
                assets
            );
        } else {
            let side1 = math_system::safe_mul_div(amount1, total_supply, reserve1);
            let side2 = math_system::safe_mul_div(amount2, total_supply, reserve2);
            lp_token_amount = side1.min(side2);
        };

        assert!(lp_token_amount > min_liquidity, 0);

        if(dex.borrow_fee_to().get() != @0x0) {
            let lp_fee = dex.borrow_lp_fee().get();
            let fee = math_system::safe_mul_div(lp_token_amount, lp_fee, 10000);
            assets_functions::do_transfer(pool.get_lp_asset_id(), sender, dex.borrow_fee_to().get(), fee, assets);
            lp_token_amount = lp_token_amount - fee;
        };

        assets_functions::do_mint(pool.get_lp_asset_id(), sender, lp_token_amount, assets);
        dex_liquidity_added_event::emit(sender, pool.get_pool_id(), amount1, amount2, pool.get_lp_asset_id(), lp_token_amount);
    }

    public entry fun remove_liquidity(dex: &Dex, assets: &mut Assets, asset1: u32, asset2: u32, lp_token_burn: u256, amount1_min_receive: u256, amount2_min_receive: u256, ctx: &mut TxContext) {
        let sender = ctx.sender();
        let mut lp_token_burn = lp_token_burn;

        let pool = dex_functions::get_pool(dex, asset1, asset2);

        let reserve1 = assets_functions::balance_of(assets, asset1, pool.get_pool_address());
        let reserve2 = assets_functions::balance_of(assets, asset2, pool.get_pool_address());

        let total_supply = assets_functions::supply_of(assets, pool.get_lp_asset_id());
        assert!(total_supply >= lp_token_burn, EOverflows);

        if(dex.borrow_fee_to().get() != @0x0) {
            let lp_fee = dex.borrow_lp_fee().get();
            let fee = math_system::safe_mul_div(lp_token_burn, lp_fee, 10000);
            assets_functions::do_transfer(pool.get_lp_asset_id(), sender, dex.borrow_fee_to().get(), fee, assets);
            lp_token_burn = lp_token_burn - fee;
        };

        let amount1 = math_system::safe_mul_div(lp_token_burn, reserve1, total_supply);
        let amount2 = math_system::safe_mul_div(lp_token_burn, reserve2, total_supply);

        assert!(amount1 > 0 && amount1 >= amount1_min_receive, EBelowMinAmount);
        assert!(amount2 > 0 && amount2 >= amount2_min_receive, EBelowMinAmount);

        // burn the provided lp token amount that includes the fee
        assets_functions::do_burn(pool.get_lp_asset_id(), sender, lp_token_burn, assets);

        assets_functions::do_transfer(asset1, pool.get_pool_address(), sender, amount1, assets);
        assets_functions::do_transfer(asset2, pool.get_pool_address(), sender, amount2, assets);

        dex_liquidity_removed_event::emit(sender, pool.get_pool_id(), amount1, amount2, pool.get_lp_asset_id(), lp_token_burn);
    }

    /// Swap the exact amount of `asset1` into `asset2`.
    /// `amount_out_min` param allows you to specify the min amount of the `asset2`
    /// you're happy to receive.
    ///
    public entry fun swap_exact_tokens_for_tokens(dex: &Dex, assets: &mut Assets, path: vector<u32>, amount_in: u256, amount_out_min: u256, to: address, ctx: &mut TxContext) {
        let sender = ctx.sender();
        dex_functions::do_swap_exact_tokens_for_tokens(dex, assets, sender, path, amount_in, amount_out_min, to);
    }

    /// Swap any amount of `asset1` to get the exact amount of `asset2`.
    /// `amount_in_max` param allows to specify the max amount of the `asset1`
    /// you're happy to provide.
    ///
    public entry fun swap_tokens_for_exact_tokens(dex: &Dex, assets: &mut Assets, path: vector<u32>, amount_out: u256, amount_in_max: u256, to: address, ctx: &mut TxContext) {
        let sender = ctx.sender();
        dex_functions::do_swap_tokens_for_exact_tokens(dex, assets, sender, path, amount_out, amount_in_max, to);
    }

    public fun get_amount_out(dex: &Dex, assets: &Assets, path: vector<u32>, amount_in: u256): u256 {
        assert!(amount_in > 0, 0);
        dex_functions::validate_swap_path(dex, path);
        let balance_path = dex_functions::balance_path_from_amount_in( dex, assets, amount_in, path);
        let amount_out = balance_path[balance_path.length() - 1].get_balance();
        amount_out
    }

    public fun get_amount_in(dex: &Dex, assets: &Assets, path: vector<u32>, amount_out: u256): u256 {
        assert!(amount_out > 0, 0);
        dex_functions::validate_swap_path(dex, path);
        let balance_path = dex_functions::balance_path_from_amount_out(dex, assets, amount_out, path);
        let amount_in = balance_path[0].get_balance();
        amount_in
    }

    public fun get_pool_list(dex: &Dex): vector<Pool> {
        dex.borrow_pools().values()
    }

    public fun get_pair_list(dex: &Dex): vector<vector<u32>> {
        let mut assets_list = vector[];
        let (assets1, assets2) = dex.borrow_pool_id().keys();
        let len = assets1.length();
        let mut i = 0;
        while (i < len) {
            assets_list.push_back(vector[assets1[i], assets2[i]]);
            i = i + 1;
        };
        assets_list
    }
}