module merak::wrapper_schema {
    use dubhe::storage;
    use merak::schema::Schema;
    use sui::bag;
    use sui::bag::Bag;
    use std::type_name;
    use std::ascii::string;
    use std::ascii::String;
    use sui::balance::Balance;

    public struct WrapperCoin<phantom T> has drop, copy, store { }

    public fun new<T>(): WrapperCoin<T> {
        WrapperCoin {}
    }

    public(package) fun add_to_schema(schema: &mut Schema, ctx: &mut TxContext) {
        storage::add_field(schema.id(), b"wrapper_pools", bag::new(ctx));
        storage::add_field(schema.id(), b"wrapper_assets", bag::new(ctx));
    }

    public(package) fun wrapper_pools(schema: &mut Schema): &mut Bag {
        storage::borrow_mut_field(schema.id(), b"wrapper_pools")
    }

    public(package) fun wrapper_assets(schema: &mut Schema): &mut Bag {
        storage::borrow_mut_field(schema.id(), b"wrapper_assets")
    }

    public(package) fun borrow_wrapper_pools(schema: &Schema): &Bag {
        storage::borrow_field(schema.borrow_id(), b"wrapper_pools")
    }

    public(package) fun borrow_wrapper_assets(schema: &Schema): &Bag {
        storage::borrow_field(schema.borrow_id(), b"wrapper_assets")
    }
}