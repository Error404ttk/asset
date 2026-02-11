import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Asset, SystemSettings } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

// Default settings if API fails or first load
const DEFAULT_SETTINGS: SystemSettings = {
  agencyName: 'หน่วยงานราชการ',
  address: '',
  departments: ['สำนักปลัด', 'กองคลัง', 'กองช่าง'],
  commonOS: ['Windows 11', 'Windows 10'],
  commonRam: ['8GB', '16GB'],
  commonStorage: ['256GB SSD', '512GB SSD'],
  commonCpu: ['Intel Core i5', 'Intel Core i7'],
  commonLicenseTypes: ['มีลิขสิทธิ์', 'ไม่มีลิขสิทธิ์'],
  commonAssetNames: [],
  commonBrands: [],
  commonModels: [],
  commonAssetTypes: ['คอมพิวเตอร์', 'จอภาพ', 'เครื่องพิมพ์', 'UPS', 'อุปกรณ์เครือข่าย', 'อื่นๆ']
};

interface AssetContextType {
  assets: Asset[];
  settings: SystemSettings;
  isLoading: boolean;
  error: string | null;
  addAsset: (asset: Asset) => Promise<void>;
  updateAsset: (id: string, updatedAsset: Partial<Asset>) => Promise<void>;
  deleteAsset: (id: string) => Promise<void>;
  getAssetById: (id: string) => Asset | undefined;
  updateSettings: (newSettings: Partial<SystemSettings>) => Promise<void>;
  refreshData: () => Promise<void>;
  addAssetsBulk: (assets: Asset[]) => Promise<void>;
  deleteAssetsBulk: (ids: string[]) => Promise<void>;
}

const AssetContext = createContext<AssetContextType | undefined>(undefined);

export const AssetProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Parallel fetch assets and settings
      const [fetchedAssets, fetchedSettings] = await Promise.all([
        api.getAssets().catch(err => {
          console.error("Failed to fetch assets:", err);
          return []; // Return empty on error to keep app running
        }),
        api.getSettings().catch(err => {
          console.error("Failed to fetch settings:", err);
          return DEFAULT_SETTINGS;
        })
      ]);

      setAssets(fetchedAssets);
      setSettings(fetchedSettings);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'เกิดข้อผิดพลาดในการโหลดข้อมูล';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  // Initial Load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addAsset = async (asset: Asset) => {
    try {
      const { id, ...assetData } = asset; // Remove ID to let DB generate it
      const newAsset = await api.createAsset(assetData);
      setAssets(prev => [newAsset, ...prev]);
    } catch (err) {
      console.error(err);
      throw err; // Let component handle UI error
    }
  };

  const addAssetsBulk = async (newAssets: Asset[]) => {
    try {
      await api.createAssetsBulk(newAssets);
      // For bulk, refreshing from server is safer/easier than merging state manually
      // because we don't get all the FULL objects back easily without huge payload
      // But we can optimistically add them if we trust the input.
      // Given the logic, let's refresh.
      await fetchData();
      showToast(`Imported ${newAssets.length} assets successfully`, 'success');
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateAsset = async (id: string, updatedAsset: Partial<Asset>) => {
    try {
      const result = await api.updateAsset(id, updatedAsset);
      setAssets(prev => prev.map(a => a.id === id ? result : a));
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const deleteAsset = async (id: string) => {
    try {
      await api.deleteAsset(id);
      setAssets(prev => prev.filter(a => a.id !== id));
      showToast('ลบข้อมูลเรียบร้อยแล้ว', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ลบข้อมูลไม่สำเร็จ';
      showToast(msg, 'error');
    }
  };

  const deleteAssetsBulk = async (ids: string[]) => {
    try {
      await api.deleteAssetsBulk(ids);
      setAssets(prev => prev.filter(a => !ids.includes(a.id)));
      showToast(`ลบข้อมูล ${ids.length} รายการเรียบร้อยแล้ว`, 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'ลบข้อมูลไม่สำเร็จ';
      showToast(msg, 'error');
      fetchData();
    }
  };

  const getAssetById = (id: string) => {
    return assets.find(a => String(a.id) === String(id));
  };

  const updateSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      const merged = { ...settings, ...newSettings };
      const result = await api.updateSettings(merged);
      setSettings(result);
      showToast('บันทึกการตั้งค่าเรียบร้อย', 'success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'บันทึกการตั้งค่าไม่สำเร็จ';
      showToast(msg, 'error');
    }
  };

  return (
    <AssetContext.Provider value={{
      assets,
      settings,
      isLoading,
      error,
      addAsset,
      updateAsset,
      deleteAsset,
      getAssetById,
      updateSettings,
      refreshData: fetchData,
      addAssetsBulk,
      deleteAssetsBulk
    }}>
      {children}
    </AssetContext.Provider>
  );
};

export const useAssets = () => {
  const context = useContext(AssetContext);
  if (context === undefined) {
    throw new Error('useAssets must be used within an AssetProvider');
  }
  return context;
};