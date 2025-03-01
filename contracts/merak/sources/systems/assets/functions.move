module merak::assets_functions {
    use std::u256;
    use std::ascii::String;
    use merak::account_status;
    use merak::asset_status;
    use merak::asset_details;
    use merak::asset_metadata;
    use merak::account;
    use merak::schema::Schema;
    use merak::events::{asset_burned_event, asset_minted_event, asset_created_event, asset_transferred_event};
    use merak::errors::{
        account_blocked_error, overflows_error, 
        asset_already_destroyed_error, asset_not_found_error, 
        account_not_found_error, account_frozen_error, asset_not_live_error, balance_too_low_error
        };

    public(package) fun do_create(
        schema: &mut Schema,
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
    ): u128 {
        let asset_id = schema.next_asset_id()[];

        // set the assets details
        let asset_details = asset_details::new(
            owner,
            0,
            0,
            0,
            asset_status::new_live(),
            is_mintable,
            is_burnable,
            is_freezable
        );
        schema.asset_details().set(asset_id, asset_details);

        // set the metadata
        let asset_metadata = asset_metadata::new(name, symbol, description, decimals, url, info);
        schema.asset_metadata().set(asset_id, asset_metadata);

        // Increment the asset ID
        schema.next_asset_id().set(asset_id + 1);

        asset_created_event(asset_id, name, symbol, owner, is_mintable, is_burnable, is_freezable);

        asset_id
    }

    public fun ensure_can_increase(schema: &mut Schema, asset_id: u128, beneficiary: address, amount: u256) {
        asset_not_found_error(schema.asset_details().contains(asset_id));
        let details = schema.asset_details().get(asset_id);
        let supply = details.get_supply();
        let status = details.get_status();

        overflows_error(amount < u256::max_value!() - supply);
        asset_already_destroyed_error(status != asset_status::new_destroying());

        let maybe_account = schema.account().try_get(asset_id, beneficiary);
        if (maybe_account.is_some()) {
            let account = maybe_account.borrow();
            let (_, status) = account.get();
            account_blocked_error(status != account_status::new_blocked())
        };
    }

    public fun ensure_can_decrease(schema: &mut Schema, asset_id: u128, who: address, amount: u256) {
        asset_not_found_error(schema.asset_details().contains(asset_id));
        let details = schema.asset_details().get(asset_id);
        let supply = details.get_supply();
        let status = details.get_status();

        overflows_error(supply >= amount);
        asset_not_live_error(status == asset_status::new_live());

        account_not_found_error(schema.account().contains(asset_id, who));
        let (balance, status) = schema.account().get(asset_id, who).get();
        balance_too_low_error(balance >= amount);
        account_frozen_error(status != account_status::new_frozen());
        account_blocked_error(status != account_status::new_blocked());
    }

    public (package) fun increase_balance(schema: &mut Schema, asset_id: u128, beneficiary: address, amount: u256) {
        // Ensure that the asset can be increased
        ensure_can_increase(schema, asset_id, beneficiary, amount);

        let mut account = schema.account().try_get(asset_id, beneficiary);
        if(account.is_some()) {
            let (balance, status) = account.extract().get();
            schema.account().set(asset_id, beneficiary, account::new(balance + amount, status))
        } else {
            let mut asset_details = schema.asset_details()[asset_id];
            let accounts = asset_details.get_accounts();
            asset_details.set_accounts(accounts + 1);
            schema.asset_details().set(asset_id, asset_details);
            schema.account().set(asset_id, beneficiary, account::new(amount, account_status::new_liquid()));
        }
    }


    public(package) fun decrease_balance(schema: &mut Schema, asset_id: u128, who: address, amount: u256) {
        ensure_can_decrease(schema, asset_id, who, amount);

        let account = schema.account().get(asset_id, who);
        let balance = account.get_balance();
        let status = account.get_status();
        if (balance == amount) { 
            let mut asset_details = schema.asset_details()[asset_id];
            let accounts = asset_details.get_accounts();
            asset_details.set_accounts(accounts -  1);
            schema.asset_details().set(asset_id, asset_details);
            schema.account().remove(asset_id, who);
        } else {
            schema.account().set(asset_id, who, account::new(balance - amount, status));
        }
    }

    public(package) fun do_mint(schema: &mut Schema, asset_id: u128, to: address, amount: u256) {
        increase_balance(schema, asset_id, to, amount);

        let mut asset_details = schema.asset_details()[asset_id];
        let supply = asset_details.get_supply();
        asset_details.set_supply(supply + amount);
        schema.asset_details().set(asset_id, asset_details);

        asset_minted_event(asset_id, to, amount);
    }

    public(package) fun do_burn(schema: &mut Schema, asset_id: u128, from: address, amount: u256) {
        decrease_balance(schema, asset_id, from, amount);

        let mut asset_details = schema.asset_details()[asset_id];
        let supply = asset_details.get_supply();
        asset_details.set_supply(supply - amount);
        schema.asset_details().set(asset_id, asset_details);

        asset_burned_event(asset_id, from, amount);
    }

    public(package) fun do_transfer(schema: &mut Schema, asset_id: u128, from: address, to: address, amount: u256): u256 {
        if (from == to || amount == 0) {
            return amount
        };
        decrease_balance(schema, asset_id, from, amount);
        increase_balance(schema, asset_id, to, amount);
        asset_transferred_event(asset_id, from, to, amount);
        amount
    }

}