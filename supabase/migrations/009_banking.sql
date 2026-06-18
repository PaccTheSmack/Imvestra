-- ─── Bank Accounts ───────────────────────────────────────────────────────────
-- Stores connected bank accounts per user.
-- Provider-agnostic: supports GoCardless (Nordigen) or manual accounts.

create table if not exists bank_accounts (
  id                uuid        primary key default gen_random_uuid(),
  user_id           uuid        not null references auth.users(id) on delete cascade,
  provider          text        not null default 'gocardless', -- 'gocardless' | 'manual'
  -- GoCardless fields (null for manual accounts)
  requisition_id    text,       -- GoCardless requisition ID for re-auth
  external_id       text,       -- GoCardless account ID
  institution_id    text,       -- e.g. 'SPARKASSE_SSKMDEMMXXX'
  institution_name  text,       -- human-readable bank name
  -- Account details
  iban              text,
  currency          text        not null default 'EUR',
  account_name      text,
  -- Sync state
  status            text        not null default 'pending',
  -- 'pending' | 'active' | 'error' | 'expired'
  last_synced_at    timestamptz,
  error_message     text,
  -- Link to a property for rent matching context
  property_id       uuid        references properties(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table bank_accounts enable row level security;

create policy "bank_accounts: owner read"
  on bank_accounts for select
  using (auth.uid() = user_id);

create policy "bank_accounts: owner insert"
  on bank_accounts for insert
  with check (auth.uid() = user_id);

create policy "bank_accounts: owner update"
  on bank_accounts for update
  using (auth.uid() = user_id);

create policy "bank_accounts: owner delete"
  on bank_accounts for delete
  using (auth.uid() = user_id);

-- ─── Bank Transactions ────────────────────────────────────────────────────────
-- Raw transactions imported from the bank (via GoCardless or manual CSV).
-- Separate from rent_payments — this is the raw bank ledger.

create table if not exists bank_transactions (
  id                  uuid        primary key default gen_random_uuid(),
  user_id             uuid        not null references auth.users(id) on delete cascade,
  bank_account_id     uuid        not null references bank_accounts(id) on delete cascade,
  -- Raw bank data
  external_id         text,       -- GoCardless transactionId (unique per account)
  booking_date        date,
  value_date          date,
  amount              decimal(12, 2) not null,
  currency            text        not null default 'EUR',
  description         text,       -- remittanceInformationUnstructured
  creditor_name       text,
  debtor_name         text,
  remittance_info     text,       -- structured remittance info if available
  -- Matching / categorization
  matched_payment_id  uuid        references rent_payments(id) on delete set null,
  matched_expense_id  uuid        references expenses(id) on delete set null,
  match_status        text        not null default 'unmatched',
  -- 'unmatched' | 'matched_rent' | 'matched_expense' | 'ignored'
  match_confidence    smallint,   -- 0-100 auto-match confidence score
  category            text,       -- manual or auto-assigned category
  notes               text,
  created_at          timestamptz not null default now()
);

-- Prevent duplicate imports from GoCardless
create unique index if not exists bank_transactions_external_unique
  on bank_transactions(bank_account_id, external_id)
  where external_id is not null;

alter table bank_transactions enable row level security;

create policy "bank_transactions: owner read"
  on bank_transactions for select
  using (auth.uid() = user_id);

create policy "bank_transactions: owner insert"
  on bank_transactions for insert
  with check (auth.uid() = user_id);

create policy "bank_transactions: owner update"
  on bank_transactions for update
  using (auth.uid() = user_id);

create policy "bank_transactions: owner delete"
  on bank_transactions for delete
  using (auth.uid() = user_id);
