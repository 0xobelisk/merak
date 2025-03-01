#[allow(lint(share_owned))]module merak::genesis {

  use std::ascii::string;

  use sui::clock::Clock;

  use merak::dapp_system;

  public entry fun run(clock: &Clock, ctx: &mut TxContext) {
    // Create a dapp.
    let mut dapp = dapp_system::create(string(b"merak"),string(b"Merak Protocol"), clock , ctx);
    // Create schemas
    let mut schema = merak::schema::create(ctx);
    // Logic that needs to be automated once the contract is deployed
    merak::deploy_hook::run(&mut schema, ctx);
    // Authorize schemas and public share objects
    dapp.add_schema(schema);
    sui::transfer::public_share_object(dapp);
  }
}
