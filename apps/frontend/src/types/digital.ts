export interface DigitalProduct {
  id: string;
  productId: string;
  fileSizeMb: number | null;
  version: string;
  downloadLimit: number;
  expiresInDays: number | null;
}

export interface DigitalAsset {
  id: string;
  digitalProductId: string;
  fileName: string;
  fileUrl: string;
  fileHash: string | null;
  createdAt: string;
}

export interface DownloadHistory {
  id: string;
  digitalAssetId: string;
  userId: string;
  ipAddress: string | null;
  downloadedAt: string;
}

export interface LicenseKey {
  id: string;
  digitalProductId: string;
  userId: string;
  licenseKey: string;
  isActive: boolean;
  maxActivations: number;
  currentActivations: number;
  expiresAt: string | null;
  createdAt: string;
}
