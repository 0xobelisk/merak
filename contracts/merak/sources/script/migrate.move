#[allow(lint(share_owned))]

module merak::migrate {

    const VERSION: u32 = 0;

    public fun version(): u32 {
        VERSION
    }
}