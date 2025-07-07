module lending::lending {
    use sui::object::UID;
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use sui::balance::{Self, Balance};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};
    use sui::event;
    use std::string::String;

    // Error codes
    const E_INVALID_LOAN_AMOUNT: u64 = 1;
    const E_UNAUTHORIZED: u64 = 4;
    const E_LOAN_ALREADY_REPAID: u64 = 5;
    const E_INSUFFICIENT_PAYMENT: u64 = 6;
    const E_LOAN_EXPIRED: u64 = 7;
    const E_INVALID_DURATION: u64 = 8;
    const E_INVALID_INTEREST_RATE: u64 = 9;
    const E_INSUFFICIENT_COLLATERAL: u64 = 10;

    // Constants
    const MIN_LOAN_AMOUNT: u64 = 100_000_000; // 100 USD in micro-dollars
    const MAX_LOAN_AMOUNT: u64 = 1_000_000_000_000; // 1M USD in micro-dollars
    const MIN_COLLATERAL_RATIO: u64 = 150; // 150% collateralization ratio
    const MAX_INTEREST_RATE: u64 = 5000; // 50% in basis points
    const MIN_DURATION: u64 = 7; // 7 days minimum
    const MAX_DURATION: u64 = 365; // 1 year maximum
    const EXTENSION_FEE_RATE: u64 = 100; // 1% in basis points

    // Loan status enum
    const LOAN_STATUS_ACTIVE: u8 = 0;
    const LOAN_STATUS_REPAID: u8 = 1;
    const LOAN_STATUS_DEFAULTED: u8 = 2;
    const LOAN_STATUS_EXTENDED: u8 = 3;

    // Structs
    public struct LendingPool has key {
        id: UID,
        admin: address,
        total_loans: u64,
        total_borrowed: u64, // in micro-dollars
        total_collateral: u64, // in satoshis
        active_loan_count: u64,
        avg_interest_rate: u64, // in basis points
        treasury: Balance<SUI>,
        emergency_pause: bool,
    }

    public struct Loan has key, store {
        id: UID,
        borrower: address,
        btc_amount: u64, // Collateral in satoshis
        loan_amount: u64, // Loan amount in micro-dollars
        interest_rate: u64, // Annual interest rate in basis points
        duration: u64, // Duration in days
        start_date: u64, // Timestamp in milliseconds
        due_date: u64, // Timestamp in milliseconds
        btc_address: String, // Bitcoin address holding collateral
        status: u8,
        total_repayment: u64, // Total amount to repay in micro-dollars
        repaid_amount: u64, // Amount already repaid in micro-dollars
        extension_count: u64, // Number of extensions
    }

    public struct LoanRequest has key {
        id: UID,
        borrower: address,
        btc_amount: u64,
        loan_amount: u64,
        interest_rate: u64,
        duration: u64,
        btc_address: String,
        btc_tx_id: String, // Bitcoin transaction ID for collateral lock
        timestamp: u64,
    }

    public struct AdminCap has key {
        id: UID,
    }

    // Events
    public struct LoanCreated has copy, drop {
        loan_id: address,
        borrower: address,
        btc_amount: u64,
        loan_amount: u64,
        interest_rate: u64,
        duration: u64,
        btc_address: String,
    }

    public struct LoanRepaid has copy, drop {
        loan_id: address,
        borrower: address,
        repaid_amount: u64,
        total_repaid: u64,
        fully_repaid: bool,
    }

    public struct LoanExtended has copy, drop {
        loan_id: address,
        borrower: address,
        extension_days: u64,
        extension_fee: u64,
        new_due_date: u64,
    }

    public struct LoanDefaulted has copy, drop {
        loan_id: address,
        borrower: address,
        collateral_amount: u64,
        outstanding_amount: u64,
    }

    // Initialize the lending pool
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
        };

        let lending_pool = LendingPool {
            id: object::new(ctx),
            admin: tx_context::sender(ctx),
            total_loans: 0,
            total_borrowed: 0,
            total_collateral: 0,
            active_loan_count: 0,
            avg_interest_rate: 0,
            treasury: balance::zero(),
            emergency_pause: false,
        };

        transfer::transfer(admin_cap, tx_context::sender(ctx));
        transfer::share_object(lending_pool);
    }

    // Create a new loan
    public entry fun create_loan(
        pool: &mut LendingPool,
        btc_amount: u64,
        loan_amount: u64,
        duration: u64,
        btc_address: String,
        interest_rate: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(!pool.emergency_pause, E_UNAUTHORIZED);
        assert!(loan_amount >= MIN_LOAN_AMOUNT && loan_amount <= MAX_LOAN_AMOUNT, E_INVALID_LOAN_AMOUNT);
        assert!(duration >= MIN_DURATION && duration <= MAX_DURATION, E_INVALID_DURATION);
        assert!(interest_rate <= MAX_INTEREST_RATE, E_INVALID_INTEREST_RATE);

        // Check collateralization ratio (assuming 1 BTC = 50,000 USD for simplicity)
        let collateral_value = btc_amount * 50000 / 100000000; // Convert satoshis to USD
        let required_collateral = loan_amount * MIN_COLLATERAL_RATIO / 100;
        assert!(collateral_value >= required_collateral, E_INSUFFICIENT_COLLATERAL);

        let current_time = clock::timestamp_ms(clock);
        let due_date = current_time + (duration * 24 * 60 * 60 * 1000); // Convert days to milliseconds

        // Calculate total repayment amount
        let interest_amount = loan_amount * interest_rate * duration / (365 * 10000); // Daily interest
        let total_repayment = loan_amount + interest_amount;

        let loan = Loan {
            id: object::new(ctx),
            borrower: tx_context::sender(ctx),
            btc_amount,
            loan_amount,
            interest_rate,
            duration,
            start_date: current_time,
            due_date,
            btc_address,
            status: LOAN_STATUS_ACTIVE,
            total_repayment,
            repaid_amount: 0,
            extension_count: 0,
        };

        let loan_id = object::uid_to_address(&loan.id);

        // Update pool statistics
        pool.total_loans = pool.total_loans + 1;
        pool.total_borrowed = pool.total_borrowed + loan_amount;
        pool.total_collateral = pool.total_collateral + btc_amount;
        pool.active_loan_count = pool.active_loan_count + 1;
        
        // Update average interest rate
        pool.avg_interest_rate = (pool.avg_interest_rate * (pool.total_loans - 1) + interest_rate) / pool.total_loans;

        // Emit event
        event::emit(LoanCreated {
            loan_id,
            borrower: tx_context::sender(ctx),
            btc_amount,
            loan_amount,
            interest_rate,
            duration,
            btc_address,
        });

        transfer::transfer(loan, tx_context::sender(ctx));
    }

    // Repay a loan
    public entry fun repay_loan(
        pool: &mut LendingPool,
        loan: &mut Loan,
        payment: Coin<SUI>,
        repayment_amount: u64,
        _ctx: &mut TxContext
    ) {
        assert!(loan.borrower == tx_context::sender(_ctx), E_UNAUTHORIZED);
        assert!(loan.status == LOAN_STATUS_ACTIVE || loan.status == LOAN_STATUS_EXTENDED, E_LOAN_ALREADY_REPAID);
        assert!(coin::value(&payment) >= repayment_amount, E_INSUFFICIENT_PAYMENT);

        let remaining_amount = loan.total_repayment - loan.repaid_amount;
        let actual_repayment = if (repayment_amount > remaining_amount) {
            remaining_amount
        } else {
            repayment_amount
        };

        loan.repaid_amount = loan.repaid_amount + actual_repayment;
        let fully_repaid = loan.repaid_amount >= loan.total_repayment;

        if (fully_repaid) {
            loan.status = LOAN_STATUS_REPAID;
            pool.active_loan_count = pool.active_loan_count - 1;
        };

        // Take payment and add to treasury
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut pool.treasury, payment_balance);

        // Emit event
        event::emit(LoanRepaid {
            loan_id: object::uid_to_address(&loan.id),
            borrower: loan.borrower,
            repaid_amount: actual_repayment,
            total_repaid: loan.repaid_amount,
            fully_repaid,
        });
    }

    // Extend loan duration
    public entry fun extend_loan(
        pool: &mut LendingPool,
        loan: &mut Loan,
        extension_days: u64,
        extension_fee: Coin<SUI>,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(loan.borrower == tx_context::sender(_ctx), E_UNAUTHORIZED);
        assert!(loan.status == LOAN_STATUS_ACTIVE || loan.status == LOAN_STATUS_EXTENDED, E_LOAN_ALREADY_REPAID);
        assert!(extension_days > 0 && extension_days <= 90, E_INVALID_DURATION); // Max 90 days extension

        let current_time = clock::timestamp_ms(clock);
        assert!(current_time < loan.due_date, E_LOAN_EXPIRED);

        // Calculate extension fee
        let expected_fee = loan.loan_amount * EXTENSION_FEE_RATE * extension_days / (365 * 10000);
        assert!(coin::value(&extension_fee) >= expected_fee, E_INSUFFICIENT_PAYMENT);

        // Update loan details
        loan.due_date = loan.due_date + (extension_days * 24 * 60 * 60 * 1000);
        loan.extension_count = loan.extension_count + 1;
        loan.status = LOAN_STATUS_EXTENDED;

        // Calculate additional interest for extended period
        let additional_interest = loan.loan_amount * loan.interest_rate * extension_days / (365 * 10000);
        loan.total_repayment = loan.total_repayment + additional_interest;

        // Take extension fee and add to treasury
        let fee_balance = coin::into_balance(extension_fee);
        balance::join(&mut pool.treasury, fee_balance);

        // Emit event
        event::emit(LoanExtended {
            loan_id: object::uid_to_address(&loan.id),
            borrower: loan.borrower,
            extension_days,
            extension_fee: expected_fee,
            new_due_date: loan.due_date,
        });
    }

    // Mark loan as defaulted (admin only)
    public entry fun mark_loan_defaulted(
        _: &AdminCap,
        pool: &mut LendingPool,
        loan: &mut Loan,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        assert!(current_time > loan.due_date, E_LOAN_EXPIRED);
        assert!(loan.status == LOAN_STATUS_ACTIVE || loan.status == LOAN_STATUS_EXTENDED, E_LOAN_ALREADY_REPAID);

        let outstanding_amount = loan.total_repayment - loan.repaid_amount;
        
        loan.status = LOAN_STATUS_DEFAULTED;
        pool.active_loan_count = pool.active_loan_count - 1;

        // Emit event
        event::emit(LoanDefaulted {
            loan_id: object::uid_to_address(&loan.id),
            borrower: loan.borrower,
            collateral_amount: loan.btc_amount,
            outstanding_amount,
        });
    }

    // Admin functions
    public entry fun pause_protocol(_: &AdminCap, pool: &mut LendingPool) {
        pool.emergency_pause = true;
    }

    public entry fun unpause_protocol(_: &AdminCap, pool: &mut LendingPool) {
        pool.emergency_pause = false;
    }

    public entry fun withdraw_treasury(
        _: &AdminCap,
        pool: &mut LendingPool,
        amount: u64,
        ctx: &mut TxContext
    ) {
        let withdrawn = balance::split(&mut pool.treasury, amount);
        let coin = coin::from_balance(withdrawn, ctx);
        transfer::public_transfer(coin, tx_context::sender(ctx));
    }

    // View functions
    public fun get_loan_details(loan: &Loan): (
        address, // borrower
        u64,     // btc_amount
        u64,     // loan_amount
        u64,     // interest_rate
        u64,     // duration
        u64,     // start_date
        u64,     // due_date
        String,  // btc_address
        u8,      // status
        u64,     // total_repayment
        u64,     // repaid_amount
        u64      // extension_count
    ) {
        (
            loan.borrower,
            loan.btc_amount,
            loan.loan_amount,
            loan.interest_rate,
            loan.duration,
            loan.start_date,
            loan.due_date,
            loan.btc_address,
            loan.status,
            loan.total_repayment,
            loan.repaid_amount,
            loan.extension_count
        )
    }

    public fun get_pool_stats(pool: &LendingPool): (
        u64, // total_loans
        u64, // total_borrowed
        u64, // total_collateral
        u64, // active_loan_count
        u64, // avg_interest_rate
        u64, // treasury_balance
        bool // emergency_pause
    ) {
        (
            pool.total_loans,
            pool.total_borrowed,
            pool.total_collateral,
            pool.active_loan_count,
            pool.avg_interest_rate,
            balance::value(&pool.treasury),
            pool.emergency_pause
        )
    }

    public fun calculate_interest(
        principal: u64,
        rate: u64,
        duration: u64
    ): u64 {
        principal * rate * duration / (365 * 10000)
    }

    public fun get_loan_status(loan: &Loan): u8 {
        loan.status
    }

    public fun is_loan_overdue(loan: &Loan, current_time: u64): bool {
        current_time > loan.due_date && (loan.status == LOAN_STATUS_ACTIVE || loan.status == LOAN_STATUS_EXTENDED)
    }

    // Helper function to check collateralization ratio
    public fun check_collateralization_ratio(
        btc_amount: u64,
        loan_amount: u64,
        btc_price: u64 // BTC price in USD (scaled by 1e6)
    ): bool {
        let collateral_value = btc_amount * btc_price / 100000000; // Convert satoshis to USD
        let required_collateral = loan_amount * MIN_COLLATERAL_RATIO / 100;
        collateral_value >= required_collateral
    }

    // Test functions (for testing purposes)
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun create_test_loan(
        borrower: address,
        btc_amount: u64,
        loan_amount: u64,
        ctx: &mut TxContext
    ): Loan {
        use std::string;
        
        Loan {
            id: object::new(ctx),
            borrower,
            btc_amount,
            loan_amount,
            interest_rate: 1000, // 10%
            duration: 30,
            start_date: 1000000,
            due_date: 1000000 + (30 * 24 * 60 * 60 * 1000),
            btc_address: string::utf8(b"1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2"),
            status: LOAN_STATUS_ACTIVE,
            total_repayment: loan_amount + (loan_amount * 1000 * 30 / (365 * 10000)),
            repaid_amount: 0,
            extension_count: 0,
        }
    }
}