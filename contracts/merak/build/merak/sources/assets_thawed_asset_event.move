  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: MIT
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::assets_thawed_asset_event {

  use sui::event;

  use std::ascii::String;

  public struct ThawedAssetEvent has copy, drop {
    asset_id: u32,
  }

  public fun new(asset_id: u32): ThawedAssetEvent {
    ThawedAssetEvent {
                                   asset_id
                               }
  }

  public fun emit(asset_id: u32) {
    event::emit(ThawedAssetEvent {
                                   asset_id
                               });
  }
}
