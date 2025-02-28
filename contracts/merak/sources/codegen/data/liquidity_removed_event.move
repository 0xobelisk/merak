  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: Apache-2.0
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::liquidity_removed_event {

  use sui::event;

  use std::ascii::String;

  use merak::account_status::AccountStatus;

  use merak::asset_status::AssetStatus;

  use merak::account::Account;

  use merak::asset_metadata::AssetMetadata;

  use merak::asset_details::AssetDetails;

  use merak::pool::Pool;

  use merak::path_element::PathElement;

  public struct LiquidityRemovedEvent has copy, drop {
    who: address,
    asset1_id: u128,
    asset2_id: u128,
    asset1_amount: u256,
    asset2_amount: u256,
    lp_asset_id: u128,
    lp_asset_burned: u256,
  }

  public fun new(
    who: address,
    asset1_id: u128,
    asset2_id: u128,
    asset1_amount: u256,
    asset2_amount: u256,
    lp_asset_id: u128,
    lp_asset_burned: u256,
  ): LiquidityRemovedEvent {
    LiquidityRemovedEvent {
                                   who,asset1_id,asset2_id,asset1_amount,asset2_amount,lp_asset_id,lp_asset_burned
                               }
  }
}
