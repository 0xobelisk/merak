#[test_only]
module merak::assets_tests {
    use std::debug;
    use std::ascii;
    use std::ascii::String;
    use merak::deploy_hook::deploy_hook_for_testing;
    use dubhe::dapps_schema::Dapps;
    use merak::assets_system;
    use merak::assets_metadata;
    use merak::assets_schema::Assets;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;

    public fun create_assets(assets: &mut Assets, name: String, symbol: String, description: String, decimals: u8, url: String, info: String, scenario: &mut Scenario) {
        let ctx = test_scenario::ctx(scenario);
        assets_system::create(assets, name, symbol, description, decimals, url, info, 0, @0xA, @0xA, true, true, true,  ctx);
        test_scenario::next_tx(scenario,@0xA);
    }

    #[test]
    public fun test_init_assets()  {
        let (scenario, dapps) = deploy_hook_for_testing();

        let assets = test_scenario::take_shared<Assets>(&scenario);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }

    #[test]
    public fun assets_create() {
        let (mut scenario, dapps) = deploy_hook_for_testing();

        let mut assets = test_scenario::take_shared<Assets>(&scenario);

        let name = ascii::string(b"Obelisk Coin");
        let symbol = ascii::string(b"OBJ");
        let description = ascii::string(b"Obelisk Coin");
        let url = ascii::string(b"");
        let info = ascii::string(b"Obelisk Coin");
        let decimals = 9;
        create_assets(&mut assets, name, symbol, description, decimals, url, info, &mut scenario);
        create_assets(&mut assets, name, symbol, description, decimals, url, info, &mut scenario);

        let metadata = assets.borrow_mut_metadata().get(0);
        assert!(metadata == assets_metadata::new(name, symbol, description, decimals, url, info), 0);
        assert!(2 == assets.borrow_mut_next_asset_id().get(), 0);

        let ctx = test_scenario::ctx(&mut scenario);
        assets_system::mint(&mut assets, 0, ctx.sender(), 100, ctx);
        assets_system::mint(&mut assets, 1, ctx.sender(), 100, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 100, 0);
        assert!(assets_system::balance_of(&assets, 0, @0x10000) == 0, 0);
        assert!(assets_system::supply_of(&assets, 0) == 100, 0);
        assert!(assets_system::owned_assets(&assets, ctx.sender()) == vector[0, 1], 0);

        debug::print(&assets_system::owned_assets(&assets, ctx.sender()));
        assets_system::transfer(&mut assets, 0, @0x0002, 50, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 50, 0);
        assert!(assets_system::balance_of(&assets, 0, @0x0002) == 50, 0);
        assert!(assets_system::supply_of(&assets, 0) == 100, 0);

        assets_system::burn(&mut assets, 0, ctx.sender(), 50, ctx);
        assert!(assets_system::balance_of(&assets, 0, ctx.sender()) == 0, 0);
        assert!(assets_system::supply_of(&assets, 0) == 50, 0);

        test_scenario::return_shared<Assets>(assets);
        test_scenario::return_shared<Dapps>(dapps);
        test_scenario::end(scenario);
    }
}