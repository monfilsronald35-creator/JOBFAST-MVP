import React, {
  useState,
  useMemo,
  memo,
  useCallback,
  useEffect,
  Suspense,
} from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../services/wallet';
import walletHero from '../../assets/wallet-hero-8k.jpg';
import {
  Wallet as WalletIcon,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  ShieldCheck,
  Globe2,
  Sparkles,
  BarChart3,
  Activity,
  AlertTriangle,
  Smartphone,
  Receipt,
  ShoppingBag,
  Hotel,
  Plane,
  CarFront,
  Store,
  Building2,
  Send,
  FileText,
  RefreshCw,
  CircleDollarSign,
  BadgeDollarSign,
  Landmark,
  WifiOff,
  Fingerprint,
  Coins,
  TrendingUp,
  BadgeInfo,
  Calculator,
  ShieldAlert,
  KeyRound,
  Gift,
  Ticket,
  Package,
  ArrowRightLeft,
  Fuel,
  PiggyBank,
  FileBadge2,
  Briefcase,
  BellRing,
  Lock,
  MapPinned,
  Percent,
  BadgeCent,
  Shield,
  Building,
  FileBox,
  Calendar,
  CalendarDays,
  Heart,
  Watch,
  Zap,
} from 'lucide-react';
import {
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  useMutation,
  type QueryKey,
} from '@tanstack/react-query';
import { useVirtualizer } from '@tanstack/react-virtual';

// ─── Types ────────────────────────────────────────────────────────────────────

type LucideIcon = React.ComponentType<{ className?: string }>;

interface Transaction {
  id: string;
  type?: string;
  label?: string;
  sub?: string;
  amount?: string;
  date?: string;
  icon?: string;
}

interface TxPage {
  items: Transaction[];
  nextPage?: number;
}

interface OverviewData {
  totals?: { totalUSD?: number };
  healthScore?: number;
  fraudRisk?: string;
  assets?: Record<string, unknown>;
  aiEngine?: Record<string, unknown>;
  security?: Record<string, unknown>;
}

interface WalletAction { id: string; label: string; icon: LucideIcon }

interface SectionItem { label: string; value: string; icon?: LucideIcon }
interface WalletSection { title: string; items: SectionItem[] }

interface OfflineQueueItem { id: string; type: string; payload: Record<string, unknown> }

// walletAPI is a JS module — cast to a typed wrapper
interface WalletAPIType {
  getOverview: ()                                              => Promise<{ data: OverviewData }>;
  getTransactions: (p: { type: string; page: number })        => Promise<{ data: TxPage }>;
  getPaymentMethods: ()                                        => Promise<{ data: unknown[] }>;
  getMultiCurrencyBalances: ()                                 => Promise<{ data: { fiat?: unknown[]; crypto?: unknown[]; reward?: unknown[]; giftcard?: unknown[]; voucher?: unknown[] } }>;
  getSecurityCenter: ()                                        => Promise<{ data: Record<string, string> }>;
  getAISmartEngine: ()                                         => Promise<{ data: Record<string, string> }>;
  getCardControls: ()                                          => Promise<{ data: Record<string, string> }>;
  getCrossBorder: ()                                           => Promise<{ data: Record<string, string> }>;
  getSplitPayments: ()                                         => Promise<{ data: Record<string, string> }>;
  getTaxes: ()                                                 => Promise<{ data: Record<string, string> }>;
  getDocuments: ()                                             => Promise<{ data: Record<string, string> }>;
  getCashback: ()                                              => Promise<{ data: Record<string, string> }>;
  getFinancialGraphs: ()                                       => Promise<{ data: Record<string, unknown> }>;
  getMerchantPos: ()                                           => Promise<{ data: Record<string, string> }>;
  getWalletWidgets: ()                                         => Promise<{ data: Record<string, string> }>;
  getWalletCopilot: ()                                         => Promise<{ data: Record<string, string> }>;
  sendMoney: (p: Record<string, unknown>)                      => Promise<unknown>;
  checkout: (p: Record<string, unknown>)                       => Promise<unknown>;
}

const wAPI = walletAPI as unknown as WalletAPIType;

// ─── Constants ────────────────────────────────────────────────────────────────

const CURRENCIES = [
  'USD','EUR','GBP','CAD','DOP','HTG','MXN','BRL',
  'JPY','CNY','AED','SAR','USDT','USDC','BTC','ETH','SOL',
];

const NETWORKS = [
  'Visa','Mastercard','American Express','Discover','UnionPay',
  'Apple Pay','Google Pay','Samsung Pay','PayPal','Stripe',
  'Wise','SEPA','SWIFT','ACH','PIX','UPI',
];

const ACTIONS: WalletAction[] = [
  { id: 'product',     label: 'Pay Product',     icon: ShoppingBag    },
  { id: 'reservation', label: 'Pay Reservation',  icon: Hotel          },
  { id: 'service',     label: 'Pay Service',      icon: Store          },
  { id: 'hotel',       label: 'Pay Hotel',        icon: Hotel          },
  { id: 'flight',      label: 'Pay Flight',       icon: Plane          },
  { id: 'taxi',        label: 'Pay Taxi',         icon: CarFront       },
  { id: 'worker',      label: 'Pay Worker',       icon: BadgeDollarSign},
  { id: 'company',     label: 'Pay Company',      icon: Building2      },
  { id: 'transfer',    label: 'Send Money',       icon: Send           },
  { id: 'bill',        label: 'Pay Bill',         icon: FileText       },
  { id: 'delivery',    label: 'Pay Delivery',     icon: CircleDollarSign},
  { id: 'ticket',      label: 'Buy Ticket',       icon: Receipt        },
];

const QK = {
  overview:         ['wallet', 'overview'],
  transactions:     (filter: string) => ['wallet', 'transactions', filter],
  paymentMethods:   ['wallet', 'payment-methods'],
  multiCurrency:    ['wallet', 'multi-currency'],
  security:         ['wallet', 'security'],
  aiSmart:          ['wallet', 'ai-smart'],
  cardControls:     ['wallet', 'card-controls'],
  crossBorder:      ['wallet', 'cross-border'],
  splitPayments:    ['wallet', 'split-payments'],
  taxes:            ['wallet', 'taxes'],
  docs:             ['wallet', 'docs'],
  cashback:         ['wallet', 'cashback'],
  graphs:           ['wallet', 'graphs'],
  pos:              ['wallet', 'pos'],
  widgets:          ['wallet', 'widgets'],
  copilot:          ['wallet', 'copilot'],
  orders:           ['wallet', 'orders'],
  reservations:     ['wallet', 'reservations'],
  receipts:         ['wallet', 'receipts'],
};

// ─── Lazy panels ──────────────────────────────────────────────────────────────

const SendPanel     = React.lazy(() => import('./panels/SendPanel'));
const ReceivePanel  = React.lazy(() => import('./panels/ReceivePanel'));
const DepositPanel  = React.lazy(() => import('./panels/DepositPanel'));
const WithdrawPanel = React.lazy(() => import('./panels/WithdrawPanel'));
const PayPanel      = React.lazy(() => import('./panels/PayPanel'));
const InvoicePanel  = React.lazy(() => import('./panels/InvoicePanel'));
const ExchangePanel = React.lazy(() => import('./panels/ExchangePanel'));

// ─── Error boundary ───────────────────────────────────────────────────────────

interface WEBProps { children: React.ReactNode }
interface WEBState { hasError: boolean }

class WalletErrorBoundary extends React.Component<WEBProps, WEBState> {
  state: WEBState = { hasError: false };
  static getDerivedStateFromError(): WEBState { return { hasError: true }; }
  handleRetry = () => this.setState({ hasError: false });
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full bg-rose-900/50 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-rose-400" />
            </div>
            <p className="text-sm font-bold">Yon erè fèt nan Wallet la.</p>
            <button type="button" onClick={this.handleRetry} className="px-4 py-2 rounded-xl bg-amber-500 text-slate-900 text-xs font-black">
              Reload Wallet
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─── Small shared UI pieces ───────────────────────────────────────────────────

const cls = (...parts: (string | undefined | false | null)[]): string => parts.filter(Boolean).join(' ');

const SkeletonBlock = ({ className }: { className?: string }) => (
  <div className={cls('animate-pulse bg-slate-800/70 rounded-xl', className)} />
);

const SkeletonList = ({ rows = 6 }: { rows?: number }) => (
  <div className="p-4 space-y-2">
    {Array.from({ length: rows }).map((_, i) => <SkeletonBlock key={i} className="h-6" />)}
  </div>
);

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{children}</p>
);

const TabButton = ({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) => (
  <button
    type="button"
    onClick={onClick}
    className={cls(
      'px-3 py-1.5 rounded-xl text-[11px] font-bold border transition shrink-0',
      active ? 'bg-amber-500 border-amber-400 text-slate-900' : 'bg-slate-900/80 border-slate-700/60 text-slate-400'
    )}
  >
    {children}
  </button>
);

interface StatCardProps { label: string; value: string | number; sub?: string; icon?: LucideIcon }

const StatCard = memo(function StatCard({ label, value, sub, icon: Icon }: StatCardProps) {
  return (
    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/70">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] uppercase tracking-widest text-slate-500">{label}</p>
        {Icon ? <Icon className="w-4 h-4 text-emerald-400" /> : null}
      </div>
      <p className="text-sm font-semibold text-emerald-300">{value}</p>
      {sub ? <p className="text-[10px] text-slate-500 mt-1">{sub}</p> : null}
    </div>
  );
});

// ─── Header ───────────────────────────────────────────────────────────────────

interface WalletPageHeaderProps {
  user: Record<string, unknown> | null;
  overview: OverviewData | undefined;
}

const WalletPageHeader = memo(function WalletPageHeader({ user: u, overview }: WalletPageHeaderProps) {
  const name       = (u?.['name'] as string | undefined)     ?? 'Global User';
  const role       = (u?.['role'] as string | undefined)     ?? 'worker';
  const totals     = overview?.totals ?? {};
  const totalUSD   = totals.totalUSD ?? 0;
  const healthScore = overview?.healthScore ?? 0;
  const fraudRisk  = overview?.fraudRisk ?? 'Low';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="relative px-4 pt-6 pb-4"
    >
      <motion.div
        className="absolute inset-x-4 -top-2 h-32 rounded-3xl bg-gradient-to-r from-emerald-500/25 via-slate-900/80 to-cyan-600/25 blur-3xl -z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
      />
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[10px] text-cyan-300 font-semibold">JOBFAST GLOBAL PAYMENT WALLET</p>
          <h1 className="text-lg font-black text-white">{name}</h1>
          <p className="text-xs text-emerald-300 font-bold">{role === 'worker' ? 'Global Worker' : 'Global Account'}</p>
        </div>
        <div className="p-2 rounded-2xl bg-black/50 border border-white/20 backdrop-blur-xl flex flex-col items-center">
          <WalletIcon className="w-6 h-6 text-emerald-300" />
          <p className="text-[9px] text-slate-300 mt-1">Secure Vault</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Net Worth</p>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl md:text-3xl font-black text-emerald-300">
            ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Cash • Crypto • Escrow • Savings • Investments • Payroll • Rewards.</p>
        </div>

        <div className="p-4 rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Health • Fraud • Security</p>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-[11px] text-slate-300">
            Health Score: <span className="text-emerald-300 font-bold">{healthScore}/100</span> •{' '}
            Fraud Risk: <span className="text-amber-300 font-bold">{fraudRisk}</span>.
          </p>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Actions row ──────────────────────────────────────────────────────────────

const WalletActionsRow = memo(function WalletActionsRow({ onOpen }: { onOpen: (id: string) => void }) {
  return (
    <div className="px-4 mt-2 grid grid-cols-3 md:grid-cols-6 gap-2">
      {ACTIONS.slice(0, 6).map((a) => {
        const Icon = a.icon;
        return (
          <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="flex flex-col items-center gap-1.5 py-3 px-3 rounded-2xl bg-slate-900/70 border border-slate-700/60 hover:border-amber-500/60 transition">
            <Icon className="w-5 h-5 text-emerald-300" />
            <span className="text-[11px] text-slate-200 font-bold">{a.label}</span>
          </button>
        );
      })}
    </div>
  );
});

// ─── Inner wallet page ────────────────────────────────────────────────────────

function WalletPageInner() {
  const { user }      = useAuth();
  const u             = user as Record<string, unknown> | null;
  const queryClient   = useQueryClient();
  const [txFilter,    setTxFilter]    = useState('all');
  const [panel,       setPanel]       = useState<string | null>(null);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>([]);

  void offlineQueue; // referenced so TypeScript doesn't error on unused state

  const { data: overviewData } = useQuery<OverviewData>({
    queryKey: QK.overview,
    queryFn: () => wAPI.getOverview().then((res) => res.data),
    staleTime: 60_000,
    retry: 3,
  });

  const { data: txPages, isLoading: txLoading } = useInfiniteQuery<TxPage, Error>({
    queryKey: QK.transactions(txFilter),
    queryFn: ({ pageParam }) => wAPI.getTransactions({ type: txFilter, page: (pageParam as number) ?? 1 }).then((res) => res.data),
    initialPageParam: 1,
    getNextPageParam: (last) => last?.nextPage ?? undefined,
    retry: 3,
  });

  const transactions = useMemo<Transaction[]>(
    () => (txPages?.pages ?? []).flatMap((page) => page.items ?? []),
    [txPages]
  );

  const filteredTransactions = useMemo<Transaction[]>(() => {
    if (txFilter === 'all') return transactions;
    return transactions.filter((tx) => tx.type === txFilter);
  }, [transactions, txFilter]);

  const parentRef = React.useRef<HTMLDivElement | null>(null);
  const virtualizer = useVirtualizer({
    count: filteredTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 56,
    overscan: 20,
  });

  const { data: multiCurrency = { fiat: [], crypto: [], reward: [], giftcard: [], voucher: [] } } = useQuery({
    queryKey: QK.multiCurrency,
    queryFn: () => wAPI.getMultiCurrencyBalances().then((res) => res.data),
  });

  const { data: securityCenter = {} as Record<string, string> } = useQuery({
    queryKey: QK.security,
    queryFn: () => wAPI.getSecurityCenter().then((res) => res.data),
  });

  const { data: aiSmart = {} as Record<string, string> } = useQuery({
    queryKey: QK.aiSmart,
    queryFn: () => wAPI.getAISmartEngine().then((res) => res.data),
  });

  const { data: cardControls = {} as Record<string, string> } = useQuery({
    queryKey: QK.cardControls,
    queryFn: () => wAPI.getCardControls().then((res) => res.data),
  });

  const { data: crossBorder = {} as Record<string, string> } = useQuery({
    queryKey: QK.crossBorder,
    queryFn: () => wAPI.getCrossBorder().then((res) => res.data),
  });

  const { data: splitPayments = {} as Record<string, string> } = useQuery({
    queryKey: QK.splitPayments,
    queryFn: () => wAPI.getSplitPayments().then((res) => res.data),
  });

  const { data: taxes = {} as Record<string, string> } = useQuery({
    queryKey: QK.taxes,
    queryFn: () => wAPI.getTaxes().then((res) => res.data),
  });

  const { data: docs = {} as Record<string, string> } = useQuery({
    queryKey: QK.docs,
    queryFn: () => wAPI.getDocuments().then((res) => res.data),
  });

  const { data: cashback = {} as Record<string, string> } = useQuery({
    queryKey: QK.cashback,
    queryFn: () => wAPI.getCashback().then((res) => res.data),
  });

  const { data: pos = {} as Record<string, string> } = useQuery({
    queryKey: QK.pos,
    queryFn: () => wAPI.getMerchantPos().then((res) => res.data),
  });

  const { data: widgets = {} as Record<string, string> } = useQuery({
    queryKey: QK.widgets,
    queryFn: () => wAPI.getWalletWidgets().then((res) => res.data),
  });

  const { data: copilot = {} as Record<string, string> } = useQuery({
    queryKey: QK.copilot,
    queryFn: () => wAPI.getWalletCopilot().then((res) => res.data),
  });

  type MutationCtx = { prevTx?: unknown };

  const sendMutation = useMutation<unknown, Error, Record<string, unknown>, MutationCtx>({
    mutationFn: (payload) => wAPI.sendMoney(payload),
    onMutate: async (payload): Promise<MutationCtx> => {
      if (!navigator.onLine) {
        setOfflineQueue((prev) => [...prev, { id: `offline-${Date.now()}`, type: 'send', payload }]);
        return {};
      }
      await queryClient.cancelQueries({ queryKey: QK.transactions(txFilter) as QueryKey });
      const prevTx = queryClient.getQueryData(QK.transactions(txFilter) as QueryKey);
      queryClient.setQueryData(QK.transactions(txFilter) as QueryKey, (old: unknown) => {
        const data = old as { pages?: TxPage[] } | undefined;
        const pages = data?.pages ?? [];
        const firstPage = pages[0] ?? { items: [] };
        return {
          pages: [
            {
              ...firstPage,
              items: [
                { id: `optimistic-${Date.now()}`, type: 'transfer', label: `Send to ${payload['recipient']}`, sub: (payload['desc'] as string | undefined) ?? 'Send Money', amount: `-$${payload['amount']}`, date: new Date().toLocaleDateString() },
                ...(firstPage.items ?? []),
              ],
            },
            ...pages.slice(1),
          ],
        };
      });
      return { prevTx };
    },
    onError: (_err, _payload, ctx) => {
      if (ctx?.prevTx) queryClient.setQueryData(QK.transactions(txFilter) as QueryKey, ctx.prevTx);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: QK.transactions(txFilter) as QueryKey });
      void queryClient.invalidateQueries({ queryKey: QK.overview as QueryKey });
    },
  });

  const handleCheckout = useCallback(async (checkoutPayload: Record<string, unknown>) => {
    const payload: Record<string, unknown> = { ...checkoutPayload, idempotencyKey: crypto.randomUUID(), billingAddressId: checkoutPayload['billingAddressId'] ?? null };
    await wAPI.checkout(payload);
    void queryClient.invalidateQueries({ queryKey: QK.orders as QueryKey });
    void queryClient.invalidateQueries({ queryKey: QK.reservations as QueryKey });
    void queryClient.invalidateQueries({ queryKey: QK.receipts as QueryKey });
  }, [queryClient]);
  void handleCheckout; // used via WalletActionsRow → panel flows

  const sections = useMemo<WalletSection[]>(() => [
    {
      title: 'AI Smart Spending Engine',
      items: [
        { label: 'Auto detect fraud',       value: aiSmart['fraud']          ?? 'On', icon: ShieldAlert   },
        { label: 'Auto detect subscription', value: aiSmart['subscription']   ?? 'On', icon: RefreshCw     },
        { label: 'AI classify expenses',     value: aiSmart['classify']       ?? 'On', icon: BarChart3     },
        { label: 'AI monthly report',        value: aiSmart['monthlyReport']  ?? 'On', icon: FileText      },
        { label: 'AI tax estimation',        value: aiSmart['taxEstimate']    ?? 'On', icon: Calculator    },
        { label: 'AI cashflow prediction',   value: aiSmart['cashflow']       ?? 'On', icon: TrendingUp    },
      ],
    },
    {
      title: 'Real Card Controls',
      items: [
        { label: 'Merchant Lock',   value: cardControls['merchantLock']  ?? 'On',  icon: Lock         },
        { label: 'Country Lock',    value: cardControls['countryLock']   ?? 'On',  icon: MapPinned    },
        { label: 'Online Only',     value: cardControls['onlineOnly']    ?? 'On',  icon: WifiOff      },
        { label: 'ATM Only',        value: cardControls['atmOnly']       ?? 'On',  icon: Landmark     },
        { label: 'Contactless',     value: cardControls['contactless']   ?? 'On',  icon: Smartphone   },
        { label: 'Spending Limit',  value: cardControls['spendingLimit'] ?? '$0',  icon: Percent      },
        { label: 'Daily Limit',     value: cardControls['dailyLimit']    ?? '$0',  icon: Calendar     },
        { label: 'Monthly Limit',   value: cardControls['monthlyLimit']  ?? '$0',  icon: CalendarDays },
        { label: 'MCC Restriction', value: cardControls['mcc']           ?? 'On',  icon: BadgeCent    },
      ],
    },
    {
      title: 'Cross Border Engine',
      items: [
        { label: 'Live FX',                    value: crossBorder['liveFx']              ?? 'On', icon: ArrowLeftRight },
        { label: 'Low fee prediction',          value: crossBorder['lowFee']              ?? 'On', icon: BadgeDollarSign},
        { label: 'Arrival estimate',            value: crossBorder['arrival']             ?? 'On', icon: TrendingUp     },
        { label: 'Recipient bank validation',   value: crossBorder['recipientValidation'] ?? 'On', icon: ShieldCheck    },
      ],
    },
    {
      title: 'Split Payments',
      items: [
        { label: 'Restaurant bill split', value: splitPayments['restaurant'] ?? 'On', icon: Receipt  },
        { label: 'Group travel',          value: splitPayments['travel']     ?? 'On', icon: Plane    },
        { label: 'Shared invoice',        value: splitPayments['invoice']    ?? 'On', icon: FileText },
        { label: 'Shared reservation',    value: splitPayments['reservation']?? 'On', icon: Hotel    },
      ],
    },
    {
      title: 'Wallet AI Copilot',
      items: [
        { label: 'Can I afford this flight?', value: copilot['flight']     ?? 'Ask', icon: Plane          },
        { label: 'Visa or Crypto?',           value: copilot['railChoice'] ?? 'Ask', icon: Coins          },
        { label: 'Lower fee currency?',       value: copilot['currency']   ?? 'Ask', icon: Globe2         },
        { label: 'Pay from savings?',         value: copilot['savings']    ?? 'Ask', icon: PiggyBank      },
        { label: 'Convert USD first?',        value: copilot['convert']    ?? 'Ask', icon: ArrowRightLeft },
      ],
    },
    {
      title: 'Global Taxes',
      items: [
        { label: 'VAT',  value: taxes['vat']      ?? 'On', icon: Percent    },
        { label: 'IVA',  value: taxes['iva']      ?? 'On', icon: Percent    },
        { label: 'TVA',  value: taxes['tva']      ?? 'On', icon: Percent    },
        { label: 'IRS',  value: taxes['irs']      ?? 'On', icon: FileText   },
        { label: '1099', value: taxes['form1099'] ?? 'On', icon: FileBadge2 },
        { label: 'W9',   value: taxes['w9']       ?? 'On', icon: FileBox    },
      ],
    },
    {
      title: 'Advanced Security',
      items: [
        { label: 'Risk Device Score',           value: securityCenter['deviceScore']       ?? 'N/A', icon: ShieldAlert  },
        { label: 'Behavioral Biometrics',       value: securityCenter['behavioral']        ?? 'On',  icon: Activity     },
        { label: 'Impossible Travel AI',        value: securityCenter['impossibleTravel']  ?? 'On',  icon: Globe2       },
        { label: 'Device Fingerprinting',       value: securityCenter['fingerprint']       ?? 'On',  icon: Fingerprint  },
        { label: 'Continuous Authentication',   value: securityCenter['continuousAuth']    ?? 'On',  icon: Fingerprint  },
        { label: 'PCI DSS Monitoring',          value: securityCenter['pci']               ?? 'On',  icon: Shield       },
        { label: 'SOC2 Audit',                  value: securityCenter['soc2']              ?? 'On',  icon: Briefcase    },
        { label: 'ISO27001',                    value: securityCenter['iso27001']          ?? 'On',  icon: BadgeInfo    },
        { label: 'FIDO2',                       value: securityCenter['fido2']             ?? 'On',  icon: KeyRound     },
        { label: 'Hardware Key',                value: securityCenter['hardwareKey']       ?? 'On',  icon: ShieldCheck  },
      ],
    },
    {
      title: 'Merchant POS',
      items: [
        { label: 'Restaurant',         value: pos['restaurant']   ?? 'On', icon: Hotel          },
        { label: 'Hotel',              value: pos['hotel']        ?? 'On', icon: Building       },
        { label: 'Marketplace',        value: pos['marketplace']  ?? 'On', icon: ShoppingBag    },
        { label: 'Construction',       value: pos['construction'] ?? 'On', icon: Building2      },
        { label: 'Hospital',           value: pos['hospital']     ?? 'On', icon: Heart          },
        { label: 'Taxi',               value: pos['taxi']         ?? 'On', icon: CarFront       },
        { label: 'Supermarket',        value: pos['supermarket']  ?? 'On', icon: Store          },
      ],
    },
    {
      title: 'Wallet Widgets',
      items: [
        { label: 'iOS',                value: widgets['ios']               ?? 'On', icon: Smartphone },
        { label: 'Android',            value: widgets['android']           ?? 'On', icon: Smartphone },
        { label: 'WearOS',             value: widgets['wearos']            ?? 'On', icon: Activity   },
        { label: 'Apple Watch',        value: widgets['appleWatch']        ?? 'On', icon: Watch      },
        { label: 'Samsung Watch',      value: widgets['samsungWatch']      ?? 'On', icon: Watch      },
        { label: 'Smart notification', value: widgets['smartNotification'] ?? 'On', icon: BellRing   },
        { label: 'Quick pay',          value: widgets['quickPay']          ?? 'On', icon: Zap        },
      ],
    },
    {
      title: 'Digital Documents',
      items: [
        { label: 'Passport',       value: docs['passport']      ?? 'Stored', icon: FileText   },
        { label: 'Visa',           value: docs['visa']          ?? 'Stored', icon: FileText   },
        { label: 'ID',             value: docs['id']            ?? 'Stored', icon: FileText   },
        { label: 'Insurance',      value: docs['insurance']     ?? 'Stored', icon: FileText   },
        { label: 'Driver License', value: docs['driverLicense'] ?? 'Stored', icon: FileText   },
        { label: 'Payroll',        value: docs['payroll']       ?? 'Stored', icon: Briefcase  },
        { label: 'Invoices',       value: docs['invoices']      ?? 'Stored', icon: Receipt    },
        { label: 'Receipts',       value: docs['receipts']      ?? 'Stored', icon: Receipt    },
      ],
    },
    {
      title: 'Global Cashback',
      items: [
        { label: 'Automatic cashback',   value: cashback['auto']          ?? 'On', icon: Gift        },
        { label: 'Travel rewards',        value: cashback['travel']        ?? 'On', icon: Plane       },
        { label: 'Hotel rewards',         value: cashback['hotel']         ?? 'On', icon: Hotel       },
        { label: 'Fuel rewards',          value: cashback['fuel']          ?? 'On', icon: Fuel        },
        { label: 'Marketplace rewards',   value: cashback['marketplace']   ?? 'On', icon: ShoppingBag },
        { label: 'Construction rewards',  value: cashback['construction']  ?? 'On', icon: Building2   },
      ],
    },
  ], [aiSmart, cardControls, crossBorder, splitPayments, copilot, taxes, securityCenter, pos, widgets, docs, cashback]);

  const TX_FILTER_TABS = ['all','income','expenses','salary','transfer','crypto','marketplace','reservation'] as const;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url(${walletHero})` }} />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.16),transparent_60%),radial-gradient(circle_at_100%_100%,rgba(244,63,94,0.24),transparent_55%)] mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/30 via-slate-950/90 to-black/95" />
      </div>

      <WalletPageHeader user={u} overview={overviewData} />
      <WalletActionsRow onOpen={(id) => setPanel(id)} />

      <section className="px-4 mt-4">
        <SectionTitle>Cash Overview</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatCard label="Fiat"      value={(multiCurrency.fiat      ?? []).length} sub="balances" icon={Globe2} />
          <StatCard label="Crypto"    value={(multiCurrency.crypto    ?? []).length} sub="balances" icon={Coins} />
          <StatCard label="Rewards"   value={(multiCurrency.reward    ?? []).length} sub="balances" icon={Gift}  />
          <StatCard label="Gift cards" value={(multiCurrency.giftcard ?? []).length} sub="balances" icon={Ticket} />
          <StatCard label="Vouchers"  value={(multiCurrency.voucher   ?? []).length} sub="balances" icon={Package} />
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionTitle>Payment Networks</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {NETWORKS.map((n) => <StatCard key={n} label={n} value="Supported" sub="network" icon={Globe2} />)}
        </div>
      </section>

      {sections.map((section) => (
        <section key={section.title} className="px-4 mt-4">
          <SectionTitle>{section.title}</SectionTitle>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {section.items.map((item) => (
              <StatCard key={item.label} label={item.label} value={item.value} sub="module" icon={item.icon} />
            ))}
          </div>
        </section>
      ))}

      <section className="px-4 mt-4">
        <SectionTitle>Live Financial Graphs</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <StatCard label="Live spending"     value="Chart" sub="graph" icon={Activity}       />
          <StatCard label="Cashflow"          value="Chart" sub="graph" icon={ArrowLeftRight}  />
          <StatCard label="Income"            value="Chart" sub="graph" icon={ArrowUpFromLine} />
          <StatCard label="Expenses"          value="Chart" sub="graph" icon={ArrowDownToLine} />
          <StatCard label="Investment growth" value="Chart" sub="graph" icon={TrendingUp}      />
          <StatCard label="Savings"           value="Chart" sub="graph" icon={PiggyBank}       />
          <StatCard label="Net Worth"         value="Chart" sub="graph" icon={WalletIcon}      />
          <StatCard label="Crypto"            value="Chart" sub="graph" icon={Coins}           />
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionTitle>Multi-Currency Balances</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {CURRENCIES.map((currency) => (
            <div key={currency} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800/70">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[10px] uppercase tracking-widest text-slate-500">{currency}</p>
                <Globe2 className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-sm font-semibold text-emerald-300">0.00</p>
              <p className="text-[10px] text-slate-500 mt-1">fiat/crypto/reward</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionTitle>Checkout Hub</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button key={action.id} type="button" onClick={() => setPanel(action.id)} className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800/70 hover:border-cyan-400/60 transition text-left">
                <Icon className="w-5 h-5 text-cyan-300 mb-2" />
                <p className="text-[11px] font-semibold text-slate-100">{action.label}</p>
              </button>
            );
          })}
        </div>
      </section>

      <section className="px-4 mt-4">
        <SectionTitle>Transactions</SectionTitle>
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TX_FILTER_TABS.map((t) => (
            <TabButton key={t} active={txFilter === t} onClick={() => setTxFilter(t)}>
              {t === 'all' ? 'Tout' : t}
            </TabButton>
          ))}
        </div>

        <div ref={parentRef} className="rounded-2xl bg-slate-950/90 border border-slate-800/70 backdrop-blur-xl max-h-72 overflow-y-auto relative">
          {txLoading && <SkeletonList rows={6} />}
          {!txLoading && filteredTransactions.length === 0 && (
            <div className="p-4 text-[11px] text-slate-400">Pa gen tranzaksyon pou filtè sa.</div>
          )}
          {!txLoading && filteredTransactions.length > 0 && (
            <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
              {virtualizer.getVirtualItems().map((virtualRow) => {
                const tx = filteredTransactions[virtualRow.index];
                if (!tx) return null;
                return (
                  <div key={tx.id} style={{ position: 'absolute', top: virtualRow.start, left: 0, right: 0 }} className="flex items-center gap-3 px-4 py-3 border-b border-slate-900/80 last:border-b-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-sm">
                      {tx.icon ?? '💸'}
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-semibold text-slate-100">{tx.label}</p>
                      <p className="text-[10px] text-slate-500">{tx.sub} • {tx.date}</p>
                    </div>
                    <p className={cls('text-[11px] font-bold', tx.amount?.startsWith('+$') ? 'text-emerald-400' : 'text-rose-400')}>
                      {tx.amount}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <Suspense fallback={<SkeletonBlock className="h-32 mx-4 mt-4" />}>
        {panel === 'send'     && <SendPanel    onClose={() => setPanel(null)} onSend={(payload: Record<string, unknown>) => sendMutation.mutate({ ...payload, idempotencyKey: crypto.randomUUID() })} />}
        {panel === 'receive'  && <ReceivePanel onClose={() => setPanel(null)} user={u} onInvoice={() => setPanel('invoice')} />}
        {panel === 'deposit'  && <DepositPanel onClose={() => setPanel(null)} />}
        {panel === 'withdraw' && <WithdrawPanel onClose={() => setPanel(null)} />}
        {panel === 'pay'      && <PayPanel     onClose={() => setPanel(null)} />}
        {panel === 'invoice'  && <InvoicePanel onClose={() => setPanel(null)} />}
        {panel === 'exchange' && <ExchangePanel onClose={() => setPanel(null)} />}
      </Suspense>
    </div>
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function WalletPage() {
  return (
    <WalletErrorBoundary>
      <WalletPageInner />
    </WalletErrorBoundary>
  );
}