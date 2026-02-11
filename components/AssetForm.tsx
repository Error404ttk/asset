
import React, { useState, useEffect } from 'react';
import { Asset, AssetStatus, AssetStatusLabels, AssetType, AssetTypeLabels, SystemSettings, MaintenanceRecord, BudgetType, SoftwareCategory } from '../types';
import SuccessModal from './SuccessModal';
import { Save, X, Upload, Laptop, MapPin, FileText, Wrench, Plus, Trash2, Calendar, User, AlertTriangle, Monitor, Printer, Server, Wifi, Hash, RotateCcw, BadgeCheck, RefreshCcw, FileMinus, Maximize, Shield, Key } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import Combobox from './ui/Combobox';
import Select from './ui/Select';
import ImageModal from './ui/ImageModal';


// Extended type for UI state handling
type ExtendedMaintenanceRecord = MaintenanceRecord & {
  _uiStatus?: 'new' | 'deleted' | 'existing'
};

const AssetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addAsset, updateAsset, getAssetById, settings, assets, isLoading } = useAssets(); // Use settings & assets from Context
  const { showToast } = useToast(); // Use Toast Context
  const isEditMode = !!id;

  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'location' | 'maintenance'>('general');

  // Dynamic Fiscal Years
  const currentYearBE = new Date().getFullYear() + 543;
  // Generate range: Current Year + 1 (for planning) down to 5 years back
  const fiscalYears = Array.from({ length: 6 }, (_, i) => currentYearBE + 1 - i);

  // Temporary ID State
  const [isTempAssetCode, setIsTempAssetCode] = useState(false);

  // Replacement State
  const [isReplacement, setIsReplacement] = useState(false);
  const [selectedOldAssetId, setSelectedOldAssetId] = useState('');
  const [disposalDocId, setDisposalDocId] = useState('');
  const [disposalDate, setDisposalDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSuccess, setIsSuccess] = useState(false);

  const DEFAULT_FORM_DATA: Partial<Asset> = {
    name: '',
    assetCode: '',
    fiscalYear: currentYearBE.toString(),
    type: '' as unknown as AssetType,
    status: AssetStatus.NORMAL,
    brand: '',
    model: '',
    rackUnit: '',
    serialNumber: '',
    currentUser: '',
    department: settings.departments[0] || 'สำนักปลัด',
    location: '',
    acquiredDate: '',
    warrantyExpireDate: '',
    cpu: '',
    ram: '',
    storage: '',
    gpu: '',
    os: '',
    productKey: '',
    macAddress: '',
    ipAddress: '',
    subtype: '',
    licenseType: '',
    imageUrl: '',
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>(DEFAULT_FORM_DATA);

  // Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  // Maintenance State (Extended with UI status)
  const [maintenanceRecords, setMaintenanceRecords] = useState<ExtendedMaintenanceRecord[]>([]);
  const [showAddMaintenance, setShowAddMaintenance] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // New Maintenance Form State
  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceRecord>>({
    date: new Date().toISOString().split('T')[0],
    description: '',
    cost: 0,
    performer: '',
    resultingStatus: AssetStatus.NORMAL
  });

  // Load Data if Edit Mode
  useEffect(() => {
    if (isLoading) return; // Wait for data to load

    if (isEditMode && id) {
      const asset = getAssetById(id);
      if (asset) {
        // Merge with defaults to ensure no field is undefined (fixes Uncontrolled Input warning)
        setFormData({ ...DEFAULT_FORM_DATA, ...asset });
        // Check if existing asset has a TEMP code
        if (asset.assetCode.startsWith('TEMP-')) {
          setIsTempAssetCode(true);
        }
        // Check replacement info
        if (asset.replacedAssetId) {
          setIsReplacement(true);
          setSelectedOldAssetId(asset.replacedAssetId);
        }

        // Initialize records with 'existing' status
        if (asset.maintenanceHistory) {
          setMaintenanceRecords(asset.maintenanceHistory.map(r => ({ ...r, _uiStatus: 'existing' })));
        }
      } else {
        showToast('ไม่พบข้อมูลครุภัณฑ์', 'error');
        navigate('/assets');
      }
    }
  }, [isEditMode, id, getAssetById, navigate, showToast, isLoading]);

  // Sync newMaintenance resultingStatus with current status when opening the form
  useEffect(() => {
    if (showAddMaintenance) {
      setNewMaintenance(prev => ({ ...prev, resultingStatus: formData.status }));
    }
  }, [showAddMaintenance, formData.status]);

  // Pre-fill asset types from settings or defaults
  // Priority: 1. Settings from DB (if user customized) 2. Thai Enum Labels 3. English Enum
  const assetTypeOptions = (settings.commonAssetTypes && settings.commonAssetTypes.length > 0)
    ? (settings.commonAssetTypes.includes('Server') || settings.commonAssetTypes.includes('เครื่องแม่ข่าย')
      ? settings.commonAssetTypes
      : [...settings.commonAssetTypes, 'Server'])
    : Object.values(AssetTypeLabels);

  // Debugging: Log options to console to verify
  useEffect(() => {
    // Console log disabled for production cleaniness, but good to know data flow
    // console.log('Current Asset Type Options:', assetTypeOptions);
  }, [assetTypeOptions]);

  const handleTempIdToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    setIsTempAssetCode(isChecked);

    if (isChecked) {
      // Generate a unique temporary ID: TEMP-[YY]-[Random4Digits]
      const shortYear = formData.fiscalYear ? formData.fiscalYear.slice(-2) : 'XX';
      const randomId = Math.floor(1000 + Math.random() * 9000);
      setFormData(prev => ({ ...prev, assetCode: `TEMP-${shortYear}-${randomId}` }));
    } else {
      // Clear it to let user type, or revert to empty
      if (formData.assetCode?.startsWith('TEMP-')) {
        setFormData(prev => ({ ...prev, assetCode: '' }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic Sanitization
    const trimmedAssetCode = formData.assetCode?.trim();
    const trimmedName = formData.name?.trim();

    if (!formData.fiscalYear) {
      showToast("กรุณาระบุปีงบประมาณที่สำรวจ", 'warning');
      return;
    }
    if (!trimmedAssetCode || !trimmedName) {
      showToast("กรุณากรอกชื่อครุภัณฑ์และเลขครุภัณฑ์ให้ครบถ้วน", 'warning');
      return;
    }

    // Validation for Replacement logic
    if (isReplacement && !selectedOldAssetId) {
      showToast("กรุณาเลือกครุภัณฑ์เดิมที่ต้องการทดแทน", 'warning');
      setActiveTab('general');
      return;
    }
    // Only require disposal ID if it's a new entry (not edit mode with existing link) to prevent overwriting/requiring it again if not changed
    if (isReplacement && !isEditMode && !disposalDocId) {
      showToast("กรุณาระบุเลขที่เอกสารจำหน่ายของเครื่องเดิม", 'warning');
      setActiveTab('general');
      return;
    }

    // Filter out deleted records and strip UI status before saving
    const finalMaintenanceRecords: MaintenanceRecord[] = maintenanceRecords
      .filter(r => r._uiStatus !== 'deleted')
      .map(({ _uiStatus, ...rest }) => rest);

    // Prepare New Asset Object (ID will be generated if new)
    const newAssetId = isEditMode && id ? id : Date.now().toString();

    try {
      // 0. Handle Image Upload if selected
      let finalImageUrl = formData.imageUrl;
      if (selectedImageFile) {
        finalImageUrl = await api.uploadImage(selectedImageFile);
      }
      // 1. Handle Old Asset Update (If Replacement is Active)
      if (isReplacement && selectedOldAssetId) {
        const oldAsset = getAssetById(selectedOldAssetId);
        // Only update if it's not already linked to this asset (to avoid double updates in edit mode)
        if (oldAsset && oldAsset.replacementAssetId !== newAssetId) {
          await updateAsset(selectedOldAssetId, {
            status: AssetStatus.SOLD,
            disposalId: disposalDocId.trim(),
            disposalDate: disposalDate,
            replacementAssetId: newAssetId,
            note: (oldAsset.note ? oldAsset.note + '\n' : '') + `[ระบบ] จำหน่ายออกเพื่อทดแทนด้วยเครื่องใหม่ ID: ${trimmedAssetCode || 'N/A'} `
          });
        }
      }

      // 2. Save Current Asset
      const assetDataToSave: Asset = {
        ...formData as Asset,
        imageUrl: finalImageUrl,
        id: newAssetId,
        assetCode: trimmedAssetCode,
        name: trimmedName,
        maintenanceHistory: finalMaintenanceRecords,
        replacedAssetId: isReplacement ? selectedOldAssetId : undefined
      };

      if (isEditMode && id) {
        await updateAsset(id, assetDataToSave);
      } else {
        await addAsset(assetDataToSave);
      }

      // Success Animation
      setIsSuccess(true);
      setTimeout(() => {
        navigate('/assets');
      }, 2000); // Wait for animation
    } catch (error) {
      console.error('Error saving asset:', error);
      showToast('เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง', 'error');
    }
  };

  const handleAddMaintenance = () => {
    if (!newMaintenance.date || !newMaintenance.description) {
      showToast("กรุณากรอกวันที่และรายละเอียดการซ่อม", 'warning');
      return;
    }

    const record: ExtendedMaintenanceRecord = {
      id: Date.now().toString(),
      date: newMaintenance.date || '',
      description: newMaintenance.description.trim() || '',
      cost: Number(newMaintenance.cost) || 0,
      performer: newMaintenance.performer?.trim() || '',
      resultingStatus: newMaintenance.resultingStatus,
      _uiStatus: 'new' // Mark as new
    };

    const updatedRecords = [record, ...maintenanceRecords];
    setMaintenanceRecords(updatedRecords);

    // Auto-update Asset Status Logic
    if (record.resultingStatus && record.resultingStatus !== formData.status) {
      setFormData(prev => ({ ...prev, status: record.resultingStatus! }));
      showToast(`ปรับสถานะครุภัณฑ์เป็น "${record.resultingStatus}" ตามรายการซ่อม`, 'info');
    }

    setNewMaintenance({
      date: new Date().toISOString().split('T')[0],
      description: '',
      cost: 0,
      performer: '',
      resultingStatus: record.resultingStatus
    });
    setShowAddMaintenance(false);
  };

  const confirmDeleteMaintenance = () => {
    if (!deleteId) return;

    const targetRecord = maintenanceRecords.find(r => r.id === deleteId);
    let updatedRecords: ExtendedMaintenanceRecord[];

    if (targetRecord?._uiStatus === 'new') {
      updatedRecords = maintenanceRecords.filter(r => r.id !== deleteId);
    } else {
      updatedRecords = maintenanceRecords.map(r =>
        r.id === deleteId ? { ...r, _uiStatus: 'deleted' } : r
      );
    }

    setMaintenanceRecords(updatedRecords);

    const activeRecords = updatedRecords.filter(r => r._uiStatus !== 'deleted');
    const sortedHistory = [...activeRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const latestRecord = sortedHistory[0];

    if (latestRecord && latestRecord.resultingStatus) {
      setFormData(prev => ({ ...prev, status: latestRecord.resultingStatus! }));
    }

    setDeleteId(null);
    showToast('ลบรายการซ่อมบำรุงแล้ว', 'info');
  };

  const restoreMaintenance = (id: string) => {
    const updatedRecords = maintenanceRecords.map(r =>
      r.id === id ? { ...r, _uiStatus: 'existing' as const } : r
    );
    setMaintenanceRecords(updatedRecords);
    showToast('กู้คืนรายการซ่อมบำรุงแล้ว', 'info');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 25 * 1024 * 1024) {
        showToast('ขนาดไฟล์ต้องไม่เกิน 25MB', 'warning');
        return;
      }

      setSelectedImageFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewImageUrl(objectUrl);

      // Clear previous error or state implications if any
    }
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (previewImageUrl) URL.revokeObjectURL(previewImageUrl);
    };
  }, [previewImageUrl]);

  // Helper to check if type matches "Computer" logic (Enum or Thai Label)
  const isComputerType = (type: string | undefined) => {
    if (!type) return false;
    const t = type.toString().toLowerCase();
    // Check against Enum/Labels
    if (t === AssetType.COMPUTER.toLowerCase() || t === AssetTypeLabels[AssetType.COMPUTER].toLowerCase()) return true;

    // Check against common keywords for dynamic types (Thai/English)
    const computerKeywords = ['computer', 'pc', 'notebook', 'laptop', 'server', 'workstation', 'all-in-one', 'คอม', 'โน้ตบุ๊ก', 'แล็ปท็อป', 'เซิร์ฟเวอร์'];
    return computerKeywords.some(keyword => t.includes(keyword));
  };

  // Helper to get icon for specs tab
  const getSpecsIcon = () => {
    // Simple check based on string inclusion for flexibility
    const typeStr = (formData.type || '').toString();
    if (typeStr === AssetType.COMPUTER || typeStr === AssetTypeLabels[AssetType.COMPUTER]) return <Laptop size={18} />;
    if (typeStr === AssetType.MONITOR || typeStr === AssetTypeLabels[AssetType.MONITOR]) return <Monitor size={18} />;
    if (typeStr === AssetType.PRINTER || typeStr === AssetTypeLabels[AssetType.PRINTER]) return <Printer size={18} />;
    if (typeStr === AssetType.NETWORK || typeStr === AssetTypeLabels[AssetType.NETWORK]) return <Wifi size={18} />;
    if (typeStr === AssetType.UPS || typeStr === AssetTypeLabels[AssetType.UPS]) return <Server size={18} />;
    if (typeStr === AssetType.SOFTWARE || typeStr === AssetTypeLabels[AssetType.SOFTWARE]) return <Shield size={18} />;
    return <FileText size={18} />;
  };

  // Filter available assets for replacement (Exclude current, exclude already disposed/replaced, unless it's the one linked to this asset)
  const availableOldAssets = assets.filter(a => {
    // Cannot select itself
    if (a.id === id) return false;

    // If this asset is the one currently linked as replaced by this asset (in edit mode), allow it even if status is SOLD
    // Check against the initial data's replacedAssetId if available, or the current state if not strictly bound to initial
    // But to be safe, if a.replacementAssetId points to THIS asset (id), it's valid.
    if (id && a.replacementAssetId === id) return true;

    // Otherwise, exclude if SOLD, WITHDRAWN, or Already Replaced by someone else
    if (a.status === AssetStatus.SOLD || a.status === AssetStatus.WITHDRAWN) return false;
    if (a.replacementAssetId) return false;

    return true;
  });
  const selectedOldAssetInfo = assets.find(a => a.id === selectedOldAssetId);

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative">

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-scale-in relative">
            <button
              onClick={() => setDeleteId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>
            <div className="flex items-center gap-4 text-red-600 mb-4">
              <div className="bg-red-100 p-3 rounded-full">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-xl font-bold">ยืนยันการลบรายการ</h3>
            </div>
            <p className="text-slate-600 mb-6">
              คุณแน่ใจหรือไม่ที่จะลบประวัติการซ่อมบำรุงนี้? <br />
              <span className="text-sm text-slate-500">
                (รายการที่บันทึกแล้วจะถูกขีดฆ่าก่อนกดบันทึกเพื่อยืนยันการลบถาวร)
              </span>
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmDeleteMaintenance}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg font-medium shadow-sm"
              >
                ยืนยันการลบ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Datalists for Autocomplete from Settings */}
      <datalist id="cpu-options">
        {(settings.commonCpu || []).map((cpu, i) => <option key={i} value={cpu} />)}
      </datalist>
      <datalist id="ram-options">
        {(settings.commonRam || []).map((ram, i) => <option key={i} value={ram} />)}
      </datalist>
      <datalist id="os-options">
        {(settings.commonOS || []).map((os, i) => <option key={i} value={os} />)}
      </datalist>
      <datalist id="storage-options">
        {(settings.commonStorage || []).map((st, i) => <option key={i} value={st} />)}
      </datalist>
      <datalist id="license-options">
        {(settings.commonLicenseTypes || []).map((lt, i) => <option key={i} value={lt} />)}
      </datalist>


      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditMode ? 'รายละเอียด/แก้ไขครุภัณฑ์' : 'เพิ่มครุภัณฑ์ใหม่'}
          </h1>
          <p className="text-slate-500">
            {isEditMode ? `จัดการข้อมูลครุภัณฑ์: ${formData.assetCode} ` : 'กรอกข้อมูลรายละเอียดครุภัณฑ์เพื่อบันทึกลงระบบ'}
          </p>
        </div>
        <button onClick={() => navigate('/assets')} className="text-slate-500 hover:text-slate-700">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white rounded-xl overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ${activeTab === 'general' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              } `}
          >
            <FileText size={18} /> ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ${activeTab === 'specs' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              } `}
          >
            {getSpecsIcon()} คุณสมบัติทางเทคนิค
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ${activeTab === 'location' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              } `}
          >
            <MapPin size={18} /> สถานที่และผู้ใช้
          </button>
          {isEditMode && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap outline-none focus:outline-none focus:ring-0 ${activeTab === 'maintenance' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:text-slate-800'
                } `}
            >
              <Wrench size={18} /> ประวัติซ่อมบำรุง
            </button>
          )}
        </div>

        <div className="p-6 md:p-8">
          <form onSubmit={handleSave} className={activeTab === 'maintenance' ? 'hidden' : 'block'}>
            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">

                {/* Fiscal Year Section - Flattened */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-1">
                    ปีงบประมาณที่สำรวจ (Fiscal Year) <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={formData.fiscalYear!}
                    onChange={(val) => setFormData({ ...formData, fiscalYear: val })}
                    options={fiscalYears.map(year => ({
                      label: `${year} ${year === currentYearBE ? '(ปีปัจจุบัน)' : ''} `,
                      value: year.toString()
                    }))}
                    placeholder="-- เลือกปีงบประมาณ --"
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">ข้อมูลสำคัญ: ใช้สำหรับจัดหมวดหมู่รายงานและติดตามวงรอบครุภัณฑ์</p>
                </div>

                <div className="md:col-span-2">
                  <Combobox
                    label="ชื่อรายการครุภัณฑ์"
                    value={formData.name || ''}
                    onChange={(val) => setFormData({ ...formData, name: val })}
                    options={settings.commonAssetNames || []}
                    placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผลระดับสูง"
                    required
                  />
                </div>

                {/* Asset ID Field with Temp Checkbox */}
                <div className="md:col-span-1">
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-slate-700">เลขครุภัณฑ์ (Asset ID) *</label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        id="no-asset-id"
                        checked={isTempAssetCode}
                        onChange={handleTempIdToggle}
                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                      />
                      <label htmlFor="no-asset-id" className="text-xs text-slate-500 cursor-pointer select-none">ไม่ปรากฏเลข / รอตรวจสอบ</label>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      className={`w - full border rounded - lg p - 2.5 outline - none transition - colors ${isTempAssetCode
                        ? 'bg-amber-50 border-amber-300 text-amber-700 font-mono'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-primary-500'
                        } `}
                      placeholder="xx-xx-xxxx"
                      value={formData.assetCode}
                      onChange={(e) => setFormData({ ...formData, assetCode: e.target.value })}
                      required
                      readOnly={isTempAssetCode}
                    />
                    {isTempAssetCode && (
                      <Hash size={16} className="absolute right-3 top-3 text-amber-400" />
                    )}
                  </div>
                  {isTempAssetCode && (
                    <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={12} /> ระบบออกรหัสชั่วคราวให้ โปรดแก้ไขภายหลัง
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number (S/N)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="ระบุ S/N ของเครื่อง"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                  />
                </div>

                {/* Replacement Section - Inserted Here */}
                <div className="md:col-span-2 border border-orange-100 rounded-xl bg-orange-50/50 p-5 mt-2">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-orange-800 font-bold">
                      <RefreshCcw size={20} />
                      <span>การทดแทนและจำหน่ายเครื่องเดิม</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={isReplacement}
                          onChange={(e) => {
                            setIsReplacement(e.target.checked);
                            if (!e.target.checked) setSelectedOldAssetId('');
                          }}
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                        <span className="ml-3 text-sm font-medium text-slate-700">ครุภัณฑ์นี้จัดซื้อเพื่อทดแทน (Replacement)</span>
                      </label>
                    </div>
                  </div>

                  {isReplacement && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-slide-down">
                      <div className="md:col-span-2 bg-white border border-orange-100 p-4 rounded-lg">
                        <label className="block text-sm font-medium text-slate-700 mb-1">เลือกครุภัณฑ์เดิมที่ถูกทดแทน (เพื่อจำหน่ายออก)</label>
                        <Select
                          value={selectedOldAssetId}
                          onChange={setSelectedOldAssetId}
                          options={availableOldAssets.map(asset => ({
                            label: `${asset.assetCode} - ${asset.name} (${asset.status})`,
                            value: asset.id
                          }))}
                          placeholder="-- ค้นหาจากรหัสครุภัณฑ์ หรือ ชื่อ --"
                          disabled={isEditMode && !!formData.replacedAssetId}
                        />

                        {/* Preview Old Asset */}
                        {selectedOldAssetInfo && (
                          <div className="mt-3 p-3 bg-slate-100 rounded border border-slate-200 flex items-start gap-3">
                            <div className="p-2 bg-slate-200 rounded text-slate-500">
                              <FileMinus size={20} />
                            </div>
                            <div className="text-sm">
                              <p className="font-bold text-slate-700">{selectedOldAssetInfo.name}</p>
                              <p className="text-slate-500">รหัส: {selectedOldAssetInfo.assetCode} | สถานะเดิม: {selectedOldAssetInfo.status}</p>
                              <div className="flex items-center gap-1 text-orange-600 text-xs mt-1 font-medium">
                                <AlertTriangle size={12} /> ระบบจะเปลี่ยนสถานะเครื่องนี้เป็น "จำหน่ายแล้ว" อัตโนมัติเมื่อบันทึก
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">เลขที่เอกสารจำหน่าย/โอนออก *</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                          placeholder="เช่น สธ.001/2567"
                          value={disposalDocId}
                          onChange={(e) => setDisposalDocId(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">วันที่จำหน่าย</label>
                        <input
                          type="date"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none"
                          value={disposalDate}
                          onChange={(e) => setDisposalDate(e.target.value)}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ประเภทงบประมาณ</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.budgetType || BudgetType.ASSET}
                    onChange={(e) => setFormData({ ...formData, budgetType: e.target.value as BudgetType })}
                  >
                    <option value={BudgetType.ASSET}>ครุภัณฑ์ (Asset)</option>
                    <option value={BudgetType.SUPPLY}>วัสดุ (Supply)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-800 mb-2">ประเภทและหมวดหมู่</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Select
                        label="ประเภทครุภัณฑ์ (Asset Type)"
                        value={AssetTypeLabels[formData.type as any] || formData.type || ''}
                        onChange={(val) => setFormData({ ...formData, type: val as any })}
                        options={assetTypeOptions.map((t) => ({
                          label: t,
                          value: t
                        }))}
                        placeholder="เลือกประเภทครุภัณฑ์"
                      />
                      <p className="text-xs text-slate-400 mt-1">ใช้สำหรับกำหนดแบบฟอร์มข้อมูลทางเทคนิค</p>
                    </div>

                    <div>
                      <Combobox
                        label="ยี่ห้อ (Brand)"
                        value={formData.brand || ''}
                        onChange={(val) => setFormData({ ...formData, brand: val })}
                        options={settings.commonBrands || []}
                        placeholder="เช่น Dell, HP, Lenovo"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Combobox
                    label="รุ่น (Model)"
                    value={formData.model || ''}
                    onChange={(val) => setFormData({ ...formData, model: val })}
                    options={settings.commonModels || []}
                    placeholder="เช่น OptiPlex 7090"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สถานะปัจจุบัน</label>
                  <Select
                    value={formData.status!}
                    onChange={(val) => setFormData({ ...formData, status: val as AssetStatus })}
                    options={Object.values(AssetStatus).map(s => ({
                      label: AssetStatusLabels[s],
                      value: s
                    }))}
                    placeholder="เลือกสถานะ"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ได้รับ (Acquired Date)</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.acquiredDate}
                    onChange={(e) => setFormData({ ...formData, acquiredDate: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่หมดประกัน (Warranty End)</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.warrantyExpireDate}
                    onChange={(e) => setFormData({ ...formData, warrantyExpireDate: e.target.value })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">รูปภาพครุภัณฑ์</label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center text-slate-400 hover:bg-slate-50 transition cursor-pointer relative overflow-hidden group">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                      onChange={handleImageUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />

                    {previewImageUrl || formData.imageUrl ? (
                      <div className="relative w-full h-64 group/image">
                        <img
                          src={previewImageUrl || (formData.imageUrl ? `http://${window.location.hostname}:3008${formData.imageUrl}` : '')}
                          alt="Asset Preview"
                          className="w-full h-full object-contain rounded-lg bg-slate-100 cursor-zoom-in"
                          onClick={() => setIsImageModalOpen(true)}
                        />

                        {/* Overlay Controls */}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/image:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                          <div className="bg-black/60 text-white px-4 py-2 rounded-full flex items-center gap-2 backdrop-blur-sm">
                            <Maximize size={16} /> คลิกเพื่อขยาย
                          </div>
                        </div>

                        {/* Top Right Controls */}
                        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                          <label className="p-2 bg-white/90 hover:bg-white text-slate-700 rounded-full cursor-pointer shadow-sm transition-colors" title="เปลี่ยนรูปภาพ">
                            <Upload size={16} />
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                              onChange={handleImageUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              e.preventDefault();
                              setPreviewImageUrl('');
                              setSelectedImageFile(null);
                              setFormData({ ...formData, imageUrl: '' });
                            }}
                            className="p-2 bg-red-500/90 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors"
                            title="ลบรูปภาพ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div >
                    ) : (
                      <>
                        <Upload size={32} className="mb-2" />
                        <span className="text-sm">คลิกเพื่ออัปโหลดรูปภาพ หรือลากไฟล์มาวางที่นี่</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Specs Tab */}
            {
              activeTab === 'specs' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded text-blue-600">
                      {getSpecsIcon()}
                    </div>
                    <div className="text-sm text-blue-800">
                      <p className="font-semibold">ข้อมูลทางเทคนิคสำหรับ: {formData.type}</p>
                      <p>กรุณากรอกรายละเอียดสเปคให้ครบถ้วนเพื่อประโยชน์ในการซ่อมบำรุงและตรวจสอบ</p>
                    </div>
                  </div>

                  {/* Conditional Fields based on Asset Type */}
                  {(formData.type === AssetType.COMPUTER || formData.type === AssetTypeLabels[AssetType.COMPUTER] || formData.type === AssetType.SERVER || formData.type === AssetTypeLabels[AssetType.SERVER]) && (
                    <>
                      {(formData.type === AssetType.SERVER || (typeof formData.type === 'string' && formData.type.toLowerCase().includes('server'))) && (
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">ขนาดพื้นที่ (Rack Unit / Space)</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="ระบุขนาด (เช่น 1U, 2U, Tower)"
                            value={formData.rackUnit || ''}
                            onChange={(e) => setFormData({ ...formData, rackUnit: e.target.value })}
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">CPU (Processor)</label>
                        <input
                          type="text"
                          list="cpu-options"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="เช่น Intel Core i7-12700"
                          value={formData.cpu || ''}
                          onChange={(e) => setFormData({ ...formData, cpu: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">RAM (Memory)</label>
                        <input
                          type="text"
                          list="ram-options"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="เช่น 16GB DDR4"
                          value={formData.ram || ''}
                          onChange={(e) => setFormData({ ...formData, ram: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Storage (HDD/SSD)</label>
                        <input
                          type="text"
                          list="storage-options"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="เช่น 512GB NVMe SSD"
                          value={formData.storage || ''}
                          onChange={(e) => setFormData({ ...formData, storage: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Graphic Card (GPU)</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="On-board / Nvidia RTX 3050"
                          value={formData.gpu || ''}
                          onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Operating System</label>
                        <input
                          type="text"
                          list="os-options"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="Windows 11 Pro"
                          value={formData.os || ''}
                          onChange={(e) => setFormData({ ...formData, os: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Type (สถานะลิขสิทธิ์)</label>
                        <input
                          type="text"
                          list="license-options"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                          placeholder="เลือกหรือระบุสถานะลิขสิทธิ์"
                          value={formData.licenseType || ''}
                          onChange={(e) => setFormData({ ...formData, licenseType: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Key / License</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                          placeholder="xxxxx-xxxxx-xxxxx-xxxxx"
                          value={formData.productKey || ''}
                          onChange={(e) => setFormData({ ...formData, productKey: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">MAC Address</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                          placeholder="00:1B:44:11:3A:B7"
                          value={formData.macAddress || ''}
                          onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
                        <input
                          type="text"
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none font-mono"
                          placeholder="192.168.1.xxx"
                          value={formData.ipAddress || ''}
                          onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                        />
                      </div>
                    </>
                  )}

                  {/* Software Specs */}
                  {(formData.type === AssetType.SOFTWARE || formData.type === AssetTypeLabels[AssetType.SOFTWARE]) && (
                    <>
                      <div className="md:col-span-2">
                        <div className="bg-purple-50 p-4 rounded-lg text-purple-800 text-sm mb-4 border border-purple-100 flex items-center gap-2">
                          <Shield size={16} /> บันทึกข้อมูลลิขสิทธิ์ซอฟต์แวร์
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่ (Category)</label>
                        <Select
                          value={formData.subtype || ''}
                          onChange={(val) => setFormData({ ...formData, subtype: val })}
                          options={Object.values(SoftwareCategory).map(c => ({ label: c, value: c }))}
                          placeholder="เลือกหมวดหมู่ซอฟต์แวร์"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">License Type (ประเภทลิขสิทธิ์)</label>
                        <Select
                          value={formData.licenseType || ''}
                          onChange={(val) => setFormData({ ...formData, licenseType: val })}
                          options={[
                            { label: 'Subscription (รายปี/รายเดือน)', value: 'Subscription' },
                            { label: 'Perpetual (ซื้อขาด)', value: 'Perpetual' },
                            { label: 'Freeware / Open Source', value: 'Freeware' },
                            { label: 'OEM (ติดมากับเครื่อง)', value: 'OEM' },
                            { label: 'Volume License', value: 'Volume' }
                          ]}
                          placeholder="เลือกประเภท License"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Key / Serial Number</label>
                        <div className="relative">
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none font-mono pl-9"
                            placeholder="xxxxx-xxxxx-xxxxx-xxxxx"
                            value={formData.productKey || ''}
                            onChange={(e) => setFormData({ ...formData, productKey: e.target.value })}
                          />
                          <Key size={16} className="absolute left-3 top-3 text-slate-400" />
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม / เงื่อนไขการใช้งาน</label>
                        <textarea
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none h-24"
                          placeholder="ระบุเงื่อนไขเพิ่มเติม เช่น จำนวน User ที่รองรับ, เว็บไซต์สำหรับ Activate..."
                          value={formData.note || ''}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        ></textarea>
                      </div>
                    </>
                  )}

                  {/* Simplified Specs for other types (Exclude Computer AND Software) */}
                  {formData.type !== AssetType.COMPUTER && formData.type !== AssetType.SOFTWARE && formData.type !== AssetTypeLabels[AssetType.COMPUTER] && formData.type !== AssetTypeLabels[AssetType.SOFTWARE] && (
                    <div className="md:col-span-2 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">รายละเอียดเพิ่มเติม/หมายเหตุ (Specification Note)</label>
                        <textarea
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none h-32"
                          placeholder={`ระบุรายละเอียดทางเทคนิคสำหรับ ${formData.type}...`}
                          value={formData.note || ''}
                          onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                        ></textarea>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Serial Number (S/N)</label>
                          <input
                            type="text"
                            className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                            value={formData.serialNumber || ''}
                            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                            disabled // Already entered in general tab, just showing here
                          />
                          <p className="text-xs text-slate-400 mt-1">อ้างอิงจากข้อมูลทั่วไป</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            }

            {/* Location Tab */}
            {
              activeTab === 'location' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยงานที่รับผิดชอบ</label>
                    <Select
                      value={formData.department!}
                      onChange={(val) => setFormData({ ...formData, department: val })}
                      options={(settings.departments || []).map(dept => ({ label: dept, value: dept }))}
                      placeholder="-- เลือกหน่วยงาน --"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">สถานที่ติดตั้ง/จัดเก็บ</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="ระบุห้องหรืออาคาร"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">ผู้ใช้งานปัจจุบัน (Custodian)</label>
                    <input
                      type="text"
                      className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                      placeholder="ชื่อ-นามสกุล ข้าราชการ/พนักงาน"
                      value={formData.currentUser}
                      onChange={(e) => setFormData({ ...formData, currentUser: e.target.value })}
                    />
                  </div>
                </div>
              )
            }

            {/* General Action Buttons */}
            {
              activeTab !== 'maintenance' && (
                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/assets')}
                    className="px-6 py-2.5 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 font-medium transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-md flex items-center gap-2 transition"
                  >
                    <Save size={18} /> บันทึกข้อมูล
                  </button>
                </div>
              )
            }
          </form >

          {/* Maintenance Tab Content */}
          {
            activeTab === 'maintenance' && isEditMode && (
              <div className="animate-fade-in space-y-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-slate-800 font-medium text-lg">รายการซ่อมบำรุง ({maintenanceRecords.filter(r => r._uiStatus !== 'deleted').length})</div>
                  <button
                    onClick={() => setShowAddMaintenance(!showAddMaintenance)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                  >
                    {showAddMaintenance ? <X size={18} /> : <Plus size={18} />}
                    {showAddMaintenance ? 'ยกเลิก' : 'เพิ่มรายการซ่อม'}
                  </button>
                </div>

                {showAddMaintenance && (
                  <div className="bg-amber-50 rounded-xl p-6 border border-amber-100 mb-6 animate-slide-down">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">วันที่ดำเนินการ *</label>
                        <input type="date" className="w-full border border-amber-200 rounded-lg p-2.5 bg-white" value={newMaintenance.date} onChange={(e) => setNewMaintenance({ ...newMaintenance, date: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">ค่าใช้จ่าย</label>
                        <input type="number" className="w-full border border-amber-200 rounded-lg p-2.5 bg-white" value={newMaintenance.cost} onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: parseFloat(e.target.value) })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">รายละเอียด *</label>
                        <input type="text" className="w-full border border-amber-200 rounded-lg p-2.5 bg-white" value={newMaintenance.description} onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-900 mb-1">สถานะหลังซ่อม</label>
                        <Select
                          value={newMaintenance.resultingStatus!}
                          onChange={(val) => setNewMaintenance({ ...newMaintenance, resultingStatus: val as AssetStatus })}
                          options={Object.values(AssetStatus).map(s => ({
                            label: s,
                            value: s
                          }))}
                          placeholder="เลือกสถานะ"
                        />
                      </div>
                    </div>
                    <button onClick={handleAddMaintenance} className="mt-4 px-6 py-2 bg-amber-600 text-white rounded-lg">บันทึกรายการ</button>
                  </div>
                )}

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">วันที่</th>
                        <th className="px-6 py-3">รายละเอียด</th>
                        <th className="px-6 py-3 text-center">จัดการ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {maintenanceRecords.map((record) => {
                        // Determine Row Style based on UI Status
                        let rowClass = 'hover:bg-slate-50 transition-colors';
                        if (record._uiStatus === 'new') rowClass = 'bg-green-50 border-l-4 border-green-500';
                        if (record._uiStatus === 'deleted') rowClass = 'bg-red-50 text-slate-400 opacity-75';

                        return (
                          <tr key={record.id} className={rowClass}>
                            <td className={`px-6 py-4 ${record._uiStatus === 'deleted' ? 'line-through' : ''}`}>
                              <div className="flex items-center gap-2">
                                {record.date}
                                {record._uiStatus === 'new' && (
                                  <span className="text-[10px] bg-green-200 text-green-800 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                    <BadgeCheck size={10} /> NEW
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={`px-6 py-4 ${record._uiStatus === 'deleted' ? 'line-through' : ''}`}>
                              {record.description}
                            </td>
                            <td className="px-6 py-4 text-center">
                              {record._uiStatus === 'deleted' ? (
                                <button
                                  onClick={() => restoreMaintenance(record.id)}
                                  className="text-slate-500 hover:text-green-600 flex items-center justify-center gap-1 mx-auto"
                                  title="คืนค่ารายการ"
                                >
                                  <RotateCcw size={16} /> <span className="text-xs">คืนค่า</span>
                                </button>
                              ) : (
                                <button onClick={() => setDeleteId(record.id)} className="text-red-400 hover:text-red-600">
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          }
        </div>
      </div>
      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccess}
        title="บันทึกสำเร็จ!"
        message="ระบบตรวจสอบข้อมูลและบันทึก ลงในฐานข้อมูลเรียบร้อยแล้ว"
      />

      {/* Image Modal */}
      <ImageModal
        isOpen={isImageModalOpen}
        imageUrl={previewImageUrl || (formData.imageUrl ? `http://${window.location.hostname}:3008${formData.imageUrl}` : '')}
        onClose={() => setIsImageModalOpen(false)}
        altText={formData.name}
      />

    </div>
  );
};

export default AssetForm;