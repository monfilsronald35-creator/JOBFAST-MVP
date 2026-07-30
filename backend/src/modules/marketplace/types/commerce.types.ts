export enum CouponType {
  PercentOff   = 'percent_off',
  AmountOff    = 'amount_off',
  FreeShipping = 'free_shipping',
  Cashback     = 'cashback',
  GiftCard     = 'gift_card',
}

export enum DisputeStatus {
  Open          = 'open',
  Investigating = 'investigating',
  Resolved      = 'resolved',
  Escalated     = 'escalated',
  Closed        = 'closed',
}

export type DisputeType = 'non_delivery' | 'wrong_item' | 'damaged' | 'fraud' | 'other';
export type ResolutionType = 'buyer_wins' | 'seller_wins' | 'partial_refund';

export enum AuctionStatus {
  Upcoming  = 'upcoming',
  Active    = 'active',
  Ended     = 'ended',
  Cancelled = 'cancelled',
  Sold      = 'sold',
}

export enum SubscriptionStatus {
  Trialing = 'trialing',
  Active   = 'active',
  PastDue  = 'past_due',
  Cancelled = 'cancelled',
  Expired  = 'expired',
}

export enum SubscriptionInterval {
  Monthly   = 'monthly',
  Quarterly = 'quarterly',
  Yearly    = 'yearly',
}

export interface Coupon {
  id:        string;
  code:      string;
  type:      CouponType;
  value:     number;
  usedCount: number;
  isActive:  boolean;
  validFrom: string;
  createdAt: string;
  sellerId?:        string;
  currency?:        string;
  minOrderAmount?:  number;
  maxDiscount?:     number;
  usageLimit?:      number;
  productIds?:      string[];
  validUntil?:      string;
}

export interface CouponUsage {
  id:              string;
  couponId:        string;
  userId:          string;
  discountApplied: number;
  usedAt:          string;
  orderId?:        string;
}

export interface Review {
  id:                  string;
  productId:           string;
  reviewerId:          string;
  sellerId:            string;
  rating:              number;
  body:                string;
  pros:                string[];
  cons:                string[];
  mediaUrls:           string[];
  isVerifiedPurchase:  boolean;
  isSpam:              boolean;
  helpfulCount:        number;
  createdAt:           string;
  updatedAt:           string;
  orderId?:            string;
  title?:              string;
}

export interface Favorite {
  id:         string;
  userId:     string;
  targetType: 'product' | 'store' | 'seller';
  targetId:   string;
  createdAt:  string;
}

export interface Dispute {
  id:           string;
  orderId:      string;
  buyerId:      string;
  sellerId:     string;
  type:         DisputeType;
  status:       DisputeStatus;
  buyerClaim:   string;
  evidenceBuyer: string[];
  evidenceSeller: string[];
  createdAt:    string;
  updatedAt:    string;
  mediatorId?:  string;
  sellerResponse?: string;
  aiAssessment?:   Record<string, unknown>;
  resolution?:     string;
  resolutionType?: ResolutionType;
  resolvedAt?:     string;
}

export interface Auction {
  id:           string;
  productId:    string;
  sellerId:     string;
  startPrice:   number;
  currentBid:   number;
  bidCount:     number;
  startAt:      string;
  endAt:        string;
  status:       AuctionStatus;
  currency:     string;
  createdAt:    string;
  reservePrice?: number;
  winnerId?:     string;
}

export interface AuctionBid {
  id:        string;
  auctionId: string;
  bidderId:  string;
  amount:    number;
  currency:  string;
  isWinning: boolean;
  isAutoBid: boolean;
  createdAt: string;
  maxAutoBid?: number;
}

export interface SubscriptionPlan {
  id:          string;
  sellerId:    string;
  name:        string;
  interval:    SubscriptionInterval;
  price:       number;
  currency:    string;
  trialDays:   number;
  features:    string[];
  isActive:    boolean;
  createdAt:   string;
  productId?:  string;
  description?: string;
}

export interface Subscription {
  id:                 string;
  planId:             string;
  subscriberId:       string;
  sellerId:           string;
  status:             SubscriptionStatus;
  currentPeriodStart: string;
  currentPeriodEnd:   string;
  createdAt:          string;
  updatedAt:          string;
  trialEnd?:          string;
  paymentRef?:        string;
  cancelAt?:          string;
  cancelledAt?:       string;
}

export interface DigitalDelivery {
  id:            string;
  orderId:       string;
  buyerId:       string;
  productId:     string;
  downloadUrl:   string;
  downloadCount: number;
  deliveredAt:   string;
  createdAt:     string;
  orderItemId?:  string;
  licenseKey?:   string;
  maxDownloads?: number;
  expiresAt?:    string;
}

export interface ShippingQuote {
  carrier:       string;
  serviceName:   string;
  price:         number;
  currency:      string;
  estimatedDays: number;
}
