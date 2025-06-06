  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: Apache-2.0
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::merak_events {

  use std::ascii::{String, string};

  use merak::merak_account_status::AccountStatus;

  use merak::merak_asset_status::AssetStatus;

  use merak::merak_asset_type::AssetType;

  use merak::merak_account::Account;

  use merak::merak_asset_metadata::AssetMetadata;

  use merak::merak_pool::Pool;

  use merak::merak_path_element::PathElement;

  use merak::merak_bridge_config::BridgeConfig;

  use merak::merak_asset_created_event::AssetCreatedEvent;

  use merak::merak_asset_created_event;

  public fun asset_created_event(
    asset_id: u256,
    name: String,
    symbol: String,
    owner: address,
    is_mintable: bool,
    is_burnable: bool,
    is_freezable: bool,
  ) {
    dubhe::storage_event::emit_set_record<AssetCreatedEvent, AssetCreatedEvent, AssetCreatedEvent>(
				string(b"asset_created_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_asset_created_event::new(asset_id,name,symbol,owner,is_mintable,is_burnable,is_freezable))
			  )
  }

  use merak::merak_asset_transferred_event::AssetTransferredEvent;

  use merak::merak_asset_transferred_event;

  public fun asset_transferred_event(asset_id: u256, from: address, to: address, amount: u256) {
    dubhe::storage_event::emit_set_record<AssetTransferredEvent, AssetTransferredEvent, AssetTransferredEvent>(
				string(b"asset_transferred_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_asset_transferred_event::new(asset_id,from,to,amount))
			  )
  }

  use merak::merak_ownership_transferred_event::OwnershipTransferredEvent;

  use merak::merak_ownership_transferred_event;

  public fun ownership_transferred_event(asset_id: u256, from: address, to: address) {
    dubhe::storage_event::emit_set_record<OwnershipTransferredEvent, OwnershipTransferredEvent, OwnershipTransferredEvent>(
				string(b"ownership_transferred_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_ownership_transferred_event::new(asset_id,from,to))
			  )
  }

  use merak::merak_pool_created_event::PoolCreatedEvent;

  use merak::merak_pool_created_event;

  public fun pool_created_event(
    creator: address,
    asset1_id: u256,
    asset2_id: u256,
    pool_address: address,
    lp_asset_id: u256,
    lp_asset_symbol: String,
  ) {
    dubhe::storage_event::emit_set_record<PoolCreatedEvent, PoolCreatedEvent, PoolCreatedEvent>(
				string(b"pool_created_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_pool_created_event::new(creator,asset1_id,asset2_id,pool_address,lp_asset_id,lp_asset_symbol))
			  )
  }

  use merak::merak_liquidity_added_event::LiquidityAddedEvent;

  use merak::merak_liquidity_added_event;

  public fun liquidity_added_event(
    who: address,
    asset1_id: u256,
    asset2_id: u256,
    asset1_amount: u256,
    asset2_amount: u256,
    lp_asset_id: u256,
    lp_asset_minted: u256,
  ) {
    dubhe::storage_event::emit_set_record<LiquidityAddedEvent, LiquidityAddedEvent, LiquidityAddedEvent>(
				string(b"liquidity_added_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_liquidity_added_event::new(who,asset1_id,asset2_id,asset1_amount,asset2_amount,lp_asset_id,lp_asset_minted))
			  )
  }

  use merak::merak_liquidity_removed_event::LiquidityRemovedEvent;

  use merak::merak_liquidity_removed_event;

  public fun liquidity_removed_event(
    who: address,
    asset1_id: u256,
    asset2_id: u256,
    asset1_amount: u256,
    asset2_amount: u256,
    lp_asset_id: u256,
    lp_asset_burned: u256,
  ) {
    dubhe::storage_event::emit_set_record<LiquidityRemovedEvent, LiquidityRemovedEvent, LiquidityRemovedEvent>(
				string(b"liquidity_removed_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_liquidity_removed_event::new(who,asset1_id,asset2_id,asset1_amount,asset2_amount,lp_asset_id,lp_asset_burned))
			  )
  }

  use merak::merak_swap_executed_event::SwapExecutedEvent;

  use merak::merak_swap_executed_event;

  public fun swap_executed_event(
    who: address,
    send_to: address,
    amount_in: u256,
    amount_out: u256,
    path: vector<u256>,
  ) {
    dubhe::storage_event::emit_set_record<SwapExecutedEvent, SwapExecutedEvent, SwapExecutedEvent>(
				string(b"swap_executed_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_swap_executed_event::new(who,send_to,amount_in,amount_out,path))
			  )
  }

  use merak::merak_asset_wrapped_event::AssetWrappedEvent;

  use merak::merak_asset_wrapped_event;

  public fun asset_wrapped_event(from: address, asset_id: u256, amount: u256, beneficiary: address) {
    dubhe::storage_event::emit_set_record<AssetWrappedEvent, AssetWrappedEvent, AssetWrappedEvent>(
				string(b"asset_wrapped_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_asset_wrapped_event::new(from,asset_id,amount,beneficiary))
			  )
  }

  use merak::merak_asset_unwrapped_event::AssetUnwrappedEvent;

  use merak::merak_asset_unwrapped_event;

  public fun asset_unwrapped_event(from: address, asset_id: u256, amount: u256, beneficiary: address) {
    dubhe::storage_event::emit_set_record<AssetUnwrappedEvent, AssetUnwrappedEvent, AssetUnwrappedEvent>(
				string(b"asset_unwrapped_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_asset_unwrapped_event::new(from,asset_id,amount,beneficiary))
			  )
  }

  use merak::merak_bridge_withdraw_event::BridgeWithdrawEvent;

  use merak::merak_bridge_withdraw_event;

  public fun bridge_withdraw_event(
    asset_id: u256,
    from: address,
    to: address,
    to_chain: String,
    amount: u256,
    fee: u256,
  ) {
    dubhe::storage_event::emit_set_record<BridgeWithdrawEvent, BridgeWithdrawEvent, BridgeWithdrawEvent>(
				string(b"bridge_withdraw_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_bridge_withdraw_event::new(asset_id,from,to,to_chain,amount,fee))
			  )
  }

  use merak::merak_bridge_deposit_event::BridgeDepositEvent;

  use merak::merak_bridge_deposit_event;

  public fun bridge_deposit_event(asset_id: u256, from: address, to: address, from_chain: String, amount: u256) {
    dubhe::storage_event::emit_set_record<BridgeDepositEvent, BridgeDepositEvent, BridgeDepositEvent>(
				string(b"bridge_deposit_event"),
				option::none(),
			  	option::none(),
			  option::some(merak_bridge_deposit_event::new(asset_id,from,to,from_chain,amount))
			  )
  }
}
