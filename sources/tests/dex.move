#[test_only]
module merak::dex_tests {
    use std::debug;
    use std::ascii;
    use merak::dex_schema;
    use dubhe::dapps_schema::Dapps;
    use merak::deploy_hook::deploy_hook_for_testing;
    use merak::dex_pool;
    use merak::dex_system;
    use merak::dex_schema::Dex;
    use merak::assets_tests;
    use merak::assets_system;
    use merak::assets_schema::Assets;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;

    public fun init_test(): (Assets, Dapps, Scenario) {
        let (mut scenario, dapps) = deploy_hook_for_testing();

        let mut assets = test_scenario::take_shared<Assets>(&scenario);
        let name = ascii::string(b"Poils Coin");
        let symbol = ascii::string(b"POL");
        let description = ascii::string(b"");
        let url = ascii::string(b"");
        let info = ascii::string(b"");
        let decimals = 9;
        assets_tests::create_assets(&mut assets, name, symbol, description, decimals, url, info, &mut scenario);
        assets_tests::create_assets(&mut assets, name, symbol, description, decimals, url, info, &mut scenario);
        assets_tests::create_assets(&mut assets, name, symbol, description, decimals, url, info, &mut scenario);

        let ctx = test_scenario::ctx(&mut scenario);
        assets_system::mint(&mut assets, 0, ctx.sender(), 1000000, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 1000000, ctx);
        assets_system::mint(&mut assets, 2, ctx.sender(), 1000000, ctx);

        (assets , dapps, scenario)
    }

    #[test]
    public fun create_pool() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        assert!(dex.borrow_mut_pool_id().contains_key(0, 1), 0);
        assert!(dex.borrow_mut_next_pool_id().get() == 1, 0);
        let pool_id = dex.borrow_mut_pool_id().get(0, 1);
        assert!(dex.borrow_mut_pools().get(pool_id) == dex_pool::new(pool_id, @0x0, 3, 0, 1), 0);

        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);
        assert!(dex.borrow_mut_pool_id().contains_key(1, 2), 0);
        assert!(dex.borrow_mut_next_pool_id().get() == 2, 0);
        let pool_id = dex.borrow_mut_pool_id().get(1, 2);
        assert!(dex.borrow_mut_pools().get(pool_id) == dex_pool::new(pool_id, @0x1, 4, 1, 2), 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun liquidity_test() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 100000, 100000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 900000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 900000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 100000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 100000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 100000, 0);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 100000, 100000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 800000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 800000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 200000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 200000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 200000, 0);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 200000, 100000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 700000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 700000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 300000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 300000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 300000, 0);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 100000, 200000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 600000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 600000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 400000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 400000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 400000, 0);

        dex_system::remove_liquidity(&dex, &mut assets, 0, 1, 100000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 700000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 700000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 300000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 300000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 300000, 0);

        dex_system::remove_liquidity(&dex, &mut assets, 1, 0, 100000, 100000, 100000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 800000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 800000, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 200000, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 200000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 200000, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun swap_test() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 100000, 100000, 100000, 100000, ctx);
        dex_system::add_liquidity(&dex, &mut assets, 1, 2, 100000, 100000, 100000, 100000, ctx);


        assert!(dex_system::get_amount_out(&dex, &assets, vector[0, 1], 10000) == 9066, 0);
        dex_system::swap_exact_tokens_for_tokens(&dex, &mut assets, vector[0, 1], 10000, 0, ctx.sender(), ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 900000 - 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 800000 + 9066, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 100000 + 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 100000 - 9066, 0);

        assert!(dex_system::get_amount_out(&dex, &assets, vector[0, 1, 2], 10000) == 7005, 0);
        dex_system::swap_exact_tokens_for_tokens(&dex, &mut assets, vector[0, 1, 2], 10000, 0, ctx.sender(), ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 900000 - 10000 - 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 800000 + 9066, 0);

        debug::print(&assets_system::balance_of(&assets, 0, @0x0));
        debug::print(&assets_system::balance_of(&assets, 1, @0x0));
        assert!(assets_system::balance_of(&assets, 0, @0x0) == 100000 + 10000 + 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 100000 - 9066 - 7556, 0);

        assert!(assets_system::balance_of(&assets, 1, @0x1) == 100000 + 7556, 0);
        assert!(assets_system::balance_of(&assets, 2, @0x1) == 100000 - 7005, 0);

        assert!(assets_system::balance_of(&assets, 2, ctx.sender()) == 900000 + 7005, 0);


        assert!(dex_system::get_amount_in(&dex, &assets, vector[1, 0], 10000) == 7603, 0);
        dex_system::swap_tokens_for_exact_tokens(&dex, &mut assets, vector[1, 0], 10000, 20000, ctx.sender(), ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 900000 - 10000 - 10000 + 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 800000 + 9066 - 7603, 0);

        assert!(assets_system::balance_of(&assets, 0, @0x0) == 100000 + 10000 + 10000 - 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, @0x0) == 100000 - 9066 - 7556 + 7603, 0);

        assert!(dex_system::get_amount_in(&dex, &assets, vector[1, 0, 1, 2], 10000) == 18322, 0);
        dex_system::swap_tokens_for_exact_tokens(&dex, &mut assets, vector[1, 0, 1, 2], 10000, 20000, ctx.sender(), ctx);

        let (assets1, assets2) = dex_schema::get_pool_id_keys(&dex);
        debug::print(&assets1);
        debug::print(&assets2);

        debug::print(&dex_schema::get_pools_values(&dex));

        debug::print(&dex_system::get_pair_list(&dex));

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }
}