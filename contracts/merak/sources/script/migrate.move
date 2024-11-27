#[allow(lint(share_owned))]

module merak::migrate {
    use std::ascii::String;
    use merak::assets_schema;
    use sui::dynamic_field;
    use merak::assets_schema::Assets;
    use sui::package;
    use dubhe::dapps_schema::Dapps;
    use sui::package::UpgradeCap;

    const VERSION: u32 = 0;

    public fun version(): u32 {
        VERSION
    }

    public fun assert_version(dapps: &Dapps) {
        // assert(dapps.borrow_version().get() == VERSION, 1);
    }

    public fun migrate_to_v1(dapps: &mut Dapps, assets: &mut Assets, _cap: &UpgradeCap) {
    }
}