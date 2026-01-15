import React from 'react';

export enum AssetStatus {
  NORMAL = 'NORMAL',
  BROKEN = 'BROKEN',
  REPAIRING = 'REPAIRING',
  SOLD = 'SOLD',
  WITHDRAWN = 'WITHDRAWN'
}

export const AssetStatusLabels: Record<AssetStatus, string> = {
  [AssetStatus.NORMAL]: 'ใช้งานปกติ',
  [AssetStatus.BROKEN]: 'ชำรุด',
  [AssetStatus.REPAIRING]: 'ซ่อมบำรุง',
  [AssetStatus.SOLD]: 'จำหน่ายแล้ว',
  [AssetStatus.WITHDRAWN]: 'เบิกแล้ว'
};

export enum AssetType {
  COMPUTER = 'COMPUTER',
  MONITOR = 'MONITOR',
  PRINTER = 'PRINTER',
  UPS = 'UPS',
  NETWORK = 'NETWORK',
  OTHER = 'OTHER'
}

export const AssetTypeLabels: Record<AssetType, string> = {
  [AssetType.COMPUTER]: 'คอมพิวเตอร์',
  [AssetType.MONITOR]: 'จอภาพ',
  [AssetType.PRINTER]: 'เครื่องพิมพ์',
  [AssetType.UPS]: 'UPS',
  [AssetType.NETWORK]: 'อุปกรณ์เครือข่าย',
  [AssetType.OTHER]: 'อื่นๆ'
};

export interface MaintenanceRecord {
  id: string;
  date: string;
  description: string;
  cost: number;
  performer: string; // User or Vendor
  resultingStatus?: AssetStatus; // Status of the asset after this maintenance
}

export interface AssetLog {
  id: string;
  assetId: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  brand: string;
  model: string;
  serialNumber: string;
  assetCode: string;
  acquiredDate: string;
  warrantyExpireDate: string;
  status: AssetStatus;
  fiscalYear?: string; // Year of survey/record
  imageUrl?: string;

  // Computer Specifics
  cpu?: string;
  ram?: string;
  storage?: string;
  gpu?: string;
  os?: string;
  productKey?: string;
  ipAddress?: string;
  macAddress?: string;
  hostname?: string;
  licenseType?: string;

  // Other Specs (Added for flexibility)
  displaySize?: string; // For Monitor
  wattage?: string; // For UPS/PSU
  printType?: string; // For Printer
  note?: string;

  // Location & User
  department: string;
  location: string;
  currentUser: string;

  // Maintenance
  maintenanceHistory?: MaintenanceRecord[];

  // Replacement & Disposal Logic
  replacedAssetId?: string; // ID of the old asset this one replaced
  replacementAssetId?: string; // ID of the new asset that replaced this one
  disposalId?: string; // Document ID for disposal (เลขที่จำหน่าย)
  disposalDate?: string;
}

export interface SystemSettings {
  agencyName: string;
  address: string;
  departments: string[];
  // Technical Standard Options (For Autocomplete)
  commonOS: string[];
  commonRam: string[];
  commonStorage: string[];
  commonCpu: string[];
  commonLicenseTypes: string[];
}

export interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: string;
  colorClass: string;
}