#[test_only]
module merak::assets_tests {
    use std::debug;
    use std::ascii;
    use std::ascii::String;
    use merak::init_test::deploy_dapp_for_testing;
    use merak::assets_system;
    use merak::asset_metadata;
    use merak::schema::Schema;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;

    public fun create_assets(schema: &mut Schema, name: String, symbol: String, description: String, decimals: u8, url: String, info: String, scenario: &mut Scenario) {
        let ctx = test_scenario::ctx(scenario);
        assets_system::create(schema, name, symbol, description, decimals, url, info, 0, @0xA, @0xA, true, true, true,  ctx);
        test_scenario::next_tx(scenario,@0xA);
    }

    #[test]
    public fun assets_create() {
        let (mut scenario, dapp) = deploy_dapp_for_testing(@0xA);

        let mut schema = test_scenario::take_shared<Schema>(&scenario);

        let name = ascii::string(b"Obelisk Coin");
        let symbol = ascii::string(b"OBJ");
        let description = ascii::string(b"Obelisk Coin");
        let url = ascii::string(b"");
        let info = ascii::string(b"Obelisk Coin");
        let decimals = 9;
        create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);
        create_assets(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);

        assert!(schema.asset_metadata()[0] == asset_metadata::new(name, symbol, description, decimals, url, info), 0);
        assert!(schema.next_asset_id()[] == 2, 0);

        let ctx = test_scenario::ctx(&mut scenario);
        assets_system::mint(&mut schema, 0, ctx.sender(), 100, ctx);
        assets_system::mint(&mut schema, 1, ctx.sender(), 100, ctx);
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 100, 0);
        assert!(assets_system::balance_of(&mut schema, 0, @0x10000) == 0, 0);
        assert!(assets_system::supply_of(&mut schema, 0) == 100, 0);

        assets_system::transfer(&mut schema, 0, @0x0002, 50, ctx);
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 50, 0);
        assert!(assets_system::balance_of(&mut schema, 0, @0x0002) == 50, 0);
        assert!(assets_system::supply_of(&mut schema, 0) == 100, 0);

        assets_system::burn(&mut schema, 0, ctx.sender(), 50, ctx);
        assert!(assets_system::balance_of(&mut schema, 0, ctx.sender()) == 0, 0);
        assert!(assets_system::supply_of(&mut schema, 0) == 50, 0);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }
}