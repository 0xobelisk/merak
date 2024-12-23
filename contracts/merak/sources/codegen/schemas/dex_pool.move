  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: MIT
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::dex_pool {

  use std::ascii::String;

  public struct Pool has copy, drop, store {
    pool_id: u32,
    pool_address: address,
    lp_asset_id: u32,
    asset1_id: u32,
    asset2_id: u32,
  }

  public fun new(pool_id: u32, pool_address: address, lp_asset_id: u32, asset1_id: u32, asset2_id: u32): Pool {
    Pool {
                                   pool_id,pool_address,lp_asset_id,asset1_id,asset2_id
                               }
  }

  public fun get(self: &Pool): (u32,address,u32,u32,u32) {
    (self.pool_id,self.pool_address,self.lp_asset_id,self.asset1_id,self.asset2_id)
  }

  public fun get_pool_id(self: &Pool): u32 {
    self.pool_id
  }

  public fun get_pool_address(self: &Pool): address {
    self.pool_address
  }

  public fun get_lp_asset_id(self: &Pool): u32 {
    self.lp_asset_id
  }

  public fun get_asset1_id(self: &Pool): u32 {
    self.asset1_id
  }

  public fun get_asset2_id(self: &Pool): u32 {
    self.asset2_id
  }

  public(package) fun set_pool_id(self: &mut Pool, pool_id: u32) {
    self.pool_id = pool_id;
  }

  public(package) fun set_pool_address(self: &mut Pool, pool_address: address) {
    self.pool_address = pool_address;
  }

  public(package) fun set_lp_asset_id(self: &mut Pool, lp_asset_id: u32) {
    self.lp_asset_id = lp_asset_id;
  }

  public(package) fun set_asset1_id(self: &mut Pool, asset1_id: u32) {
    self.asset1_id = asset1_id;
  }

  public(package) fun set_asset2_id(self: &mut Pool, asset2_id: u32) {
    self.asset2_id = asset2_id;
  }

  public(package) fun set(
    self: &mut Pool,
    pool_id: u32,
    pool_address: address,
    lp_asset_id: u32,
    asset1_id: u32,
    asset2_id: u32,
  ) {
    self.pool_id = pool_id;
    self.pool_address = pool_address;
    self.lp_asset_id = lp_asset_id;
    self.asset1_id = asset1_id;
    self.asset2_id = asset2_id;
  }
}
