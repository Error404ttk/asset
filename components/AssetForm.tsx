import React, { useState, useEffect } from 'react';
import { AssetType, AssetStatus, MaintenanceRecord, Asset, AssetTypeLabels, AssetStatusLabels } from '../types';
import SuccessModal from './SuccessModal';
import { Save, X, Upload, Laptop, MapPin, FileText, Wrench, Plus, Trash2, Calendar, User, AlertTriangle, Monitor, Printer, Server, Wifi, Hash, RotateCcw, BadgeCheck, RefreshCcw, FileMinus } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';

// Extended type for UI state handling
type ExtendedMaintenanceRecord = MaintenanceRecord & {
  _uiStatus?: 'new' | 'deleted' | 'existing'
};

const AssetForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { addAsset, updateAsset, getAssetById, settings, assets } = useAssets(); // Use settings & assets from Context
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
    type: AssetType.COMPUTER,
    status: AssetStatus.NORMAL,
    brand: '',
    model: '',
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
    licenseType: '',
    imageUrl: '',
  };

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>(DEFAULT_FORM_DATA);

  // Image Upload State
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

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
  }, [isEditMode, id, getAssetById, navigate, showToast]);

  // Sync newMaintenance resultingStatus with current status when opening the form
  useEffect(() => {
    if (showAddMaintenance) {
      setNewMaintenance(prev => ({ ...prev, resultingStatus: formData.status }));
    }
  }, [showAddMaintenance, formData.status]);

  // Handle Temp ID Toggle
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
            note: (oldAsset.note ? oldAsset.note + '\n' : '') + `[ระบบ] จำหน่ายออกเพื่อทดแทนด้วยเครื่องใหม่ ID: ${trimmedAssetCode || 'N/A'}`
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

  // Helper to get icon for specs tab
  const getSpecsIcon = () => {
    switch (formData.type) {
      case AssetType.COMPUTER: return <Laptop size={18} />;
      case AssetType.MONITOR: return <Monitor size={18} />;
      case AssetType.PRINTER: return <Printer size={18} />;
      case AssetType.NETWORK: return <Wifi size={18} />;
      case AssetType.UPS: return <Server size={18} />;
      default: return <FileText size={18} />;
    }
  };

  // Filter available assets for replacement (Exclude current, exclude already disposed if strictly enforcing)
  const availableOldAssets = assets.filter(a => a.id !== id && a.status !== AssetStatus.SOLD && a.status !== AssetStatus.WITHDRAWN);
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
            {isEditMode ? `จัดการข้อมูลครุภัณฑ์: ${formData.assetCode}` : 'กรอกข้อมูลรายละเอียดครุภัณฑ์เพื่อบันทึกลงระบบ'}
          </p>
        </div>
        <button onClick={() => navigate('/assets')} className="text-slate-500 hover:text-slate-700">
          <X size={24} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Tabs Header */}
        <div className="flex border-b border-slate-100 overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'general' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <FileText size={18} /> ข้อมูลทั่วไป
          </button>
          <button
            onClick={() => setActiveTab('specs')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'specs' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            {getSpecsIcon()} คุณสมบัติทางเทคนิค
          </button>
          <button
            onClick={() => setActiveTab('location')}
            className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'location' ? 'border-primary-600 text-primary-600 bg-primary-50' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
          >
            <MapPin size={18} /> สถานที่และผู้ใช้
          </button>
          {isEditMode && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === 'maintenance' ? 'border-amber-500 text-amber-600 bg-amber-50' : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
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

                {/* Highlighted Fiscal Year Section */}
                <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
                    <Calendar size={24} />
                  </div>
                  <div className="flex-1 w-full">
                    <label className="block text-sm font-bold text-slate-700 mb-1">
                      ปีงบประมาณที่สำรวจ (Fiscal Year) <span className="text-red-500">*</span>
                    </label>
                    <select
                      className="w-full border border-blue-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium text-slate-800 shadow-sm"
                      value={formData.fiscalYear}
                      onChange={(e) => setFormData({ ...formData, fiscalYear: e.target.value })}
                      required
                    >
                      <option value="" disabled>-- เลือกปีงบประมาณ --</option>
                      {fiscalYears.map(year => (
                        <option key={year} value={year.toString()}>
                          {year} {year === currentYearBE ? '(ปีปัจจุบัน)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 mt-1">ข้อมูลสำคัญ: ใช้สำหรับจัดหมวดหมู่รายงานและติดตามวงรอบครุภัณฑ์</p>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อรายการครุภัณฑ์ *</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
                    placeholder="เช่น เครื่องคอมพิวเตอร์ประมวลผลระดับสูง"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                      className={`w-full border rounded-lg p-2.5 outline-none transition-colors ${isTempAssetCode
                        ? 'bg-amber-50 border-amber-300 text-amber-700 font-mono'
                        : 'bg-white border-slate-200 focus:ring-2 focus:ring-primary-500'
                        }`}
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
                        <select
                          className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-orange-500 outline-none bg-slate-50 font-medium"
                          value={selectedOldAssetId}
                          onChange={(e) => setSelectedOldAssetId(e.target.value)}
                          disabled={isEditMode && !!formData.replacedAssetId} // Lock if already saved
                        >
                          <option value="">-- ค้นหาจากรหัสครุภัณฑ์ หรือ ชื่อ --</option>
                          {availableOldAssets.map(asset => (
                            <option key={asset.id} value={asset.id}>
                              {asset.assetCode} - {asset.name} ({asset.status})
                            </option>
                          ))}
                        </select>

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

                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <label className="block text-sm font-bold text-slate-800 mb-2">ประเภทและหมวดหมู่</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">ประเภทครุภัณฑ์ (Asset Type)</label>
                      <select
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white font-medium"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as AssetType })}
                      >
                        {Object.values(AssetType).map(t => <option key={t} value={t}>{AssetTypeLabels[t]}</option>)}
                      </select>
                      <p className="text-xs text-slate-400 mt-1">ใช้สำหรับกำหนดแบบฟอร์มข้อมูลทางเทคนิค</p>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">ยี่ห้อ (Brand)</label>
                      <input
                        type="text"
                        className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                        placeholder="เช่น Dell, HP, Lenovo"
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รุ่น (Model)</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="เช่น OptiPlex 7090"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">สถานะปัจจุบัน</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as AssetStatus })}
                  >
                    {Object.values(AssetStatus).map(s => <option key={s} value={s}>{AssetStatusLabels[s]}</option>)}
                  </select>
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
                      <div className="relative w-full h-48">
                        <img
                          src={previewImageUrl || `http://localhost:3008${formData.imageUrl}`}
                          alt="Asset Preview"
                          className="w-full h-full object-contain rounded-lg"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <span className="text-white font-medium flex items-center gap-2"><Upload size={18} /> เปลี่ยนรูปภาพ</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            setPreviewImageUrl('');
                            setSelectedImageFile(null);
                            setFormData({ ...formData, imageUrl: '' });
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-500/80 hover:bg-red-600 text-white rounded-full z-20 transition-all opacity-0 group-hover:opacity-100"
                          title="ลบรูปภาพ"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
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
            {activeTab === 'specs' && (
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
                {formData.type === AssetType.COMPUTER && (
                  <>
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

                {/* Simplified Specs for other types */}
                {formData.type !== AssetType.COMPUTER && (
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
            )}

            {/* Location Tab */}
            {activeTab === 'location' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หน่วยงานที่รับผิดชอบ</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  >
                    <option value="" disabled>-- เลือกหน่วยงาน --</option>
                    {(settings.departments || []).map((dept, i) => (
                      <option key={i} value={dept}>{dept}</option>
                    ))}
                  </select>
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
            )}

            {/* General Action Buttons */}
            {activeTab !== 'maintenance' && (
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
            )}
          </form>

          {/* Maintenance Tab Content */}
          {activeTab === 'maintenance' && isEditMode && (
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
                      <select className="w-full border border-amber-200 rounded-lg p-2.5 bg-white" value={newMaintenance.resultingStatus} onChange={(e) => setNewMaintenance({ ...newMaintenance, resultingStatus: e.target.value as AssetStatus })}>
                        {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
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
          )}
        </div>
      </div >
      {/* Success Modal */}
      <SuccessModal
        isOpen={isSuccess}
        title="บันทึกสำเร็จ!"
        message="ระบบตรวจสอบข้อมูลและบันทึก ลงในฐานข้อมูลเรียบร้อยแล้ว"
      />

    </div >
  );
};

export default AssetForm;