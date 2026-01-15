import { Asset, SystemSettings, AssetLog } from '../types';

const getBaseUrl = () => {
  // Check if running in browser
  if (typeof window !== 'undefined') {
    return `http://${window.location.hostname}:3008/api`;
  }
  return 'http://localhost:3008/api';
};

const API_BASE_URL = getBaseUrl();

// Helper to get current user Name or Username from localStorage
const getCurrentUsername = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.name || user.username || 'Unknown User';
    }
  } catch (e) {
    console.error('Error parsing user from localStorage', e);
  }
  return 'Guest';
};

export const api = {
  // --- Assets API ---
  getAssets: async (): Promise<Asset[]> => {
    const response = await fetch(`${API_BASE_URL}/assets`);
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to fetch assets');
    }
    return response.json();
  },

  getAssetById: async (id: string): Promise<Asset> => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`);
    if (!response.ok) throw new Error('Failed to fetch asset');
    return response.json();
  },

  createAsset: async (asset: Partial<Asset>): Promise<Asset> => {
    const response = await fetch(`${API_BASE_URL}/assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...asset, actionUser: getCurrentUsername() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to create asset');
    }
    return response.json();
  },

  updateAsset: async (id: string, asset: Partial<Asset>): Promise<Asset> => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...asset, actionUser: getCurrentUsername() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update asset');
    }
    return response.json();
  },

  deleteAsset: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/assets/${id}?user=${encodeURIComponent(getCurrentUsername())}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to delete asset');
    }
  },

  // --- Settings API ---
  getSettings: async (): Promise<SystemSettings> => {
    const response = await fetch(`${API_BASE_URL}/settings`);
    if (!response.ok) {
      // Fallback for first run if table is empty
      console.warn('Failed to fetch settings, using defaults');
      return {
        agencyName: 'ระบุหน่วยงาน',
        address: '',
        departments: [],
        commonOS: [],
        commonRam: [],
        commonStorage: [],
        commonCpu: [],
        commonLicenseTypes: [],
        commonAssetNames: [],
        commonBrands: [],
        commonModels: []
      };
    }
    return response.json();
  },

  updateSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    const response = await fetch(`${API_BASE_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...settings, actionUser: getCurrentUsername() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update settings');
    }
    return response.json();
  },

  // --- Logs API ---
  getLogs: async (): Promise<AssetLog[]> => {
    const response = await fetch(`${API_BASE_URL}/logs`);
    if (!response.ok) throw new Error('Failed to fetch logs');
    return response.json();
  },

  // --- Auth & Users API ---
  login: async (credentials: any) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }
    return response.json();
  },

  logout: async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: getCurrentUsername() })
      });
    } catch (e) {
      console.error('Logout logging failed', e);
    }
  },

  getUsers: async () => {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
  },

  createUser: async (user: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, actionUser: getCurrentUsername() })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create user');
    }
    return response.json();
  },

  updateUser: async (id: number, user: any) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, actionUser: getCurrentUsername() })
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (id: number) => {
    const response = await fetch(`${API_BASE_URL}/users/${id}?user=${encodeURIComponent(getCurrentUsername())}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },

  // --- Maintenance API ---
  getMaintenanceStats: async (year: string) => {
    const response = await fetch(`${API_BASE_URL}/maintenance/stats?year=${year}`);
    if (!response.ok) throw new Error('Failed to fetch maintenance stats');
    return response.json();
  },

  // --- File Upload API ---
  uploadImage: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch(`${API_BASE_URL}/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.imageUrl; // Return the relative URL
  }
};