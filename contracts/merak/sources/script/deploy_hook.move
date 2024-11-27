#[allow(lint(share_owned))]

module merak::deploy_hook {

  use dubhe::dapps_schema::Dapps;

  use dubhe::dapps_system;

  use merak::schema_hub::SchemaHub;

  use std::ascii::string;
  use merak::wrapper_schema::Wrapper;

  use sui::clock::Clock;

  use sui::package::UpgradeCap;

  use sui::transfer::public_share_object;

  use merak::assets_schema::Assets;

  use merak::dex_schema::Dex;

  #[test_only]

  use sui::clock;

  #[test_only]

  use sui::test_scenario;

  #[test_only]

  use sui::package;

  #[test_only]

  use merak::schema_hub;

  #[test_only]

  use dubhe::dapps_schema;

  #[test_only]

  use sui::test_scenario::Scenario;

  public entry fun run(
    schema_hub: &mut SchemaHub,
    dapps: &mut Dapps,
    cap: &UpgradeCap,
    clock: &Clock,
    ctx: &mut TxContext,
  ) {
    // Register the dapp to dubhe.
    dapps_system::register(dapps,cap,string(b"merak"),string(b"Merak Protocol"),clock,ctx);
    // Create schemas
    let mut assets = merak::assets_schema::create(ctx);
    let mut dex = merak::dex_schema::create(ctx);
    let wrapper = merak::wrapper_schema::create(ctx);
    // Logic that needs to be automated once the contract is deployed

    assets.borrow_mut_next_asset_id().set(0);
    dex.borrow_mut_next_pool_id().set(0);
    // 0.03% swap fee
    dex.borrow_mut_swap_fee().set(3);
    // 0.01% lp fee
    dex.borrow_mut_lp_fee().set(1);
    dex.borrow_mut_fee_to().set(ctx.sender());
    dex.borrow_mut_max_swap_path_len().set(6);
    dex.borrow_mut_min_liquidity().set(100);


    // Authorize schemas and public share objects
    schema_hub.authorize_schema<Assets>();
    public_share_object(assets);
    schema_hub.authorize_schema<Dex>();
    public_share_object(dex);
    schema_hub.authorize_schema<Wrapper>();
    public_share_object(wrapper);
  }

  #[test_only]

  public fun deploy_hook_for_testing(): (Scenario, SchemaHub, Dapps) {
    let mut scenario = test_scenario::begin(@0xA);
    {
      let ctx = test_scenario::ctx(&mut scenario);
      dapps_schema::init_dapps_for_testing(ctx);
      schema_hub::init_schema_hub_for_testing(ctx);
      test_scenario::next_tx(&mut scenario,@0xA);
    };
    let mut dapps = test_scenario::take_shared<Dapps>(&scenario);
    let mut schema_hub = test_scenario::take_shared<SchemaHub>(&scenario);
    let ctx = test_scenario::ctx(&mut scenario);
    let clock = clock::create_for_testing(ctx);
    let upgrade_cap = package::test_publish(@0x42.to_id(), ctx);
    run(&mut schema_hub, &mut dapps, &upgrade_cap, &clock, ctx);
    clock::destroy_for_testing(clock);
    upgrade_cap.make_immutable();
    test_scenario::next_tx(&mut scenario,@0xA);
    (scenario, schema_hub, dapps)
  }
}
