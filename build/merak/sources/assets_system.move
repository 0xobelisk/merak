module merak::assets_system {
    use std::ascii;
    use std::ascii::String;
    use merak::assets_frozen_address_event;
    use merak::assets_frozen_asset_event;
    use merak::assets_blocked_address_event;
    use merak::assets_thawed_address_event;
    use merak::assets_thawed_asset_event;
    use merak::assets_ownership_transferred_event;
    use merak::assets_schema::Assets;
    use merak::assets_account_status;
    use merak::assets_status;
    use merak::assets_functions;

    public entry fun create(
        assets: &mut Assets,
        name: String,
        symbol: String,
        description: String,
        decimals: u8,
        icon_url: String,
        info: String,
        initial_supply: u64,
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
        let asset_id = assets_functions::do_create(assets, is_mintable, is_burnable, is_freezable, owner, name, symbol, description, decimals, icon_url, info);

        if (initial_supply > 0) {
            // Mint the initial supply
            assets_functions::do_mint(asset_id, send_to, initial_supply, assets);
        };
    }

    /// Mint `amount` of asset `id` to `who`.
    public entry fun mint(assets: &mut Assets, asset_id: u32, to: address, amount: u64, ctx: &mut TxContext) {
        let issuer = ctx.sender();
        let assets_details = assets.borrow_mut_details().get(asset_id);
        assert!(assets_details.get_owner() == issuer, 5);
        assert!(assets_details.get_is_mintable(), 6);

        assets_functions::do_mint(asset_id, to, amount, assets);
    }

    /// Reduce the balance of `who` by as much as possible up to `amount` assets of `id`.
    public entry fun burn(assets: &mut Assets, asset_id: u32, who: address, amount: u64, ctx: &mut TxContext) {
        let burner = ctx.sender();
        let assets_details = assets.borrow_mut_details().get(asset_id);
        assert!(assets_details.get_owner() == burner, 5);
        assert!(assets_details.get_is_burnable(), 6);

        assets_functions::do_burn(asset_id, who, amount, assets);
    }

    /// Move some assets from the sender account to another.
    public entry fun transfer(assets: &mut Assets, asset_id: u32, to: address, amount: u64, ctx: &mut TxContext) {
        let from = ctx.sender();
        assets_functions::do_transfer(asset_id, from, to, amount, assets);
    }

    /// Transfer the entire transferable balance from the caller asset account.
    public entry fun transfer_all(assets: &mut Assets, asset_id: u32, to: address, ctx: &mut TxContext) {
        let from = ctx.sender();
        let balance = balance_of(assets, asset_id, from);

        assets_functions::do_transfer(asset_id, from, to, balance, assets);
    }

    /// Disallow further unprivileged transfers of an asset `id` from an account `who`.
    /// `who` must already exist as an entry in `Account`s of the asset.
    public entry fun freeze_address(assets: &mut Assets, asset_id: u32, who: address, ctx: &mut TxContext) {
        let freezer = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().get(asset_id);
        assert!(assets_details.get_status() != assets_status::new_destroying(), 5);
        assert!(assets_details.get_owner() == freezer, 6);

        assert!(assets.borrow_mut_account().contains_key(asset_id, who), 5);
        let account = assets.borrow_mut_account().borrow_mut(asset_id, who);
        account.set_status(assets_account_status::new_frozen());
        assets_frozen_address_event::emit(asset_id, who);
    }

    /// Disallow further unprivileged transfers of an asset `id` to and from an account `who`.
    public entry fun block_address(assets: &mut Assets, asset_id: u32, who: address, ctx: &mut TxContext) {
        let blocker = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().get(asset_id);
        assert!(assets_details.get_owner() == blocker, 6);

        assert!(assets.borrow_mut_account().contains_key(asset_id, who), 5);
        let account = assets.borrow_mut_account().borrow_mut(asset_id, who);
        account.set_status(assets_account_status::new_blocked());
        assets_blocked_address_event::emit(asset_id, who);
    }

    /// Allow unprivileged transfers to and from an account again.
    public entry fun thaw_address(assets: &mut Assets, asset_id: u32, who: address, ctx: &mut TxContext) {
        let unfreezer = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().get(asset_id);
        assert!(assets_details.get_status() != assets_status::new_destroying(), 5);
        assert!(assets_details.get_owner() == unfreezer, 6);

        assert!(assets.borrow_mut_account().contains_key(asset_id, who), 5);
        let account = assets.borrow_mut_account().borrow_mut(asset_id, who);
        account.set_status(assets_account_status::new_liquid());
        assets_thawed_address_event::emit(asset_id, who);
    }

    /// Disallow further unprivileged transfers for the asset class.
    public entry fun freeze_asset(assets: &mut Assets, asset_id: u32, ctx: &mut TxContext) {
        let freezer = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().borrow_mut(asset_id);
        assert!(assets_details.get_status() == assets_status::new_live(), 5);
        assert!(assets_details.get_owner() == freezer, 6);

        assets_details.set_status(assets_status::new_frozen());
        assets_frozen_asset_event::emit(asset_id);
    }

    /// Allow unprivileged transfers for the asset again.
    public entry fun thaw_asset(assets: &mut Assets, asset_id: u32, ctx: &mut TxContext) {
        let unfreezer = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().borrow_mut(asset_id);
        assert!(assets_details.get_status() == assets_status::new_frozen(), 5);
        assert!(assets_details.get_owner() == unfreezer, 6);

        assets_details.set_status(assets_status::new_live());
        assets_thawed_asset_event::emit(asset_id);
    }

    /// Change the Owner of an asset.
    public entry fun transfer_ownership(assets: &mut Assets, asset_id: u32, to: address, ctx: &mut TxContext) {
        let owner = ctx.sender();

        assert!(assets.borrow_mut_details().contains_key(asset_id), 5);
        let assets_details = assets.borrow_mut_details().borrow_mut(asset_id);
        assert!(assets_details.get_owner() == owner, 6);

        assets_details.set_owner(to);
        assets_ownership_transferred_event::emit(asset_id, owner, to);
    }

    public fun balance_of(assets: &Assets, asset_id: u32, who: address): u64 {
        assets_functions::balance_of(assets, asset_id, who)
    }

    public fun supply_of(assets: &Assets, asset_id: u32): u64 {
        assets_functions::supply_of(assets, asset_id)
    }

    public fun metadata_of(assets: &Assets, asset_id: u32): (String, String, String, u8, String) {
        let maybe_metadata = assets.borrow_metadata().try_get(asset_id);
        if (maybe_metadata.is_none()) {
            return (ascii::string(b""), ascii::string(b""), ascii::string(b""), 0, ascii::string(b""))
        };
        let metadata = maybe_metadata.borrow();
        let (name, symbol, description, decimals, url, _) = metadata.get();
        (name, symbol, description, decimals, url)
    }

    public fun owned_assets(assets: &Assets, owner: address): vector<u32> {
        let mut owned_assets = vector[];
        let asset_ids = assets.borrow_details().keys();

        let mut i = 0;
        while (i  < (asset_ids.length() as u32)) {
            if (assets.borrow_account().contains_key(i, owner)) {
                owned_assets.push_back(i);
            };
            i = i + 1;
        };
        owned_assets
    }
}