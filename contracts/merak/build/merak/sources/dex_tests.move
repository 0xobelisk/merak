#[test_only]
module merak::dex_tests {
    use std::debug;
    use std::ascii;
    use std::u128;
    use merak::dex_functions;
    use merak::init_test::deploy_dapp_for_testing;
    use merak::pool;
    use merak::dex_system;
    use merak::assets_tests;
    use merak::assets_system;
    use merak::schema::Schema;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;
    use merak::dapp_schema::Dapp;

    public fun init_test(): (Schema, Dapp, Scenario) {
        let (mut scenario,  dapp) = deploy_dapp_for_testing(@0xA);

        let mut schema = test_scenario::take_shared<Schema>(&scenario);
        let name = ascii::string(b"Poils Coin");
        let symbol = ascii::string(b"POL");
        let description = ascii::string(b"");
        let url = ascii::string(b"");
        let info = ascii::string(b"");
        let decimals = 9;
        assets_tests::create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);
        assets_tests::create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);
        assets_tests::create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);

        (schema, dapp, scenario)
    }

    #[test]
    public fun check_max_number() {
        let (mut schema, dapp, scenario) = init_test();
        let u128_max = u128::max_value!() as u256;

        assert!(dex_functions::quote(3, u128_max, u128_max) ==  3);

        let x = 1_000_000_000_000_000_000;
        assert!(dex_functions::quote(10000_0000_0000 * x, 100_0000_0000_0000 * x, 100_0000_0000_0000 * x) == 10000_0000_0000 * x, 100);

        assert!(dex_functions::quote(u128_max, u128_max, 1) == 1);

        assert!(dex_functions::get_amount_out(&mut schema, 100, u128_max, u128_max) == 99);
        assert!(dex_functions::get_amount_in(&mut schema, 100, u128_max, u128_max) == 101);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun create_pool() {
        let (mut schema, dapp, mut scenario) = init_test();
        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);

        let pool_address = dex_functions::generate_pool_address(0, 1);
        assert!(schema.pools().get(0, 1) == pool::new(pool_address, 3));

        let pool_address = dex_functions::generate_pool_address(1, 2);
        dex_system::create_pool(&mut schema, 1, 2, ctx);
        assert!(schema.pools().get(1, 2) == pool::new(pool_address, 4));

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    #[expected_failure(abort_code = merak::errors::PoolAlreadyExists)]
    public fun create_same_pool_twice_should_fail() {
        let (mut schema, dapp, mut scenario) = init_test();

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);

        dex_system::create_pool(&mut schema, 1, 0, ctx);
        // dex_system::create_pool(&mut schema, 0, 1, ctx);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun can_add_liquidity() {
        let (mut schema, dapp, mut scenario) = init_test();
        schema.swap_fee().set(0);
        schema.lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);
        dex_system::create_pool(&mut schema, 1, 2, ctx);
        dex_system::create_pool(&mut schema, 0, 2, ctx);

        assets_system::mint(&mut schema, 0, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut schema, 2, ctx.sender(), 20000, ctx);

        dex_system::add_liquidity(&mut schema, 0, 1, 10000, 10, 0, 0, ctx);
        let (pool_address, lp_asset_id) = dex_functions::get_pool(&mut schema, 0, 1).get();
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 20000 - 10000, 0);
        assert!(assets_system::balance_of(&mut schema, 1, ctx.sender()) == 20000 - 10, 0);
        assert!(assets_system::balance_of(&mut schema, 0, pool_address) == 10000, 0);
        assert!(assets_system::balance_of(&mut schema, 1, pool_address) == 10, 0);
        assert!(assets_system::balance_of(&mut schema, lp_asset_id, ctx.sender()) == 216, 0);


        dex_system::add_liquidity(&mut schema, 2, 0, 10, 10000, 10, 10000, ctx);
        let (pool_address, lp_asset_id) = dex_functions::get_pool(&mut schema, 0, 2).get();
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 20000 - 10000 - 10000, 0);
        assert!(assets_system::balance_of(&mut schema, 2, ctx.sender()) == 20000 - 10, 0);
        assert!(assets_system::balance_of(&mut schema, lp_asset_id, ctx.sender()) == 216, 0);
        assert!(assets_system::balance_of(&mut schema, 0, pool_address) == 10000, 0);
        assert!(assets_system::balance_of(&mut schema, 2, pool_address) == 10, 0);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun can_remove_liquidity() {
        let (mut schema, dapp, mut scenario) = init_test();
        schema.swap_fee().set(0);
        schema.lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);
        dex_system::create_pool(&mut schema, 1, 2, ctx);
        dex_system::create_pool(&mut schema, 0, 2, ctx);

        assets_system::mint(&mut schema, 0, ctx.sender(), 10000000000, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 100000, ctx);
        assets_system::mint(&mut schema, 2, ctx.sender(), 100000, ctx);

        dex_system::add_liquidity(&mut schema, 0, 1, 1000000000, 100000, 1000000000, 100000, ctx);
        let (pool_address, lp_asset_id) = dex_functions::get_pool(&mut schema, 0, 1).get();

        let total_lp_received = assets_system::balance_of(&mut schema, lp_asset_id, ctx.sender());
        // 9999900
        debug::print(&total_lp_received);
        // 10%
        schema.lp_fee().set(1000);
        schema.fee_to().set(@0xB);

        dex_system::remove_liquidity(&mut schema, 0, 1, total_lp_received, 0, 0, ctx);
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 10000000000 - 1000000000 + 899991000, 0);
        assert!(assets_system::balance_of(&mut schema, 1, ctx.sender()) == 89999, 0);
        assert!(assets_system::balance_of(&mut schema, lp_asset_id, ctx.sender()) == 0, 0);

        assert!(assets_system::balance_of(&mut schema, 0, pool_address) == 100009000, 0);
        assert!(assets_system::balance_of(&mut schema, 1, pool_address) == 10001, 0);
        assert!(assets_system::balance_of(&mut schema, lp_asset_id, @0xB) == 999990, 0);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun can_swap() {
        let (mut schema, dapp, mut scenario) = init_test();
        schema.swap_fee().set(0);
        schema.lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);
        dex_system::create_pool(&mut schema, 1, 2, ctx);

        assets_system::mint(&mut schema, 0, ctx.sender(), 10000, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 1000, ctx);
        assets_system::mint(&mut schema, 2, ctx.sender(), 100000, ctx);

        let liquidity1 = 10000;
        let liquidity2 = 200;

        dex_system::add_liquidity(&mut schema, 0, 1, liquidity1, liquidity2, 1, 1, ctx);

        let input_amount = 100;
        let expect_receive =
            dex_functions::get_amount_out(&mut schema, input_amount, liquidity2, liquidity1);

        debug::print(&expect_receive);

        dex_system::swap_exact_tokens_for_tokens(&mut schema, vector[1, 0], input_amount, 1, ctx.sender(), ctx);

        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == expect_receive, 0);
        assert!(assets_system::balance_of(&mut schema, 1, ctx.sender()) == 1000 - liquidity2 - input_amount, 0);
        let pool_address = dex_functions::get_pool(&mut schema, 0, 1).get_pool_address();
        assert!(assets_system::balance_of(&mut schema, 0, pool_address) == liquidity1 - expect_receive, 0);
        assert!(assets_system::balance_of(&mut schema, 1, pool_address) == liquidity2 + input_amount, 0);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun can_swap_with_realistic_values() {
        let (mut schema, dapp, mut scenario) = init_test();
        schema.swap_fee().set(0);
        schema.lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);
        dex_system::create_pool(&mut schema, 1, 2, ctx);

        let unit: u256 = 1_000_000_000_000_000_000;

        assets_system::mint(&mut schema, 0, ctx.sender(), 3_000_000_000 * unit, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 1_100_000 * unit, ctx);

        let liquidity_sui = 1_000_000_000 * unit; // ratio for a 5$ price
        let liquidity_usd = 1_000_000 * unit;

        dex_system::add_liquidity(&mut schema, 0, 1, liquidity_sui, liquidity_usd, 1, 1, ctx);

        let input_amount = 10 * unit; // usd

        dex_system::swap_exact_tokens_for_tokens(&mut schema, vector[1, 0], input_amount, 1, ctx.sender(), ctx);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }

    #[test]
    public fun can_swap_tokens_for_exact_tokens() {
        let (mut schema, dapp, mut scenario) = init_test();
        schema.swap_fee().set(0);
        schema.lp_fee().set(0);

        let ctx =  test_scenario::ctx(&mut scenario);
        dex_system::create_pool(&mut schema, 0, 1, ctx);
        dex_system::create_pool(&mut schema, 1, 2, ctx);

        assets_system::mint(&mut schema, 0, ctx.sender(), 20000, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 1000, ctx);
        assets_system::mint(&mut schema, 2, ctx.sender(), 100000, ctx);

        let liquidity1 = 10000;
        let liquidity2 = 200;

        dex_system::add_liquidity(&mut schema, 0, 1, liquidity1, liquidity2, 1, 1, ctx);

        let exchange_out = 50;
        let expect_in =
            dex_functions::get_amount_in(&mut schema, exchange_out, liquidity1, liquidity2);

        dex_system::swap_tokens_for_exact_tokens(&mut schema, vector[0, 1], exchange_out, 3500, ctx.sender(), ctx);

        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 10000 - expect_in, 0);
        assert!(assets_system::balance_of(&mut schema, 1, ctx.sender()) == 1000 - liquidity2 + exchange_out, 0);
        let pool_address = dex_functions::get_pool(&mut schema, 0, 1).get_pool_address();
        assert!(assets_system::balance_of(&mut schema, 0, pool_address) == liquidity1 + expect_in, 0);
        assert!(assets_system::balance_of(&mut schema, 1, pool_address) == liquidity2 - exchange_out, 0);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }
}