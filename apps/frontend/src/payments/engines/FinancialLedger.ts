// Double-entry bookkeeping ledger. Every entry must balance: sum(debits) = sum(credits).
// All amounts are in integer minor units (e.g. $10.00 = 1000).

export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  id:        string;
  code:      string;     // e.g. '1001'
  name:      string;
  type:      AccountType;
  currency:  string;
  balance:   number;     // integer minor units
  createdAt: number;
}

export interface JournalEntry {
  id:          string;
  description: string;
  currency:    string;
  lines:       JournalLine[];
  reference?:  string;  // external reference (txId, invoiceId, etc.)
  createdAt:   number;
  createdBy?:  string;
}

export interface JournalLine {
  accountId: string;
  debit:     number;   // exactly one of debit/credit is non-zero
  credit:    number;
  memo?:     string;
}

export interface LedgerBalance {
  accountId:  string;
  accountCode: string;
  accountName: string;
  balance:    number;
  currency:   string;
  asOf:       number;
}

export const FinancialLedger = {
  async getAccounts(currency?: string): Promise<Account[]> {
    const q = currency ? `?currency=${currency}` : '';
    try {
      const res = await fetch(`/api/payments/ledger/accounts${q}`);
      return res.ok ? res.json() as Promise<Account[]> : [];
    } catch { return []; }
  },

  async getAccount(id: string): Promise<Account | null> {
    try {
      const res = await fetch(`/api/payments/ledger/accounts/${id}`);
      return res.ok ? res.json() as Promise<Account> : null;
    } catch { return null; }
  },

  async postEntry(entry: Omit<JournalEntry, 'id' | 'createdAt'>): Promise<JournalEntry> {
    // Validate balance before posting
    const totalDebits  = entry.lines.reduce((s, l) => s + l.debit,  0);
    const totalCredits = entry.lines.reduce((s, l) => s + l.credit, 0);
    if (totalDebits !== totalCredits) {
      throw new Error(`Journal entry out of balance: debits=${totalDebits} credits=${totalCredits}`);
    }

    const res = await fetch('/api/payments/ledger/entries', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(entry),
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json() as Promise<JournalEntry>;
  },

  async getEntries(filters: { accountId?: string; from?: number; to?: number; limit?: number }): Promise<JournalEntry[]> {
    const q = new URLSearchParams();
    if (filters.accountId) q.set('accountId', filters.accountId);
    if (filters.from)      q.set('from', String(filters.from));
    if (filters.to)        q.set('to',   String(filters.to));
    if (filters.limit)     q.set('limit', String(filters.limit));
    try {
      const res = await fetch(`/api/payments/ledger/entries?${q}`);
      return res.ok ? res.json() as Promise<JournalEntry[]> : [];
    } catch { return []; }
  },

  async getBalances(asOf?: number): Promise<LedgerBalance[]> {
    const q = asOf ? `?asOf=${asOf}` : '';
    try {
      const res = await fetch(`/api/payments/ledger/balances${q}`);
      return res.ok ? res.json() as Promise<LedgerBalance[]> : [];
    } catch { return []; }
  },

  // Validate a proposed entry without posting it
  validateEntry(lines: JournalLine[]): { valid: boolean; reason?: string } {
    const debits  = lines.reduce((s, l) => s + l.debit,  0);
    const credits = lines.reduce((s, l) => s + l.credit, 0);
    if (debits !== credits) return { valid: false, reason: `Unbalanced: debits=${debits} credits=${credits}` };
    if (lines.some(l => l.debit < 0 || l.credit < 0)) return { valid: false, reason: 'Negative amounts not allowed' };
    return { valid: true };
  },
};
