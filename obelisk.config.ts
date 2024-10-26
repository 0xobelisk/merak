export const obeliskConfig = {
  name: "poils",
  description: "Poils Protocol",
  systems: ["assets", "dex", "wrapper"],
  schemas: {
    assets: {
      data: [
        {
            name: "AccountStatus",
            fields: [ "Liquid", "Frozen", "Blocked" ]
        },
        {
            name: "AssetsStatus",
            fields: [ "Live", "Frozen", "Destroying" ]
        },
        {
          name: "AssetsAccount",
          fields: { balance: "u64", status: "AssetsStatus" }
        },
      {
          name: "AssetsMetadata",
          fields: {
              // The user friendly name of this asset. Limited in length by `StringLimit`.
              name: "String",
              // The ticker symbol for this asset. Limited in length by `StringLimit`.
              symbol: "String",
              // A short description of this asset.
              description: "String",
              // The number of decimals this asset uses to represent one unit.
              decimals: "u8",
              // Asset icon url
              url: "String",
              // Extra information about this asset. Generally used for display purposes.
              info: "String"
          }
        },
       {
          name: "AssetsDetails",
          fields: {
              // Can change `owner`, `issuer`, `freezer` and `admin` accounts.
              owner: "address",
              // The total supply across all accounts.
              supply: "u64",
              // The total number of accounts.
              accounts: "u32",
              // The total number of approvals.
              approvals: "u32",
              // The status of the asset
              status: "AssetsStatus",
              // Whether the asset is mintable.
              is_mintable: "bool",
              // Whether the asset is burnable.
              is_burnable: "bool",
              // Whether the asset is freezable.
              is_freezable: "bool",
          }
        }
      ],
       structure: {
           next_asset_id: "StorageValue<u32>",
           metadata: "StorageMap<u32, AssetsMetadata>",
           details: "StorageMap<u32, AssetsDetails>",
           account: "StorageDoubleMap<u32, address, AssetsAccount>"
       }
    },
    dex: {
          data: [
              {
                  name: "DexPools",
                  fields: {
                      pool_address: "address",
                      lp_asset_id: "u32",
                  }
              }
          ],
          structure: {
              next_pool_id: "StorageValue<u32>",
              pool_id: "StorageDoubleMap<u32, u32, u32>",
              pools: "StorageMap<u32, DexPools>",
          }
      }
  },
};
