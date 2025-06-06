  // Copyright (c) Obelisk Labs, Inc.
  // SPDX-License-Identifier: Apache-2.0
  #[allow(unused_use)]
  
  /* Autogenerated file. Do not edit manually. */
  
  module merak::merak_asset_type {

  public enum AssetType has copy, drop , store {
                                LP,Private,Package,Wrapped
                        }

  public fun new_l_p(): AssetType {
    AssetType::LP
  }

  public fun new_private(): AssetType {
    AssetType::Private
  }

  public fun new_package(): AssetType {
    AssetType::Package
  }

  public fun new_wrapped(): AssetType {
    AssetType::Wrapped
  }
}
