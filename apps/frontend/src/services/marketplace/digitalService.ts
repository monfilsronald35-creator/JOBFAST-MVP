import { supabase } from '../../lib/supabase';
import type {
  DigitalProduct,
  DigitalAsset,
  DownloadHistory,
  LicenseKey,
} from '../../types/digital';

// Actual file download + download_history insertion must go through the
// backend/Edge Functions to: enforce download_limit, generate signed URLs,
// and record the download atomically.
// License key activation (incrementing current_activations) is backend-only.

// ---- Row types (snake_case) ----

type DigitalProductRow = {
  id: string;
  product_id: string;
  file_size_mb: number | null;
  version: string;
  download_limit: number;
  expires_in_days: number | null;
};

type DigitalAssetRow = {
  id: string;
  digital_product_id: string;
  file_name: string;
  file_url: string;
  file_hash: string | null;
  created_at: string;
};

type DownloadHistoryRow = {
  id: string;
  digital_asset_id: string;
  user_id: string;
  ip_address: string | null;
  downloaded_at: string;
};

type LicenseKeyRow = {
  id: string;
  digital_product_id: string;
  user_id: string;
  license_key: string;
  is_active: boolean;
  max_activations: number;
  current_activations: number;
  expires_at: string | null;
  created_at: string;
};

// ---- Mappers ----

function mapDigitalProduct(r: DigitalProductRow): DigitalProduct {
  return {
    id: r.id,
    productId: r.product_id,
    fileSizeMb: r.file_size_mb,
    version: r.version,
    downloadLimit: r.download_limit,
    expiresInDays: r.expires_in_days,
  };
}

function mapDigitalAsset(r: DigitalAssetRow): DigitalAsset {
  return {
    id: r.id,
    digitalProductId: r.digital_product_id,
    fileName: r.file_name,
    fileUrl: r.file_url,
    fileHash: r.file_hash,
    createdAt: r.created_at,
  };
}

function mapDownloadHistory(r: DownloadHistoryRow): DownloadHistory {
  return {
    id: r.id,
    digitalAssetId: r.digital_asset_id,
    userId: r.user_id,
    ipAddress: r.ip_address,
    downloadedAt: r.downloaded_at,
  };
}

function mapLicenseKey(r: LicenseKeyRow): LicenseKey {
  return {
    id: r.id,
    digitalProductId: r.digital_product_id,
    userId: r.user_id,
    licenseKey: r.license_key,
    isActive: r.is_active,
    maxActivations: r.max_activations,
    currentActivations: r.current_activations,
    expiresAt: r.expires_at,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Digital Products
// ================================================================

export async function getDigitalProduct(
  productId: string
): Promise<DigitalProduct | null> {
  const { data, error } = await supabase
    .from('digital_products')
    .select('*')
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDigitalProduct(data as DigitalProductRow) : null;
}

// ================================================================
// === Digital Assets
// ================================================================

export async function getDigitalAssets(
  digitalProductId: string
): Promise<DigitalAsset[]> {
  const { data, error } = await supabase
    .from('digital_assets')
    .select('*')
    .eq('digital_product_id', digitalProductId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as DigitalAssetRow[]).map(mapDigitalAsset);
}

// ================================================================
// === Download History
// ================================================================

export async function getMyDownloadHistory(
  assetId?: string
): Promise<DownloadHistory[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('download_history')
    .select('*')
    .eq('user_id', user.id);

  if (assetId) q = q.eq('digital_asset_id', assetId);

  const { data, error } = await q.order('downloaded_at', { ascending: false });
  if (error) throw error;
  return (data as DownloadHistoryRow[]).map(mapDownloadHistory);
}

export async function getDownloadCount(
  assetId: string
): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count, error } = await supabase
    .from('download_history')
    .select('*', { count: 'exact', head: true })
    .eq('digital_asset_id', assetId)
    .eq('user_id', user.id);
  if (error) throw error;
  return count ?? 0;
}

// ================================================================
// === License Keys
// ================================================================

export async function getMyLicenseKeys(
  digitalProductId?: string
): Promise<LicenseKey[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  let q = supabase
    .from('license_keys')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  if (digitalProductId) q = q.eq('digital_product_id', digitalProductId);

  const { data, error } = await q.order('created_at', { ascending: false });
  if (error) throw error;
  return (data as LicenseKeyRow[]).map(mapLicenseKey);
}

export async function getLicenseKeyById(
  keyId: string
): Promise<LicenseKey | null> {
  const { data, error } = await supabase
    .from('license_keys')
    .select('*')
    .eq('id', keyId)
    .maybeSingle();
  if (error) throw error;
  return data ? mapLicenseKey(data as LicenseKeyRow) : null;
}
