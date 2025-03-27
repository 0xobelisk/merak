  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: Apache-2.0
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::merak_dapp_schema {

  use merak::merak_dapp_metadata::DappMetadata;

  use dubhe::storage_value;

  use dubhe::storage_value::StorageValue;

  use dubhe::storage;

  use sui::transfer::public_share_object;

  use dubhe::type_info;

  public struct Dapp has key, store {
    id: UID,
  }

  public fun borrow_admin(self: &Dapp): &StorageValue<address> {
    storage::borrow_field(&self.id, b"admin")
  }

  public(package) fun admin(self: &mut Dapp): &mut StorageValue<address> {
    storage::borrow_mut_field(&mut self.id, b"admin")
  }

  public fun borrow_package_id(self: &Dapp): &StorageValue<address> {
    storage::borrow_field(&self.id, b"package_id")
  }

  public(package) fun package_id(self: &mut Dapp): &mut StorageValue<address> {
    storage::borrow_mut_field(&mut self.id, b"package_id")
  }

  public fun borrow_version(self: &Dapp): &StorageValue<u32> {
    storage::borrow_field(&self.id, b"version")
  }

  public(package) fun version(self: &mut Dapp): &mut StorageValue<u32> {
    storage::borrow_mut_field(&mut self.id, b"version")
  }

  public fun borrow_metadata(self: &Dapp): &StorageValue<DappMetadata> {
    storage::borrow_field(&self.id, b"metadata")
  }

  public(package) fun metadata(self: &mut Dapp): &mut StorageValue<DappMetadata> {
    storage::borrow_mut_field(&mut self.id, b"metadata")
  }

  public fun borrow_safe_mode(self: &Dapp): &StorageValue<bool> {
    storage::borrow_field(&self.id, b"safe_mode")
  }

  public(package) fun safe_mode(self: &mut Dapp): &mut StorageValue<bool> {
    storage::borrow_mut_field(&mut self.id, b"safe_mode")
  }

  public(package) fun borrow_schemas(self: &Dapp): &StorageValue<vector<address>> {
    storage::borrow_field(&self.id, b"schemas")
  }

  public(package) fun schemas(self: &mut Dapp): &mut StorageValue<vector<address>> {
    storage::borrow_mut_field(&mut self.id, b"schemas")
  }

  public(package) fun create(ctx: &mut TxContext): Dapp {
    let mut id = object::new(ctx);
    storage::add_field<StorageValue<address>>(&mut id, b"admin", storage_value::new(b"admin", ctx));
    storage::add_field<StorageValue<address>>(&mut id, b"package_id", storage_value::new(b"package_id", ctx));
    storage::add_field<StorageValue<u32>>(&mut id, b"version", storage_value::new(b"version", ctx));
    storage::add_field<StorageValue<DappMetadata>>(&mut id, b"metadata", storage_value::new(b"metadata", ctx));
    storage::add_field<StorageValue<bool>>(&mut id, b"safe_mode", storage_value::new(b"safe_mode", ctx));
    storage::add_field<StorageValue<vector<address>>>(&mut id, b"schemas", storage_value::new(b"schemas", ctx));
    Dapp { id }
  }

  public(package) fun upgrade<DappKey: drop>(dapp: &mut Dapp, ctx: &TxContext) {
    assert!(dapp.borrow_metadata().contains(), 0);
    assert!(dapp.borrow_admin().get() == ctx.sender(), 0);
    let new_package_id = type_info::current_package_id<DappKey>();
    dapp.package_id().set(new_package_id);
    let current_version = dapp.version()[];
    dapp.version().set(current_version + 1);
  }

  public(package) fun add_schema<Schema: key + store>(dapp: &mut Dapp, schema: Schema) {
    let mut schemas = dapp.schemas()[];
    schemas.push_back(object::id_address<Schema>(&schema));
    dapp.schemas().set(schemas);
    public_share_object(schema);
  }

  #[test_only]

  public fun create_dapp_for_testing(ctx: &mut TxContext): Dapp {
    create(ctx)
  }

  #[test_only]

  public fun distroy_dapp_for_testing(dapp: Dapp) {
    let Dapp { id } = dapp;
    id.delete();
  }
}
