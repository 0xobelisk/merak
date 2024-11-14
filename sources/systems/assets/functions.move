module merak::assets_functions {
    use std::u256;
    use std::ascii::String;
    use merak::assets_transferred_event;
    use merak::assets_account_status;
    use merak::assets_status;
    use merak::assets_details;
    use merak::assets_metadata;
    use merak::assets_schema::Assets;
    use merak::assets_account;
    use merak::assets_burned_event;
    use merak::assets_minted_event;
    use merak::assets_created_event;

    public(package) fun do_create(
        assets: &mut Assets,
        is_mintable: bool,
        is_burnable: bool,
        is_freezable: bool,
        owner: address,
        name: String,
        symbol: String,
        description: String,
        decimals: u8,
        url: String,
        info: String,

    ): u32 {
        let asset_id = assets.borrow_next_asset_id().get();

        // set the assets details
        let assets_details = assets_details::new(
            owner,
            0,
            0,
            0,
            assets_status::new_live(),
            is_mintable,
            is_burnable,
            is_freezable
        );
        assets.borrow_mut_details().insert(asset_id, assets_details);

        // set the metadata
        let assets_metadata = assets_metadata::new(name, symbol, description, decimals, url, info);
        assets.borrow_mut_metadata().insert(asset_id, assets_metadata);

        // Increment the asset ID
        assets.borrow_mut_next_asset_id().set(asset_id + 1);

        assets_created_event::emit(asset_id, name, symbol, owner, is_mintable, is_burnable, is_freezable);

        asset_id
    }

    public(package) fun can_increase(asset_id: u32, beneficiary: address, amount: u256, assets: &Assets) {
        assert!(assets.borrow_details().contains_key(asset_id), 0);
        let details = assets.borrow_details().get(asset_id);
        let (_, supply,_,_, status,_, _,_) = details.get();

        assert!(amount < u256::max_value!() - supply, 2);
        assert!(status != assets_status::new_destroying(), 3);

        let maybe_account = assets.borrow_account().try_get(asset_id, beneficiary);
        if (maybe_account.is_some()) {
            let account = maybe_account.borrow();
            let (_, status) = account.get();
            assert!(status != assets_account_status::new_blocked(), 4);
        };
    }

    public fun can_decrease(asset_id: u32, who: address, amount: u256, assets: &Assets) {
        assert!(assets.borrow_details().contains_key(asset_id), 0);
        let details = assets.borrow_details().get(asset_id);
        let (_, supply,_,_, status,_, _,_) = details.get();

        assert!(supply >= amount, 2);
        assert!(status == assets_status::new_live(), 5);

        assert!(assets.borrow_account().contains_key(asset_id, who), 6);
        let account = assets.borrow_account().get(asset_id, who);
        let (balance, status) = account.get();
        assert!(balance >= amount, 4);
        assert!(status != assets_account_status::new_frozen(), 5);
        assert!(status != assets_account_status::new_blocked(), 5);
    }

    public (package) fun increase_balance(asset_id: u32, beneficiary: address, amount: u256, assets: &mut Assets) {
        // Ensure that the asset can be increased
        can_increase(asset_id, beneficiary, amount, assets);

        if (assets.borrow_account().contains_key(asset_id, beneficiary)) {
            // Increase the balance
            assets.borrow_mut_account().mutate!(asset_id, beneficiary, |account| {
                let balance = account.get_balance();
                account.set_balance(balance + amount);
            });
        } else {
            // If the account does not exist, increment the number of accounts
            assets.borrow_mut_details().mutate!(asset_id, |assets_details| {
                let accounts = assets_details.get_accounts() + 1;
                assets_details.set_accounts(accounts);
            });

            let account = assets_account::new(amount, assets_account_status::new_liquid());
            assets.borrow_mut_account().set(asset_id, beneficiary, account);
        };
    }


    public(package) fun decrease_balance(asset_id: u32, who: address, amount: u256, assets: &mut Assets) {
        can_decrease(asset_id, who, amount, assets);

        assets.borrow_mut_account().mutate!(asset_id, who, |account| {
            let balance = account.get_balance();

            // Decrease the balance
            if (balance == amount) {
                assets.borrow_mut_details().mutate!(asset_id, |assets_details| {
                    let accounts = assets_details.get_accounts() - 1;
                    assets_details.set_accounts(accounts);
                });
                assets.borrow_mut_account().remove(asset_id, who);
            } else {
                account.set_balance(balance - amount);
            };
        });
    }

    public(package) fun do_mint(asset_id: u32, to: address, amount: u256, assets: &mut Assets) {
        increase_balance(asset_id, to, amount, assets);

        assets.borrow_mut_details().mutate!(asset_id, |assets_details| {
            let supply = assets_details.get_supply() + amount;
            assets_details.set_supply(supply);
        });
        assets_minted_event::emit(asset_id, to, amount);
    }

    public(package) fun do_burn(asset_id: u32, from: address, amount: u256, assets: &mut Assets) {
        decrease_balance(asset_id, from, amount, assets);

        assets.borrow_mut_details().mutate!(asset_id, |assets_details| {
            let supply = assets_details.get_supply() - amount;
            assets_details.set_supply(supply);
        });
        assets_burned_event::emit(asset_id, from, amount);
    }

    public(package) fun do_transfer(asset_id: u32, from: address, to: address, amount: u256, assets: &mut Assets): u256 {
        if (from == to || amount == 0) {
            return amount
        };
        decrease_balance(asset_id, from, amount, assets);
        increase_balance(asset_id, to, amount, assets);
        assets_transferred_event::emit(asset_id, from, to, amount);
        amount
    }

    public fun balance_of(assets: &Assets, asset_id: u32, who: address): u256 {
        let maybe_account = assets.borrow_account().try_get(asset_id, who);
        if (maybe_account.is_none()) {
            return 0
        };
        let account = maybe_account.borrow();
        account.get_balance()
    }

    public fun supply_of(assets: &Assets, asset_id: u32): u256 {
        let maybe_assets_details = assets.borrow_details().try_get(asset_id);
        if (maybe_assets_details.is_none()) {
            return 0
        };
        let assets_details = maybe_assets_details.borrow();
        assets_details.get_supply()
    }

}