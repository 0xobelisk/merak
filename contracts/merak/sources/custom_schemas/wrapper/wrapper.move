module merak::wrapper_schema {
    use sui::bag;
    use sui::bag::Bag;
    use dubhe::storage_migrate;

    public struct Wrapper has key, store { id: UID }

    public(package) fun borrow_mut_asset_ids(self: &mut Wrapper): &mut Bag {
        storage_migrate::borrow_mut_field(&mut self.id, b"asset_ids")
    }

    public(package) fun borrow_mut_pools(self: &mut Wrapper): &mut Bag {
        storage_migrate::borrow_mut_field(&mut self.id, b"pools")
    }

    public(package) fun borrow_mut_coins(self: &mut Wrapper): &mut Bag {
        storage_migrate::borrow_mut_field(&mut self.id, b"coins")
    }

    public(package) fun borrow_asset_ids(self: &Wrapper): &Bag {
        storage_migrate::borrow_field(&self.id, b"asset_ids")
    }

    public(package) fun borrow_pools(self: &Wrapper): &Bag {
        storage_migrate::borrow_field(&self.id, b"pools")
    }

    public(package) fun borrow_coins(self: &Wrapper): &Bag {
        storage_migrate::borrow_field(&self.id, b"coins")
    }

    public fun create(ctx: &mut TxContext): Wrapper {
        let mut id = object::new(ctx);
        storage_migrate::add_field<Bag>(&mut id, b"asset_ids", bag::new(ctx));
        storage_migrate::add_field<Bag>(&mut id, b"pools", bag::new(ctx));
        storage_migrate::add_field<Bag>(&mut id, b"coins", bag::new(ctx));
        Wrapper { id }
    }

}