#[test_only]
module merak::wrapper_tests {
    use std::ascii;
    use std::ascii::String;
    use merak::schema::Schema;
    use merak::init_test::deploy_dapp_for_testing;
    use merak::assets_system;
    use merak::wrapper_system;
    use sui::test_scenario;
    use sui::test_scenario::Scenario;
    use sui::coin;

    public struct USDT has drop {}

    public fun wrapper_register<T>(schema: &mut Schema, name: String, symbol: String, description: String, decimals: u8, url: String, info: String, scenario: &mut Scenario) {
        let ctx = test_scenario::ctx(scenario);
        wrapper_system::force_register<T>(schema, name, symbol, description, decimals, url, info, ctx);
        test_scenario::next_tx(scenario,@0xA);
    }

    #[test]
    public fun schema() {
        let (mut scenario, dapp) = deploy_dapp_for_testing(@0xA);
        let mut schema = test_scenario::take_shared<Schema>(&scenario);

        let name = ascii::string(b"USDT");
        let symbol = ascii::string(b"USDT");
        let description = ascii::string(b"USDT");
        let url = ascii::string(b"");
        let info = ascii::string(b"USDT");
        let decimals = 6;
        wrapper_register<USDT>(&mut schema, name, symbol, description, decimals, url, info, &mut scenario);

        let ctx = test_scenario::ctx(&mut scenario);
        let amount: u256 = 1000000;

        let usdt = coin::mint_for_testing<USDT>(amount as u64, ctx);
        let beneficiary = ctx.sender();
        wrapper_system::wrap(&mut schema, usdt, beneficiary);
        assert!(assets_system::balance_of(&mut schema,0, beneficiary) == amount, 0);
        assert!(assets_system::supply_of(&mut schema,0) == amount, 1);

        wrapper_system::unwrap<USDT>(&mut schema, amount, beneficiary, ctx);
        assert!(assets_system::balance_of(&mut schema, 0, beneficiary) == 0, 1);

        let usdt = coin::mint_for_testing<USDT>(amount as u64, ctx);
        wrapper_system::wrap(&mut schema, usdt, beneficiary);
        assert!(assets_system::balance_of(&mut schema,0, beneficiary) == amount, 0);
        assert!(assets_system::supply_of(&mut schema,0) == amount, 1);

        let usdt = coin::mint_for_testing<USDT>(amount as u64, ctx);
        wrapper_system::wrap(&mut schema, usdt, beneficiary);
        assert!(assets_system::balance_of(&mut schema,0, beneficiary) == amount * 2, 0);
        assert!(assets_system::supply_of(&mut schema,0) == amount * 2, 1);

        let usdt = coin::mint_for_testing<USDT>(amount as u64, ctx);
        wrapper_system::wrap(&mut schema, usdt, beneficiary);
        assert!(assets_system::balance_of(&mut schema,0, beneficiary) == amount * 3, 0);
        assert!(assets_system::supply_of(&mut schema,0) == amount * 3, 1);

        test_scenario::return_shared<Schema>(schema);
        dapp.distroy_dapp_for_testing();
        scenario.end();
    }
}