import { Router }             from 'express';
import { requireAuth }        from '../../../core/middleware/auth.middleware.js';
import { WalletController }   from '../controllers/WalletController.js';
import { TransferController } from '../controllers/TransferController.js';
import { EscrowController }   from '../controllers/EscrowController.js';
import { CardController }     from '../controllers/CardController.js';
import { InvoiceController }  from '../controllers/InvoiceController.js';
import { RiskController }     from '../controllers/RiskController.js';

const router = Router();

// ——— Wallet ——————————————————————————————————————————————————————————————————
router.get('/',                     requireAuth, WalletController.getOrCreate);
router.get('/balances',             requireAuth, WalletController.getBalances);
router.get('/balances/:currency',   requireAuth, WalletController.getBalance);
router.get('/transactions',         requireAuth, WalletController.listTransactions);
router.get('/statement',            requireAuth, WalletController.getStatement);

// ——— Transfers & Cash ——————————————————————————————————————————————————————
router.post('/deposit',             requireAuth, TransferController.deposit);
router.post('/withdraw',            requireAuth, TransferController.withdraw);
router.post('/transfer',            requireAuth, TransferController.transfer);
router.post('/pay',                 requireAuth, TransferController.pay);

// ——— Currency Exchange ————————————————————————————————————————————————————
router.get('/exchange/quote',       requireAuth, TransferController.getQuote);
router.post('/exchange',            requireAuth, TransferController.exchange);

// ——— Escrow ————————————————————————————————————————————————————————————————
router.get('/escrow',               requireAuth, EscrowController.list);
router.post('/escrow',              requireAuth, EscrowController.lock);
router.get('/escrow/:id',           requireAuth, EscrowController.getById);
router.post('/escrow/:id/release',  requireAuth, EscrowController.release);
router.post('/escrow/:id/refund',   requireAuth, EscrowController.refund);
router.post('/escrow/:id/dispute',  requireAuth, EscrowController.dispute);

// ——— Virtual Cards ————————————————————————————————————————————————————————
router.get('/cards',                requireAuth, CardController.list);
router.post('/cards',               requireAuth, CardController.issue);
router.post('/cards/:id/block',     requireAuth, CardController.block);
router.post('/cards/:id/unblock',   requireAuth, CardController.unblock);
router.patch('/cards/:id/limit',    requireAuth, CardController.setLimit);

// ——— Invoices ————————————————————————————————————————————————————————————
router.get('/invoices',             requireAuth, InvoiceController.list);
router.post('/invoices',            requireAuth, InvoiceController.create);
router.post('/invoices/:id/send',   requireAuth, InvoiceController.send);
router.post('/invoices/:id/cancel', requireAuth, InvoiceController.cancel);

// ——— Risk / Admin (requireAuth + role check done in controller for now) ——
router.get('/admin/risk/flags',     requireAuth, RiskController.listFlags);
router.post('/admin/risk/score',    requireAuth, RiskController.scoreWallet);
router.post('/admin/risk/flag',     requireAuth, RiskController.flagManual);

export { router as walletRouter };
