module merak::assets_system {
    use std::ascii;
    use std::ascii::String;
    use merak::events::{
        asset_frozen_event, address_frozen_event, address_blocked_event, address_thawed_event, ownership_transferred_event, asset_thawed_event
    };
    use merak::errors::{
        asset_not_found_error, no_permission_error, not_mintable_error, not_burnable_error, asset_already_destroyed_error, account_not_found_error, asset_not_live_error, asset_not_frozen_error
    };
    use merak::schema::Schema;
    use merak::account_status;
    use merak::asset_status;
    use merak::assets_functions;

    public entry fun create(
        schema: &mut Schema,
        name: String,
        symbol: String,
        description: String,
        decimals: u8,
        icon_url: String,
        info: String,
        initial_supply: u256,
        send_to: address,
        owner: address,
        is_mintable: bool,
        is_burnable: bool,
        is_freezable: bool,
        _ctx: &mut TxContext
    ) {
        // TODO: Charge a fee for creating an asset
        // dapps_system::ensure_no_safe_mode<DappKey>(dapp);

        // Create a new asset
        let asset_id = assets_functions::do_create(schema, is_mintable, is_burnable, is_freezable, owner, name, symbol, description, decimals, icon_url, info);

        if (initial_supply > 0) {
            // Mint the initial supply
            assets_functions::do_mint(schema, asset_id, send_to, initial_supply);
        };
    }

    /// Mint `amount` of asset `id` to `who`.
    public entry fun mint(schema: &mut Schema, asset_id: u128, to: address, amount: u256, ctx: &mut TxContext) {
        let issuer = ctx.sender();
        asset_not_found_error(schema.asset_details().contains(asset_id));
        let assets_details = schema.asset_details().get(asset_id);
        no_permission_error(assets_details.get_owner() == issuer);
        not_mintable_error(assets_details.get_is_mintable());

        assets_functions::do_mint(schema, asset_id, to, amount);
    }

    /// Reduce the balance of `who` by as much as possible up to `amount` assets of `id`.
    public entry fun burn(schema: &mut Schema, asset_id: u128, who: address, amount: u256, ctx: &mut TxContext) {
        let burner = ctx.sender();
        asset_not_found_error(schema.asset_details().contains(asset_id));
        let assets_details = schema.asset_details().get(asset_id);
        no_permission_error(assets_details.get_owner() == burner);
        not_burnable_error(assets_details.get_is_burnable());

        assets_functions::do_burn(schema, asset_id, who, amount);
    }

    /// Move some assets from the sender account to another.
    public entry fun transfer(schema: &mut Schema, asset_id: u128, to: address, amount: u256, ctx: &mut TxContext) {
        let from = ctx.sender();
        assets_functions::do_transfer(schema, asset_id, from, to, amount);
    }

    /// Transfer the entire transferable balance from the caller asset account.
    public entry fun transfer_all(schema: &mut Schema, asset_id: u128, to: address, ctx: &mut TxContext) {
        let from = ctx.sender();
        let balance = balance_of(schema, asset_id, from);

        assets_functions::do_transfer(schema, asset_id, from, to, balance);
    }

    /// Disallow further unprivileged transfers of an asset `id` from an account `who`.
    /// `who` must already exist as an entry in `Account`s of the asset.
    public entry fun freeze_address(schema: &mut Schema, asset_id: u128, who: address, ctx: &mut TxContext) {
        let freezer = ctx.sender();

        asset_not_found_error(schema.asset_details().contains(asset_id));
        let assets_details = schema.asset_details().get(asset_id);

        asset_already_destroyed_error(assets_details.get_status() != asset_status::new_destroying());
        no_permission_error(assets_details.get_owner() == freezer);
        account_not_found_error(schema.account().contains(asset_id, who));

        let mut account = schema.account()[asset_id, who];
        account.set_status(account_status::new_frozen());
        schema.account().set(asset_id, who, account);
        address_frozen_event(asset_id, who);
    }

    /// Disallow further unprivileged transfers of an asset `id` to and from an account `who`.
    public entry fun block_address(schema: &mut Schema, asset_id: u128, who: address, ctx: &mut TxContext) {
        let blocker = ctx.sender();

        asset_not_found_error(schema.asset_details().contains(asset_id));
        let assets_details = schema.asset_details().get(asset_id);
        no_permission_error(assets_details.get_owner() == blocker);
        account_not_found_error(schema.account().contains(asset_id, who));

        let mut account = schema.account()[asset_id, who];
        account.set_status(account_status::new_blocked());
        schema.account().set(asset_id, who, account);
        address_blocked_event(asset_id, who);
    }

    /// Allow unprivileged transfers to and from an account again.
    public entry fun thaw_address(schema: &mut Schema, asset_id: u128, who: address, ctx: &mut TxContext) {
        let unfreezer = ctx.sender();

        asset_not_found_error(schema.asset_details().contains(asset_id));
        let assets_details = schema.asset_details().get(asset_id);
        asset_already_destroyed_error(assets_details.get_status() != asset_status::new_destroying());
        no_permission_error(assets_details.get_owner() == unfreezer);
        account_not_found_error(schema.account().contains(asset_id, who));

        let mut account = schema.account()[asset_id, who];
        account.set_status(account_status::new_liquid());
        schema.account().set(asset_id, who, account);
        address_thawed_event(asset_id, who);
    }

    /// Disallow further unprivileged transfers for the asset class.
    public entry fun freeze_asset(schema: &mut Schema, asset_id: u128, ctx: &mut TxContext) {
        let freezer = ctx.sender();

        asset_not_found_error(schema.asset_details().contains(asset_id));
        let mut asset_details = schema.asset_details()[asset_id];
        asset_not_live_error(asset_details.get_status() == asset_status::new_live());
        no_permission_error(asset_details.get_owner() == freezer);

        asset_details.set_status(asset_status::new_frozen());
        schema.asset_details().set(asset_id, asset_details);
        asset_frozen_event(asset_id);
    }

    /// Allow unprivileged transfers for the asset again.
    public entry fun thaw_asset(schema: &mut Schema, asset_id: u128, ctx: &mut TxContext) {
        let unfreezer = ctx.sender();

         asset_not_found_error(schema.asset_details().contains(asset_id));
        let mut asset_details = schema.asset_details()[asset_id];
        asset_not_frozen_error(asset_details.get_status() == asset_status::new_frozen());
        no_permission_error(asset_details.get_owner() == unfreezer);
        
        asset_details.set_status(asset_status::new_live());
        schema.asset_details().set(asset_id, asset_details);
        asset_thawed_event(asset_id);
    }

    /// Change the Owner of an asset.
    public entry fun transfer_ownership(schema: &mut Schema, asset_id: u128, to: address, ctx: &mut TxContext) {
        let owner = ctx.sender();

        asset_not_found_error(schema.asset_details().contains(asset_id));
        let mut asset_details = schema.asset_details()[asset_id];
        no_permission_error(asset_details.get_owner() == owner);

        asset_details.set_owner(to);
        schema.asset_details().set(asset_id, asset_details);
        ownership_transferred_event(asset_id, owner, to);
    }

    public fun balance_of(schema: &mut Schema, asset_id: u128, who: address): u256 {
        let maybe_account = schema.account().try_get(asset_id, who);
        if (maybe_account.is_none()) {
            return 0
        };
        let account = maybe_account.borrow();
        account.get_balance()
    }

    public fun supply_of(schema: &mut Schema, asset_id: u128): u256 {
        let maybe_assets_details = schema.asset_details().try_get(asset_id);
        if (maybe_assets_details.is_none()) {
            return 0
        };
        let asset_details = maybe_assets_details.borrow();
        asset_details.get_supply()
    }

    public fun metadata_of(schema: &mut Schema, asset_id: u128): (String, String, String, u8, String) {
        let maybe_metadata = schema.asset_metadata().try_get(asset_id);
        if (maybe_metadata.is_none()) {
            return (ascii::string(b""), ascii::string(b""), ascii::string(b""), 0, ascii::string(b""))
        };
        let metadata = maybe_metadata.borrow();
        let (name, symbol, description, decimals, url, _) = metadata.get();
        (name, symbol, description, decimals, url)
    }
}