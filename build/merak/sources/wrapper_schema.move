module merak::wrapper_schema {
    use std::type_name;
    use dubhe::dapps_schema::Dapps;
    use merak::dapp_key::DappKey;
    use dubhe::dapps_system;
    use sui::bag;
    use sui::bag::Bag;

    public struct Wrapper has key, store {
        id: UID,
        asset_ids: Bag,
        pools: Bag,
        coins: Bag,
    }

    public(package) fun borrow_mut_asset_ids(self: &mut Wrapper): &mut Bag {
        &mut self.asset_ids
    }

    public(package) fun borrow_mut_pools(self: &mut Wrapper): &mut Bag {
        &mut self.pools
    }

    public(package) fun borrow_mut_coins(self: &mut Wrapper): &mut Bag {
        &mut self.coins
    }

    public(package) fun borrow_asset_ids(self: &Wrapper): &Bag {
        &self.asset_ids
    }

    public(package) fun borrow_pools(self: &Wrapper): &Bag {
        &self.pools
    }

    public(package) fun borrow_coins(self: &Wrapper): &Bag {
        &self.coins
    }

    public fun register(dapps: &mut Dapps, ctx: &mut TxContext): Wrapper {
        let package_id = dapps_system::current_package_id<DappKey>();
        assert!(dapps.borrow_metadata().contains_key(package_id), 0);
        assert!(dapps.borrow_admin().get(package_id) == ctx.sender(), 0);
        let schema = type_name::get<Wrapper>().into_string();
        assert!(!dapps.borrow_schemas().get(package_id).contains(&schema), 0);
        dapps_system::add_schema<Wrapper>(dapps, package_id, ctx);
        Wrapper {
            id: object::new(ctx),
            asset_ids: bag::new(ctx),
            pools: bag::new(ctx),
            coins: bag::new(ctx),
        }
    }

}