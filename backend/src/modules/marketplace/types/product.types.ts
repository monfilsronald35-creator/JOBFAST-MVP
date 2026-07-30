export enum ProductType {
  Physical     = 'physical',
  Digital      = 'digital',
  Service      = 'service',
  Event        = 'event',
  Ticket       = 'ticket',
  Subscription = 'subscription',
  Rental       = 'rental',
  Auction      = 'auction',
}

export enum ProductStatus {
  Draft    = 'draft',
  Review   = 'review',
  Active   = 'active',
  Paused   = 'paused',
  Archived = 'archived',
  Rejected = 'rejected',
}

export enum StoreType   { Individual = 'individual', Business = 'business' }
export enum StoreStatus { Active = 'active', Suspended = 'suspended', Closed = 'closed' }

export interface Store {
  id:          string;
  ownerId:     string;
  name:        string;
  slug:        string;
  type:        StoreType;
  status:      StoreStatus;
  rating:      number;
  reviewCount: number;
  verified:    boolean;
  createdAt:   string;
  updatedAt:   string;
  description?: string;
  logoUrl?:    string;
  bannerUrl?:  string;
  country?:    string;
  city?:       string;
  address?:    string;
  lat?:        number;
  lng?:        number;
}

export interface Product {
  id:                string;
  sellerId:          string;
  title:             string;
  description:       string;
  type:              ProductType;
  status:            ProductStatus;
  category:          string;
  tags:              string[];
  currency:          string;
  basePrice:         number;
  isPriceNegotiable: boolean;
  languages:         string[];
  isInternational:   boolean;
  isFeatured:        boolean;
  isSponsored:       boolean;
  viewsCount:        number;
  ordersCount:       number;
  rating:            number;
  reviewCount:       number;
  createdAt:         string;
  updatedAt:         string;
  storeId?:          string;
  subcategory?:      string;
  country?:          string;
  city?:             string;
  lat?:              number;
  lng?:              number;
  radiusKm?:         number;
}

export interface ProductVariant {
  id:            string;
  productId:     string;
  name:          string;
  attributes:    Record<string, string>;
  priceModifier: number;
  stockQty:      number;
  isAvailable:   boolean;
  createdAt:     string;
  sku?:          string;
}

export interface ProductMedia {
  id:        string;
  productId: string;
  type:      'image' | 'video' | 'document';
  url:       string;
  sortOrder: number;
  createdAt: string;
  thumbnailUrl?: string;
  caption?:     string;
}

export interface Warehouse {
  id:        string;
  ownerId:   string;
  name:      string;
  country:   string;
  city:      string;
  isActive:  boolean;
  createdAt: string;
  address?:  string;
  lat?:      number;
  lng?:      number;
  capacity?: number;
}

export interface InventoryRecord {
  id:           string;
  productId:    string;
  qtyAvailable: number;
  qtyReserved:  number;
  qtySold:      number;
  serialNumbers: string[];
  updatedAt:    string;
  variantId?:   string;
  warehouseId?: string;
  barcode?:     string;
  qrCode?:      string;
  expirationDate?: string;
  batchNumber?: string;
  supplierId?:  string;
}

export interface ProductSearchQuery {
  type?:          ProductType;
  category?:      string;
  country?:       string;
  city?:          string;
  minPrice?:      number;
  maxPrice?:      number;
  currency?:      string;
  tags?:          string[];
  isInternational?: boolean;
  isFeatured?:    boolean;
  lat?:           number;
  lng?:           number;
  radiusKm?:      number;
  keyword?:       string;
  sellerId?:      string;
  storeId?:       string;
  limit?:         number;
  cursor?:        string;
}
