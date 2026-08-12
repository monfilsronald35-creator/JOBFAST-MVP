import type { TransactionStatus, RiskLevel } from './wallet';

export const ESCROW_STATUSES = [
  'pending',
  'held',
  'released',
  'partially_released',
  'disputed',
  'refunded',
  'partially_refunded',
  'cancelled',
  'expired',
] as const;

export type EscrowStatus = typeof ESCROW_STATUSES[number];

export const ESCROW_ACTIONS = [
  'hold',
  'release',
  'refund',
  'cancel',
  'partial_release',
  'partial_refund',
] as const;

export type EscrowAction = typeof ESCROW_ACTIONS[number];

export const ESCROW_DISPUTE_STATUSES = [
  'open',
  'investigating',
  'waiting_documents',
  'resolved_buyer',
  'resolved_seller',
  'closed',
] as const;

export type EscrowDisputeStatus = typeof ESCROW_DISPUTE_STATUSES[number];

export const ESCROW_REFERENCE_TYPES = [
  'job',
  'order',
  'booking',
  'invoice',
  'subscription',
] as const;

export type EscrowReferenceType = typeof ESCROW_REFERENCE_TYPES[number];

// ---- Entity interfaces ----

export interface WalletTransfer {
  id: string;
  senderWalletId: string | null;
  receiverWalletId: string | null;
  amount: number;
  feeAmount: number;
  netAmount: number;
  currencyId: string | null;
  currencyCode: string;
  exchangeRate: number;
  status: TransactionStatus;
  referenceId: string | null;
  externalReference: string | null;
  idempotencyKey: string | null;
  fraudScore: number;
  amlScore: number;
  riskLevel: RiskLevel;
  note: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EscrowAccount {
  id: string;
  buyerWalletId: string;
  sellerWalletId: string;
  amount: number;
  platformFee: number;
  processorFee: number;
  taxAmount: number;
  sellerAmount: number;
  buyerAmount: number;
  currencyId: string | null;
  currencyCode: string;
  status: EscrowStatus;
  referenceType: EscrowReferenceType | null;
  referenceId: string | null;
  autoReleaseAt: string | null;
  metadata: Record<string, unknown>;
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EscrowTransaction {
  id: string;
  escrowId: string;
  transactionId: string | null;
  action: EscrowAction;
  amount: number;
  currencyId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EscrowDispute {
  id: string;
  escrowId: string;
  raisedBy: string;
  assignedTo: string | null;
  priority: string;
  reason: string;
  status: EscrowDisputeStatus;
  resolutionType: string | null;
  resolutionNotes: string | null;
  attachments: unknown[];
  metadata: Record<string, unknown>;
  closedAt: string | null;
  closedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowReleaseHistory {
  id: string;
  escrowId: string;
  transactionId: string | null;
  releasedTo: string;
  amount: number;
  currencyId: string | null;
  releasedBy: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface EscrowEvent {
  id: string;
  escrowId: string;
  eventType: string;
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface EscrowLog {
  id: string;
  escrowId: string;
  action: string;
  actorId: string | null;
  notes: string | null;
  createdAt: string;
}

export interface TransferLog {
  id: string;
  transferId: string;
  status: string;
  responsePayload: Record<string, unknown>;
  createdAt: string;
}

export interface TransferFailure {
  id: string;
  transferId: string;
  errorCode: string | null;
  errorMessage: string;
  retryCount: number;
  createdAt: string;
}

export interface TransferRetryQueueEntry {
  id: string;
  transferId: string;
  nextRetryAt: string;
  status: string;
  createdAt: string;
}
