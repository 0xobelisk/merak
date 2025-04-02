#[test_only]
module merak::assets_tests {
    use std::ascii;
    use std::ascii::String;
    use merak::merak_assets_functions;
    use merak::merak_init_test::deploy_dapp_for_testing;
    use merak::merak_assets_system;
    use merak::merak_schema::Schema;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;

    public fun create_assets(schema: &mut Schema, name: String, symbol: String, description: String, decimals: u8, url: String, info: String, scenario: &mut Scenario): u256 {
        let ctx = test_scenario::ctx(scenario);
        let asset_id = merak_assets_functions::do_create(schema, true, true, true, false,@0xA, name, symbol, description, decimals, url, info);
        test_scenario::next_tx(scenario,@0xA);
        asset_id
    }

    #[test]
    public fun assets_create() {
        let mut scenario = deploy_dapp_for_testing(@0xA);

        let mut schema = test_scenario::take_shared<Schema>(&scenario);

        let name = ascii::string(b"Obelisk Coin");
        let symbol = ascii::string(b"OBJ");
        let description = ascii::string(b"Obelisk Coin");
        let url = ascii::string(b"");
        let info = ascii::string(b"Obelisk Coin");
        let decimals = 9;
        let asset1  = create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);
        let asset2 = create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);

        // assert!(schema.next_asset_id()[] == 4, 0);

        let ctx = test_scenario::ctx(&mut scenario);
        merak_assets_system::mint(&mut schema, asset1, ctx.sender(), 100, ctx);
        merak_assets_system::mint(&mut schema, asset2, ctx.sender(), 100, ctx);
        assert!(merak_assets_system::balance_of(&mut schema, asset1, ctx.sender()) == 100, 0);
        assert!(merak_assets_system::balance_of(&mut schema, asset1, @0x10000) == 0, 0);
        assert!(merak_assets_system::supply_of(&mut schema, asset1) == 100, 0);

        merak_assets_system::transfer(&mut schema, asset1, @0x0002, 50, ctx);
        assert!(merak_assets_system::balance_of(&mut schema, asset1, ctx.sender()) == 50, 0);
        assert!(merak_assets_system::balance_of(&mut schema, asset1, @0x0002) == 50, 0);
        assert!(merak_assets_system::supply_of(&mut schema, asset1) == 100, 0);

        merak_assets_system::burn(&mut schema, asset1, ctx.sender(), 50, ctx);
        assert!(merak_assets_system::balance_of(&mut schema, asset1, ctx.sender()) == 0, 0);
        assert!(merak_assets_system::supply_of(&mut schema, asset1) == 50, 0);

        test_scenario::return_shared<Schema>(schema);
        scenario.end();
    }
}