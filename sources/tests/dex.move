#[test_only]
module merak::dex_tests {
    use std::debug;
    use std::ascii;
    use std::u128;
    use merak::dex_functions;
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

        (assets , dapps, scenario)
    }

    #[test]
    public fun check_max_number() {
        let (assets, dapps, scenario) = init_test();
        let dex = test_scenario::take_shared<Dex>(&scenario);
        let u128_max = u128::max_value!() as u256;

        assert!(dex_functions::quote(3, u128_max, u128_max) ==  3);

        let x = 1_000_000_000_000_000_000;
        assert!(dex_functions::quote(10000_0000_0000 * x, 100_0000_0000_0000 * x, 100_0000_0000_0000 * x) == 10000_0000_0000 * x, 100);

        assert!(dex_functions::quote(u128_max, u128_max, 1) == 1);

        assert!(dex_functions::get_amount_out(&dex, 100, u128_max, u128_max) == 99);
        assert!(dex_functions::get_amount_in(&dex, 100, u128_max, u128_max) == 101);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
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
    #[expected_failure(abort_code = merak::dex_system::EPoolAlreadyExists, location = merak::dex_system)]
    public fun create_same_pool_twice_should_fail() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);

        dex_system::create_pool(&mut dex, &mut assets, 1, 0, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun can_add_liquidity() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);
        dex.borrow_mut_swap_fee().set(0);
        dex.borrow_mut_lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 0, 2, ctx);

        assets_system::mint(&mut assets, 0, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut assets, 2, ctx.sender(), 20000, ctx);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 10000, 10, 0, 0, ctx);
        let pool = dex_functions::get_pool(&dex, 0, 1);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 20000 - 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 20000 - 10, 0);
        assert!(assets_system::balance_of(&assets, 0, pool.get_pool_address()) == 10000, 0);
        assert!(assets_system::balance_of(&assets, 1, pool.get_pool_address()) == 10, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 216, 0);


        dex_system::add_liquidity(&dex, &mut assets, 2, 0, 10, 10000, 10, 10000, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 20000 - 10000 - 10000, 0);
        assert!(assets_system::balance_of(&assets, 2, ctx.sender()) == 20000 - 10, 0);
        assert!(assets_system::balance_of(&assets, 3, ctx.sender()) == 216, 0);
        let pool = dex_functions::get_pool(&dex, 0, 2);
        assert!(assets_system::balance_of(&assets, 0, pool.get_pool_address()) == 10000, 0);
        assert!(assets_system::balance_of(&assets, 2, pool.get_pool_address()) == 10, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun can_remove_liquidity() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        dex.borrow_mut_swap_fee().set(0);
        dex.borrow_mut_lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 0, 2, ctx);

        assets_system::mint(&mut assets, 0, ctx.sender(), 10000000000, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 100000, ctx);
        assets_system::mint(&mut assets, 2, ctx.sender(), 100000, ctx);

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, 1000000000, 100000, 1000000000, 100000, ctx);
        let pool = dex_functions::get_pool(&dex, 0, 1);

        let total_lp_received = assets_system::balance_of(&assets, pool.get_lp_asset_id(), ctx.sender());
        // 9999900
        debug::print(&total_lp_received);
        // 10%
        dex.borrow_mut_lp_fee().set(1000);
        dex.borrow_mut_fee_to().set(@0xB);

        dex_system::remove_liquidity(&dex, &mut assets, 0, 1, total_lp_received, 0, 0, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 10000000000 - 1000000000 + 899991000, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 89999, 0);
        assert!(assets_system::balance_of(&assets, pool.get_lp_asset_id(), ctx.sender()) == 0, 0);

        assert!(assets_system::balance_of(&assets, 0, pool.get_pool_address()) == 100009000, 0);
        assert!(assets_system::balance_of(&assets, 1, pool.get_pool_address()) == 10001, 0);
        assert!(assets_system::balance_of(&assets, pool.get_lp_asset_id(), @0xB) == 999990, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun can_swap() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        dex.borrow_mut_swap_fee().set(0);
        dex.borrow_mut_lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);

        assets_system::mint(&mut assets, 0, ctx.sender(), 10000, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 1000, ctx);
        assets_system::mint(&mut assets, 2, ctx.sender(), 100000, ctx);

        let liquidity1 = 10000;
        let liquidity2 = 200;

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, liquidity1, liquidity2, 1, 1, ctx);

        let input_amount = 100;
        let expect_receive =
            dex_functions::get_amount_out(&dex, input_amount, liquidity2, liquidity1);

        debug::print(&expect_receive);

        dex_system::swap_exact_tokens_for_tokens(&dex, &mut assets, vector[1, 0], input_amount, 1, ctx.sender(), ctx);

        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == expect_receive, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 1000 - liquidity2 - input_amount, 0);
        let pool = dex_functions::get_pool(&dex, 0, 1);
        assert!(assets_system::balance_of(&assets, 0, pool.get_pool_address()) == liquidity1 - expect_receive, 0);
        assert!(assets_system::balance_of(&assets, 1, pool.get_pool_address()) == liquidity2 + input_amount, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun can_swap_with_realistic_values() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        dex.borrow_mut_swap_fee().set(0);
        dex.borrow_mut_lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);

        let unit: u256 = 1_000_000_000_000_000_000;

        assets_system::mint(&mut assets, 0, ctx.sender(), 3_000_000_000 * unit, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 1_100_000 * unit, ctx);

        let liquidity_sui = 1_000_000_000 * unit; // ratio for a 5$ price
        let liquidity_usd = 1_000_000 * unit;

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, liquidity_sui, liquidity_usd, 1, 1, ctx);

        let input_amount = 10 * unit; // usd

        dex_system::swap_exact_tokens_for_tokens(&dex, &mut assets, vector[1, 0], input_amount, 1, ctx.sender(), ctx);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun can_swap_tokens_for_exact_tokens() {
        let (mut assets, dapps, mut scenario) = init_test();
        let mut dex = test_scenario::take_shared<Dex>(&scenario);

        dex.borrow_mut_swap_fee().set(0);
        dex.borrow_mut_lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut dex, &mut assets, 0, 1, ctx);
        dex_system::create_pool(&mut dex, &mut assets, 1, 2, ctx);

        assets_system::mint(&mut assets, 0, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 1000, ctx);
        assets_system::mint(&mut assets, 2, ctx.sender(), 100000, ctx);

        let liquidity1 = 10000;
        let liquidity2 = 200;

        dex_system::add_liquidity(&dex, &mut assets, 0, 1, liquidity1, liquidity2, 1, 1, ctx);

        let exchange_out = 50;
        let expect_in =
            dex_functions::get_amount_in(&dex, exchange_out, liquidity1, liquidity2);

        dex_system::swap_tokens_for_exact_tokens(&dex, &mut assets, vector[0, 1], exchange_out, 3500, ctx.sender(), ctx);

        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 10000 - expect_in, 0);
        assert!(assets_system::balance_of(&assets, 1, ctx.sender()) == 1000 - liquidity2 + exchange_out, 0);
        let pool = dex_functions::get_pool(&dex, 0, 1);
        assert!(assets_system::balance_of(&assets, 0, pool.get_pool_address()) == liquidity1 + expect_in, 0);
        assert!(assets_system::balance_of(&assets, 1, pool.get_pool_address()) == liquidity2 - exchange_out, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dex>(dex);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }
}