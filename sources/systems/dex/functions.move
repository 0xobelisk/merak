module merak::dex_functions {
    use std::u64;
    use std::debug::print;
    use std::ascii;
    use std::ascii::String;
    use merak::dex_pool::Pool;
    use sui::vec_set;
    use merak::math_system;
    use merak::dex_swap_executed_event;
    use merak::assets_functions;
    use merak::assets_schema::Assets;
    use merak::dex_schema::Dex;
    use merak::assets_metadata::Metadata;
    use merak::dex_path_element::PathElement;
    use merak::dex_path_element;

    const EPoolNotFound: u64 = 0;
    const EBelowMinLiquidity: u64 = 1;
    const EMoreThanMaxSwapPathLen: u64 = 2;

    public(package) fun sort_assets(asset1: u32, asset2: u32): (u32, u32) {
        assert!(asset1 != asset2, 0);
        if (asset1 < asset2) {
            (asset1, asset2)
        } else {
            (asset2, asset1)
        }
    }

    public(package) fun get_pool_id(dex: &Dex, asset1: u32, asset2: u32): u32 {
        let (asset1, asset2) = sort_assets(asset1, asset2);
        assert!(dex.borrow_pool_id().contains_key(asset1, asset2), EPoolNotFound);
        dex.borrow_pool_id().get(asset1, asset2)
    }

    public(package) fun get_pool(dex: &Dex, asset1: u32, asset2: u32): Pool {
        let (asset1, asset2) = sort_assets(asset1, asset2);
        assert!(dex.borrow_pool_id().contains_key(asset1, asset2), EPoolNotFound);
        let pool_id = dex.borrow_pool_id().get(asset1, asset2);
        assert!(dex.borrow_pools().contains_key(pool_id), EPoolNotFound);
        dex.borrow_pools().get(pool_id)
    }

    public(package) fun pool_asset_symbol(asset1_metadata: Metadata, asset2_metadata: Metadata): String {
        let asset1_symbol = asset1_metadata.get_symbol();
        let asset2_symbol = asset2_metadata.get_symbol();
        let mut lp_asset_symbol = ascii::string(b"");
        lp_asset_symbol.append(asset1_symbol);
        lp_asset_symbol.append(ascii::string(b"-"));
        lp_asset_symbol.append(asset2_symbol);
        lp_asset_symbol
    }

    public(package) fun quote(amount: u256, reserve1: u256, reserve2: u256): u256 {
        math_system::safe_mul_div(amount , reserve2 , reserve1 )
    }

    public(package) fun calc_lp_amount_for_zero_supply(dex: &Dex, amount1: u256, amount2: u256): u256 {
        let result  = math_system::safe_mul_sqrt(amount1 , amount2 );
        let min_liquidity = dex.borrow_min_liquidity().get();
        assert!(result >= min_liquidity, EBelowMinLiquidity);
        result - min_liquidity
    }

    /// Ensure that a path is valid.
    /// validate all the pools in the path are unique
    /// Avoiding circular paths
    public(package) fun validate_swap_path(dex: &Dex, path: vector<u32>) {
        let len = path.length();
        assert!(len >= 2, 0);
        assert!(len <= (dex.borrow_max_swap_path_len().get() as u64), EMoreThanMaxSwapPathLen);

        let mut pools = vec_set::empty<u32>();

        let paths = math_system::windows(&path, 2);
        paths.do!(|path| {
            let pool_id = get_pool_id(dex, path[0], path[1]);
            pools.insert(pool_id);
        });
    }

    /// Returns the balance of each asset in the pool.
    /// The tuple result is in the order requested (not necessarily the same as pool order).
    public(package) fun get_reserves(dex: &Dex, assets: &Assets, asset1: u32, asset2: u32): (u256, u256) {
        let pool = get_pool(dex, asset1, asset2);

        let balance1 = assets_functions::balance_of(assets, asset1, pool.get_pool_address());
        let balance2 = assets_functions::balance_of(assets, asset2, pool.get_pool_address());
        (balance1, balance2)
    }

    // Calculates amount out.
    //
    // Given an input amount of an asset and pair reserves, returns the maximum output amount
    // of the other asset.
    public(package) fun get_amount_out(dex: &Dex, amount_in: u256, reserve_in: u256, reserve_out: u256): u256 {
        assert!(reserve_in > 0 && reserve_out > 0, 0);

        let amount_in_with_fee = amount_in * (10000 - dex.borrow_swap_fee().get());

        let numerator = amount_in_with_fee * reserve_out;

        let denominator = reserve_in * 10000 + amount_in_with_fee;

        numerator / denominator
    }

    // Calculates amount out.
    //
    // Given an input amount of an asset and pair reserves, returns the maximum output amount
    // of the other asset.
    public(package) fun get_amount_in(dex: &Dex, amount_out: u256, reserve_in: u256, reserve_out: u256): u256 {
        assert!(reserve_in > 0 && reserve_out > 0, 0);

        let numerator = reserve_in * amount_out * 10000;

        let denominator = (reserve_out - amount_out) * (10000 - dex.borrow_swap_fee().get());
        (numerator / denominator + 1)
    }

    /// Following an amount into a `path`, get the corresponding amounts out.
    public(package) fun balance_path_from_amount_in(dex: &Dex, assets: &Assets, amount_in: u256, path: vector<u32>): vector<PathElement> {
        let mut balance_path = vector[];
        let mut amount_out = amount_in;

        let len = path.length();

        u64::range_do!(0, len, |i| {
            let asset1 = path[i];
            if (i + 1 < len) {
                let asset2 = path[i + 1];
                let (reserve_in, reserve_out) = get_reserves(dex, assets, asset1, asset2);
                balance_path.push_back(dex_path_element::new(asset1, amount_out));
                amount_out = get_amount_out(dex, amount_out, reserve_in, reserve_out);
            } else {
                balance_path.push_back(dex_path_element::new(asset1, amount_out));
            };
        });
        balance_path
    }

    public(package) fun balance_path_from_amount_out(dex: &Dex, assets: &Assets, amount_out: u256, path: vector<u32>): vector<PathElement> {
        let mut balance_path = vector[];
        let mut amount_in = amount_out;
        let mut path = path;
        path.reverse();

        let len = path.length();
        u64::range_do!(0, len, |i| {
            let asset2 = path[i];
            if (i + 1 < len) {
                let asset1 = path[i + 1];
                let (reserve_in, reserve_out) = get_reserves(dex, assets, asset1, asset2);
                balance_path.push_back(dex_path_element::new(asset2, amount_in));
                amount_in = get_amount_in(dex, amount_in, reserve_in, reserve_out);
            } else {
                balance_path.push_back(dex_path_element::new(asset2, amount_in));
            };
        });
        balance_path.reverse();
        balance_path
    }

    public(package) fun credit_swap(dex: &Dex, assets: &mut Assets, amount_in: u256, path: vector<PathElement>): (u32, u256) {
        let len = path.length();
        let mut pos = 0;
        let mut return_balance = 0;
        let mut return_asset_id = 0;
        while (pos < len) {
            let asset1 = path[pos].get_asset_id();

            if(pos + 1 < len) {
                let asset2 = path[pos + 1].get_asset_id();
                let amount_out = path[pos + 1].get_balance();
                let pool = get_pool(dex, asset1, asset2);
                let pool_from_address = pool.get_pool_address();

                if (pos + 2 < len) {
                    let asset3 = path[pos + 2].get_asset_id();
                    let pool = get_pool(dex, asset2, asset3);
                    let pool_to_address = pool.get_pool_address();
                    assets_functions::do_transfer(asset2, pool_from_address, pool_to_address, amount_out, assets);
                } else {
                    assets_functions::do_burn(asset2, pool_from_address, amount_out, assets);
                    return_asset_id = asset2;
                    return_balance = amount_out;
                    break
                };
            };

            pos = pos + 1;
        };

        let asset1 = path[0].get_asset_id();
        let asset2 = path[1].get_asset_id();
        let pool = get_pool(dex, asset1, asset2);
        let pool_to_address = pool.get_pool_address();

        assets_functions::do_mint(asset1, pool_to_address, amount_in, assets);
        (return_asset_id, return_balance)
    }

    // Swap assets along the `path`, withdrawing from `sender` and depositing in `send_to`.
    // Note: It's assumed that the provided `path` is valid.
    public(package) fun swap(dex: &Dex, assets: &mut Assets, sender: address, path: vector<PathElement>, send_to: address) {
        let asset_in = path[0].get_asset_id();
        let amount_in = path[0].get_balance();
        // Withdraw the first asset from the sender
        assets_functions::do_burn(asset_in, sender, amount_in, assets);
        let (asset_id, amount_out) = credit_swap(dex, assets, amount_in, path);
        // Deposit the last asset to the send_to
        assets_functions::do_mint(asset_id, send_to, amount_out, assets);
    }

    /// Swap exactly `amount_in` of asset `path[0]` for asset `path[1]`.
    /// If an `amount_out_min` is specified, it will return an error if it is unable to acquire
    /// the amount desired.
    ///
    /// Withdraws the `path[0]` asset from `sender`, deposits the `path[1]` asset to `send_to`,
    /// respecting `keep_alive`.
    ///
    /// If successful, returns the amount of `path[1]` acquired for the `amount_in`.
    ///
    public(package) fun do_swap_exact_tokens_for_tokens(
        dex: &Dex,
        assets: &mut Assets,
        sender: address,
        path: vector<u32>,
        amount_in: u256,
        amount_out_min: u256,
        send_to: address
    ) {
        assert!(amount_in > 0, 0);
        assert!(amount_out_min >= 0, 0);

        validate_swap_path(dex, path);

        let balance_path = balance_path_from_amount_in(dex, assets, amount_in, path);
        print(&balance_path);

        let amount_out = balance_path[balance_path.length() - 1].get_balance();
        assert!(amount_out >= amount_out_min, 0);

        swap(dex, assets, sender, balance_path, send_to);
        dex_swap_executed_event::emit(sender, send_to, amount_in, amount_out, path);
    }

    /// Take the `path[0]` asset and swap some amount for `amount_out` of the `path[1]`. If an
    /// `amount_in_max` is specified, it will return an error if acquiring `amount_out` would be
    /// too costly.
    ///
    /// Withdraws `path[0]` asset from `sender`, deposits the `path[1]` asset to `send_to`,
    /// respecting `keep_alive`.
    ///
    /// If successful returns the amount of the `path[0]` taken to provide `path[1]`.
    ///
    public(package) fun do_swap_tokens_for_exact_tokens(
        dex: &Dex,
        assets: &mut Assets,
        sender: address,
        path: vector<u32>,
        amount_out: u256,
        amount_in_max: u256,
        send_to: address) {
        assert!(amount_out > 0, 0);
        assert!(amount_in_max > 0, 0);

        validate_swap_path(dex, path);

        let balance_path = balance_path_from_amount_out(dex, assets, amount_out, path);
        print(&balance_path);

        let amount_in = balance_path[0].get_balance();
        assert!(amount_in <= amount_in_max, 0);

        swap(dex, assets, sender, balance_path, send_to);
        dex_swap_executed_event::emit(sender, send_to, amount_in, amount_out, path);
    }
}