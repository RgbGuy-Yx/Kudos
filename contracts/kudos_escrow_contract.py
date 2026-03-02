from algopy import (
    ARC4Contract,
    Account,
    Global,
    GlobalState,
    Txn,
    UInt64,
    arc4,
    gtxn,
    itxn,
    subroutine,
)


class KudosEscrowContract(ARC4Contract):
    """
    Kudos grant escrow contract (ARC-4 / Puya).

    On-chain scope is strictly financial logic and state machine transitions.
    Off-chain metadata (proof links, notifications, proposals) is intentionally not stored on-chain.
    """

    def __init__(self) -> None:
        self.sponsor = GlobalState(Account, key="sponsor", description="Grant sponsor account")
        self.student = GlobalState(Account, key="student", description="Grant student account")
        self.total_amount = GlobalState(UInt64, key="total_amount", description="Total escrowed amount")
        self.milestone_count = GlobalState(UInt64, key="milestone_count", description="Total milestones")
        self.milestone_index = GlobalState(UInt64, key="milestone_index", description="Current approved milestone index (0-based)")
        self.status = GlobalState(UInt64, key="status", description="0 pending, 1 active, 2 completed, 3 cancelled")
        self.funded_amount = GlobalState(UInt64, key="funded_amount", description="Amount funded into escrow")

    @subroutine
    def _assert_initialized(self) -> None:
        assert bool(self.sponsor), "Contract not initialized"
        assert bool(self.student), "Contract not initialized"

    @subroutine
    def _base_payout(self) -> UInt64:
        return self.total_amount.value // self.milestone_count.value

    @subroutine
    def _paid_out_so_far(self) -> UInt64:
        return self._base_payout() * self.milestone_index.value

    @subroutine
    def _remaining_escrow(self) -> UInt64:
        return self.funded_amount.value - self._paid_out_so_far()

    @arc4.abimethod(create="require")
    def create_application(
        self,
        student: arc4.Address,
        total_amount: arc4.UInt64,
        milestone_count: arc4.UInt64,
    ) -> None:
        """
        Initialize grant application state.
        Can only happen at app creation.
        """
        assert not bool(self.sponsor), "Already initialized"

        student_account = student.native
        total_amount_native = total_amount.native
        milestone_count_native = milestone_count.native

        assert total_amount_native > UInt64(0), "total_amount must be > 0"
        assert milestone_count_native > UInt64(0), "milestone_count must be > 0"
        assert student_account != Global.zero_address, "invalid student"

        self.sponsor.value = Txn.sender
        self.student.value = student_account
        self.total_amount.value = total_amount_native
        self.milestone_count.value = milestone_count_native
        self.milestone_index.value = UInt64(0)
        self.status.value = UInt64(0)
        self.funded_amount.value = UInt64(0)

    @arc4.abimethod()
    def fund_contract(self) -> None:
        """
        Group-validated funding flow:
        group[0] = payment to app address
        group[1] = app call fund_contract()
        """
        self._assert_initialized()

        assert Txn.sender == self.sponsor.value, "Only sponsor can fund"
        assert self.status.value == UInt64(0), "Invalid status"
        assert self.funded_amount.value == UInt64(0), "Already funded"

        assert Global.group_size == UInt64(2), "Invalid group size"
        assert Txn.group_index == UInt64(1), "App call must be second txn"

        pay_txn = gtxn.PaymentTransaction(UInt64(0))
        assert pay_txn.sender == self.sponsor.value, "Funding sender must be sponsor"
        assert pay_txn.receiver == Global.current_application_address, "Funding receiver must be app address"
        assert pay_txn.amount == self.total_amount.value, "Funding amount mismatch"

        self.funded_amount.value = pay_txn.amount
        self.status.value = UInt64(1)

    @arc4.abimethod()
    def approve_milestone(self) -> None:
        """
        Sponsor approves current milestone and releases payout from app escrow to student.
        """
        self._assert_initialized()

        assert Txn.sender == self.sponsor.value, "Only sponsor can approve"
        assert self.status.value == UInt64(1), "Grant not active"
        assert self.milestone_index.value < self.milestone_count.value, "All milestones already approved"

        base_payout = self._base_payout()

        # Final milestone receives all remaining escrow to avoid rounding loss.
        remaining_milestones = self.milestone_count.value - self.milestone_index.value
        if remaining_milestones == UInt64(1):
            payout = self._remaining_escrow()
        else:
            payout = base_payout

        assert payout > UInt64(0), "Payout must be > 0"

        itxn.Payment(
            receiver=self.student.value,
            amount=payout,
            fee=0,
        ).submit()

        self.milestone_index.value = self.milestone_index.value + UInt64(1)

        if self.milestone_index.value == self.milestone_count.value:
            self.status.value = UInt64(2)

    @arc4.abimethod()
    def emergency_clawback(self) -> None:
        """
        Sponsor can reclaim remaining escrow while grant is still active.
        """
        self._assert_initialized()

        assert Txn.sender == self.sponsor.value, "Only sponsor can clawback"
        assert self.status.value == UInt64(1), "Grant not active"
        assert self.milestone_index.value < self.milestone_count.value, "Grant already finalized"

        remaining = self._remaining_escrow()
        assert remaining > UInt64(0), "No escrow remaining"

        itxn.Payment(
            receiver=self.sponsor.value,
            amount=remaining,
            fee=0,
        ).submit()

        self.milestone_index.value = self.milestone_count.value
        self.status.value = UInt64(3)
