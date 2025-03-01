import { DubheConfig } from '@0xobelisk/sui-common';

export const dubheConfig = {
    name: 'merak',
    description: 'Merak Protocol',
    data: {
        AccountStatus: ['Liquid', 'Frozen', 'Blocked'],
        AssetStatus: ['Live', 'Frozen', 'Destroying'],
        Account: { balance: 'u256', status: 'AccountStatus' },
        AssetMetadata: {
            // The user friendly name of this asset. Limited in length by `StringLimit`.
            name: 'String',
            // The ticker symbol for this asset. Limited in length by `StringLimit`.
            symbol: 'String',
            // A short description of this asset.
            description: 'String',
            // The number of decimals this asset uses to represent one unit.
            decimals: 'u8',
            // Asset icon url
            url: 'String',
            // Extra information about this asset. Generally used for display purposes.
            info: 'String',
        },
        AssetDetails: {
            // Can change `owner`, `issuer`, `freezer` and `admin` accounts.
            owner: 'address',
            // The total supply across all accounts.
            supply: 'u256',
            // The total number of accounts.
            accounts: 'u128',
            // The total number of approvals.
            approvals: 'u128',
            // The status of the asset
            status: 'AssetStatus',
            // Whether the asset is mintable.
            is_mintable: 'bool',
            // Whether the asset is burnable.
            is_burnable: 'bool',
            // Whether the asset is freezable.
            is_freezable: 'bool',
        },
        Pool: {
            pool_address: 'address',
            lp_asset_id: 'u128',
        },
        PathElement: {
            asset_id: 'u128',
            balance: 'u256',
        },
    },
    schemas: {
        next_asset_id: 'StorageValue<u128>',
        asset_metadata: 'StorageMap<u128, AssetMetadata>',
        asset_details: 'StorageMap<u128, AssetDetails>',
        account: 'StorageDoubleMap<u128, address, Account>',
        swap_fee: 'StorageValue<u256>',
        lp_fee: 'StorageValue<u256>',
        fee_to: 'StorageValue<address>',
        max_swap_path_len: 'StorageValue<u64>',
        min_liquidity: 'StorageValue<u256>',
        pools: 'StorageDoubleMap<u128, u128, Pool>',
    },
    errors: {
        AssetNotFound: "Asset not found",
        AssetAlreadyDestroyed: "Asset already destroyed",
        AssetNotLive: "Asset not live",
        AssetNotFrozen: "Asset not frozen",
        AccountNotFound: "Account not found",
        AccountBlocked: "Account is blocked",
        AccountFrozen: "Account is frozen",
        BalanceTooLow: "Balance too low",
        Overflows: "Operation overflows",
        NoPermission: "No permission",
        NotMintable: "Asset is not mintable",
        NotBurnable: "Asset is not burnable",
        NotFreezable: "Asset is not freezable",
        PoolAlreadyExists: "Pool already exists",
        BelowMinAmount: "Amount is below minimum",
        BelowMinLiquidity: "Amount is below Liquidity",
        PoolNotFound: 'Pool not found'  ,
        MoreThanMaxSwapPathLen: 'More than Max',
        SwapPathTooSmall: 'Swap path too small',
        ReservesCannotBeZero: 'Reserve cannot be 0',
        AmountCannotBeZero: 'Amount cannot be 0',
        LessThanAmountOutMin: 'Less than expected',
        MoreThanAmountInMax: 'More than expected'
    },
    events: {
     AssetCreated: {
        asset_id: 'u128',
        name: 'String',
        symbol: 'String',
        owner: 'address',
        is_mintable: 'bool',
        is_burnable: 'bool',
        is_freezable: 'bool',
     },
      AssetMinted: {
        asset_id: 'u128',
        to: 'address',
        amount: 'u256',
      },
     AssetBurned: {
        asset_id: 'u128',
        from: 'address',
        amount: 'u256',
     },
    AssetTransferred: {
        asset_id: 'u128',
        from: 'address',
        to: 'address',
        amount: 'u256',
    },
    AddressFrozen: {
        asset_id: 'u128',
        owner: 'address',
    },
    AddressBlocked: {
        asset_id: 'u128',
        owner: 'address',
    },
    AddressThawed: {
        asset_id: 'u128',
        owner: 'address',
    },
    AssetFrozen: {
        asset_id: 'u128',
    },
    AssetThawed: {
        asset_id: 'u128',
    },
    OwnershipTransferred: {
        asset_id: 'u128',
        from: 'address',
        to: 'address',
    },
    PoolCreated: {
        creator: 'address',
        asset1_id: 'u128',
        asset2_id: 'u128',
        pool_address: 'address',
        lp_asset_id: 'u128',
        lp_asset_symbol: 'String',
    },
    LiquidityAdded: {
        who: 'address', 
        asset1_id: 'u128',
        asset2_id: 'u128',       
        asset1_amount: 'u256',
        asset2_amount: 'u256',
        lp_asset_id: 'u128',
        lp_asset_minted: 'u256',
    },
    LiquidityRemoved: {
        who: 'address',
        asset1_id: 'u128',
        asset2_id: 'u128', 
        asset1_amount: 'u256',
        asset2_amount: 'u256',
        lp_asset_id: 'u128',
        lp_asset_burned: 'u256',
    },
    SwapExecuted: {
        who: 'address',
        send_to: 'address',
        amount_in: 'u256',
        amount_out: 'u256',
        path: 'vector<u128>',
    },
    AssetRegistered: {
        who: 'address',
        asset_id: 'u128',
    },
   AssetWrapped: {
        from: 'address',
        asset_id: 'u128',
        amount: 'u256',
        beneficiary: 'address',
    },
   AssetUnwrapped: {
        from: 'address',
        asset_id: 'u128',
        amount: 'u256',
        beneficiary: 'address',
    },
  },
} as DubheConfig;
