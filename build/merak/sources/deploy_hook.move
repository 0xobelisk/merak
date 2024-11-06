#[allow(lint(share_owned))]
  
  module merak::deploy_hook {

  use dubhe::dapps_schema::Dapps;

  use dubhe::dapps_system;

  use merak::dapp_key::DappKey;

  use std::ascii;

  use sui::clock::Clock;

  use sui::transfer::public_share_object;

  #[test_only]

  use dubhe::dapps_schema;

  #[test_only]

  use sui::clock;

  #[test_only]

  use sui::test_scenario;

  #[test_only]

  use sui::test_scenario::Scenario;

  public entry fun run(dapps: &mut Dapps, clock: &Clock, ctx: &mut TxContext) {
    // Register the dapp to dubhe.
    dapps_system::register<DappKey>(
            dapps,
            ascii::string(b"merak"),
            ascii::string(b"Merak Protocol"),
            clock,
            ctx
        );
    let assets = merak::assets_schema::register(dapps, ctx);
    let dex = merak::dex_schema::register(dapps, ctx);
    let wrapper = merak::wrapper_schema::register(dapps, ctx);
    // Logic that needs to be automated once the contract is deployed
    // Share the dapp object with the public
    public_share_object(assets);
    public_share_object(dex);
    public_share_object(wrapper);
  }

  #[test_only]

  public fun deploy_hook_for_testing(): (Scenario, Dapps) {
    let mut scenario = test_scenario::begin(@0xA);
    {
          let ctx = test_scenario::ctx(&mut scenario);
          dapps_schema::init_dapps_for_testing(ctx);
          test_scenario::next_tx(&mut scenario,@0xA);
      };
    let mut dapps = test_scenario::take_shared<Dapps>(&scenario);
    let ctx = test_scenario::ctx(&mut scenario);
    let clock = clock::create_for_testing(ctx);
    run(&mut dapps, &clock, ctx);
    clock::destroy_for_testing(clock);
    test_scenario::next_tx(&mut scenario,@0xA);
    (scenario, dapps)
  }
}
