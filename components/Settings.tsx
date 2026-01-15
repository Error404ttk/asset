import React, { useState, useEffect } from 'react';
import { Save, Building, List, Bell, Shield, Mail, Plus, X, Users, Trash2, UserPlus, CheckCircle, AlertCircle, Cpu, Server, HardDrive, Edit, Tag, Package, Layers } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { SystemSettings } from '../types';
import { api } from '../services/api';
import SuccessModal from './SuccessModal';
import Select from './ui/Select';

interface SettingsProps {
  initialTab?: 'general' | 'specs' | 'departments' | 'notifications' | 'users';
}

const Settings: React.FC<SettingsProps> = ({ initialTab }) => {
  const { settings, updateSettings } = useAssets();
  const [activeTab, setActiveTab] = useState<'general' | 'specs' | 'departments' | 'notifications' | 'users'>(initialTab || 'general');

  // Local state for form editing
  const [formData, setFormData] = useState<SystemSettings>(settings);

  // Sync when context changes
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // Sync activeTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Temporary states for inputs
  const [newDepartment, setNewDepartment] = useState('');
  const [newOS, setNewOS] = useState('');
  const [newRam, setNewRam] = useState('');
  const [newStorage, setNewStorage] = useState('');
  const [newCpu, setNewCpu] = useState('');
  const [newLicenseType, setNewLicenseType] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newAssetType, setNewAssetType] = useState('');

  // User Management State
  const [systemUsers, setSystemUsers] = useState<{ id: number; username: string; name: string; email: string; role: string; status: string }[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [editUserMode, setEditUserMode] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({ username: '', password: '', name: '', email: '', role: 'Staff', status: 'Active' });

  // Success Modal State
  const [successModal, setSuccessModal] = useState<{ isOpen: boolean; title: string; message: string }>({
    isOpen: false,
    title: '',
    message: ''
  });

  const showSuccess = (title: string, message: string) => {
    setSuccessModal({ isOpen: true, title, message });
    setTimeout(() => {
      setSuccessModal(prev => ({ ...prev, isOpen: false }));
    }, 2000);
  };

  // Generic List Handlers
  const addItem = (key: keyof SystemSettings, value: string, resetFn: (v: string) => void) => {
    if (value.trim() && Array.isArray(formData[key])) {
      const currentList = formData[key] as string[];
      if (!currentList.includes(value.trim())) {
        const updatedList = [...currentList, value.trim()];
        setFormData(prev => ({ ...prev, [key]: updatedList }));
        resetFn('');
      }
    }
  };

  const removeItem = (key: keyof SystemSettings, value: string) => {
    if (Array.isArray(formData[key])) {
      const currentList = formData[key] as string[];
      const updatedList = currentList.filter(item => item !== value);
      setFormData(prev => ({ ...prev, [key]: updatedList }));
    }
  };

  // Fetch users on load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const users = await api.getUsers();
      setSystemUsers(users);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  };

  // User Handlers
  const handleEditClick = (user: any) => {
    setEditUserMode(user.id);
    setNewUser({
      username: user.username,
      password: '',
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status || 'Active'
    });
    setShowAddUser(true);
  };

  const resetUserForm = () => {
    setNewUser({ username: '', password: '', name: '', email: '', role: 'Staff', status: 'Active' });
    setEditUserMode(null);
    setShowAddUser(false);
  };

  const handleDeleteUser = async (id: number) => {
    if (confirm('ยืนยันการลบผู้ใช้งานนี้?')) {
      try {
        await api.deleteUser(id);
        setSystemUsers(prev => prev.filter(u => u.id !== id));
      } catch (err) {
        console.error(err);
        alert('ลบผู้ใช้งานไม่สำเร็จ');
      }
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.name) {
      alert('กรุณากรอก Username และ ชื่อ-นามสกุล');
      return;
    }
    if (!editUserMode && !newUser.password) {
      alert('กรุณากรอกรหัสผ่าน');
      return;
    }

    try {
      if (editUserMode) {
        await api.updateUser(editUserMode, newUser);
        showSuccess('บันทึกสำเร็จ', 'แก้ไขข้อมูลผู้ใช้งานเรียบร้อยแล้ว');
      } else {
        await api.createUser(newUser);
        showSuccess('เพิ่มสำเร็จ', 'เพิ่มผู้ใช้งานเรียบร้อยแล้ว');
      }

      fetchUsers();
      resetUserForm();
    } catch (err: any) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
  };

  const handleSave = () => {
    updateSettings(formData);
    showSuccess('บันทึกสำเร็จ', 'บันทึกการตั้งค่าระบบเรียบร้อยแล้ว');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
        <p className="text-slate-500">จัดการข้อมูลหน่วยงาน ข้อมูลทางเทคนิค และผู้ใช้งาน</p>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* Settings Navigation */}
        <div className="w-full md:w-64 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden shrink-0">
          <nav className="flex flex-col p-2 gap-1">
            <button
              onClick={() => setActiveTab('general')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'general' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Building size={18} /> ข้อมูลหน่วยงาน
            </button>
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'departments' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Shield size={18} /> หน่วยงาน/แผนก
            </button>
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'specs' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Cpu size={18} /> ข้อมูลทางเทคนิค
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'users' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Users size={18} /> ผู้ใช้งานระบบ
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'notifications' ? 'bg-primary-50 text-primary-600' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <Bell size={18} /> การแจ้งเตือน
            </button>
          </nav>
        </div>

        {/* Settings Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-100 p-6 w-full animate-fade-in">

          {/* General Tab */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">ข้อมูลทั่วไปของหน่วยงาน</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อหน่วยงาน</label>
                  <input
                    type="text"
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={formData.agencyName}
                    onChange={(e) => setFormData({ ...formData, agencyName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">ที่อยู่ / สถานที่ตั้ง</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none h-24"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  ></textarea>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">โลโก้หน่วยงาน</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200">
                      <Building size={24} className="text-slate-400" />
                    </div>
                    <button className="text-sm text-primary-600 font-medium hover:underline">อัปโหลดรูปภาพ...</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">จัดการหน่วยงานภายใน/แผนก</h2>
              <p className="text-sm text-slate-500">กำหนดรายชื่อกอง/สำนัก สำหรับระบุสถานที่ตั้งครุภัณฑ์ในหน้าแบบฟอร์ม</p>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="เพิ่มแผนกใหม่..."
                  className="flex-1 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-primary-500 outline-none"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem('departments', newDepartment, setNewDepartment)}
                />
                <button
                  onClick={() => addItem('departments', newDepartment, setNewDepartment)}
                  className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                >
                  <Plus size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2 pt-2 max-h-96 overflow-y-auto">
                {(formData.departments || []).map((dept, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-100 group hover:border-primary-200 transition-colors">
                    <span className="text-slate-700 font-medium">{dept}</span>
                    <button onClick={() => removeItem('departments', dept)} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Specs Tab */}
          {activeTab === 'specs' && (
            <div className="space-y-8">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-800">จัดการข้อมูลตัวเลือก (Master Data & Specs)</h2>
                <p className="text-sm text-slate-500">กำหนดตัวเลือกมาตรฐานสำหรับชื่อครุภัณฑ์, ยี่ห้อ, รุ่น และสเปกคอมพิวเตอร์</p>
              </div>

              {/* Asset Names */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><List size={18} /> ชื่อรายการครุภัณฑ์ (Asset Names)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น คอมพิวเตอร์ All-in-One, เครื่องพิมพ์เลเซอร์"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newAssetName}
                    onChange={(e) => setNewAssetName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonAssetNames', newAssetName, setNewAssetName)}
                  />
                  <button onClick={() => addItem('commonAssetNames', newAssetName, setNewAssetName)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonAssetNames || []).map((item, i) => (
                    <span key={i} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm border border-slate-200 flex items-center gap-1">
                      {item}
                      <button onClick={() => removeItem('commonAssetNames', item)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Brands */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Tag size={18} /> ยี่ห้อ (Brands)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น Dell, HP, Lenovo"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newBrand}
                    onChange={(e) => setNewBrand(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonBrands', newBrand, setNewBrand)}
                  />
                  <button onClick={() => addItem('commonBrands', newBrand, setNewBrand)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonBrands || []).map((item, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm border border-indigo-100 flex items-center gap-1">
                      {item}
                      <button onClick={() => removeItem('commonBrands', item)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Models */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Package size={18} /> รุ่น (Models)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น OptiPlex 3080, LaserJet Pro M404dn"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newModel}
                    onChange={(e) => setNewModel(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonModels', newModel, setNewModel)}
                  />
                  <button onClick={() => addItem('commonModels', newModel, setNewModel)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonModels || []).map((item, i) => (
                    <span key={i} className="bg-teal-50 text-teal-700 px-3 py-1 rounded-full text-sm border border-teal-100 flex items-center gap-1">
                      {item}
                      <button onClick={() => removeItem('commonModels', item)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Asset Types */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Layers size={18} /> ประเภทครุภัณฑ์ (Asset Types)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น คอมพิวเตอร์, เครื่องพิมพ์, โปรเจคเตอร์"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newAssetType}
                    onChange={(e) => setNewAssetType(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonAssetTypes', newAssetType, setNewAssetType)}
                  />
                  <button onClick={() => addItem('commonAssetTypes', newAssetType, setNewAssetType)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonAssetTypes || []).map((item, i) => (
                    <span key={i} className="bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-sm border border-orange-100 flex items-center gap-1">
                      {item}
                      <button onClick={() => removeItem('commonAssetTypes', item)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Operating Systems */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Server size={18} /> ระบบปฏิบัติการ (OS List)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น Windows 11 Pro, Ubuntu 22.04"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newOS}
                    onChange={(e) => setNewOS(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonOS', newOS, setNewOS)}
                  />
                  <button onClick={() => addItem('commonOS', newOS, setNewOS)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonOS || []).map((os, i) => (
                    <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm border border-blue-100 flex items-center gap-1">
                      {os}
                      <button onClick={() => removeItem('commonOS', os)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* RAM */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><HardDrive size={18} /> หน่วยความจำ (RAM Options)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น 16GB DDR4"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newRam}
                    onChange={(e) => setNewRam(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonRam', newRam, setNewRam)}
                  />
                  <button onClick={() => addItem('commonRam', newRam, setNewRam)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonRam || []).map((ram, i) => (
                    <span key={i} className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-sm border border-emerald-100 flex items-center gap-1">
                      {ram}
                      <button onClick={() => removeItem('commonRam', ram)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* Storage */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><HardDrive size={18} /> พื้นที่เก็บข้อมูล (Storage Options)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น 512GB M.2 SSD"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newStorage}
                    onChange={(e) => setNewStorage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonStorage', newStorage, setNewStorage)}
                  />
                  <button onClick={() => addItem('commonStorage', newStorage, setNewStorage)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonStorage || []).map((storage, i) => (
                    <span key={i} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm border border-indigo-100 flex items-center gap-1">
                      {storage}
                      <button onClick={() => removeItem('commonStorage', storage)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* CPU */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Cpu size={18} /> หน่วยประมวลผล (CPU Families)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น Intel Core i5, Apple M3"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newCpu}
                    onChange={(e) => setNewCpu(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonCpu', newCpu, setNewCpu)}
                  />
                  <button onClick={() => addItem('commonCpu', newCpu, setNewCpu)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonCpu || []).map((cpu, i) => (
                    <span key={i} className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm border border-amber-100 flex items-center gap-1">
                      {cpu}
                      <button onClick={() => removeItem('commonCpu', cpu)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              {/* License Types */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-700 flex items-center gap-2"><Shield size={18} /> สถานะลิขสิทธิ์ (License Types)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="เช่น มีลิขสิทธิ์, ไม่มีลิขสิทธิ์"
                    className="flex-1 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 outline-none"
                    value={newLicenseType}
                    onChange={(e) => setNewLicenseType(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addItem('commonLicenseTypes', newLicenseType, setNewLicenseType)}
                  />
                  <button onClick={() => addItem('commonLicenseTypes', newLicenseType, setNewLicenseType)} className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700"><Plus size={18} /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(formData.commonLicenseTypes || []).map((type, i) => (
                    <span key={i} className="bg-purple-50 text-purple-700 px-3 py-1 rounded-full text-sm border border-purple-100 flex items-center gap-1">
                      {type}
                      <button onClick={() => removeItem('commonLicenseTypes', type)} className="hover:text-red-500 ml-1"><X size={14} /></button>
                    </span>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* User Management Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">จัดการผู้ใช้งาน (User Management)</h2>
                  <p className="text-sm text-slate-500">จัดการบัญชีผู้ดูแลระบบและเจ้าหน้าที่</p>
                </div>
                <button
                  onClick={() => {
                    if (showAddUser) resetUserForm();
                    else setShowAddUser(true);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition-colors ${showAddUser ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
                >
                  {showAddUser ? <X size={16} /> : <UserPlus size={16} />}
                  {showAddUser ? 'ปิด' : 'เพิ่มผู้ใช้งาน'}
                </button>
              </div>

              {/* Add/Edit User Form */}
              {showAddUser && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 animate-slide-down">
                  <h4 className="font-bold text-slate-700 mb-3 text-sm flex items-center gap-2">
                    {editUserMode ? <Edit size={16} /> : <UserPlus size={16} />}
                    {editUserMode ? 'แก้ไขข้อมูลผู้ใช้งาน' : 'เพิ่มผู้ใช้งานใหม่'}
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Username</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="username"
                        disabled={!!editUserMode}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">
                        Password {editUserMode && <span className="text-slate-400 font-normal">(เว้นว่างหากไม่ต้องการเปลี่ยน)</span>}
                      </label>
                      <input
                        type="password"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="password"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">ชื่อ-นามสกุล</label>
                      <input
                        type="text"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="เช่น สมชาย ใจดี"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">อีเมล</label>
                      <input
                        type="email"
                        className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="example@gov.local"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">สิทธิ์การใช้งาน (Role)</label>
                      <Select
                        value={newUser.role}
                        onChange={(val) => setNewUser({ ...newUser, role: val })}
                        options={[
                          { label: 'Admin (ผู้ดูแลระบบ)', value: 'Admin' },
                          { label: 'Staff (เจ้าหน้าที่)', value: 'Staff' },
                          { label: 'Editor (ผู้แก้ไข)', value: 'Editor' },
                          { label: 'Viewer (ผู้ดูอย่างเดียว)', value: 'Viewer' },
                        ]}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">สถานะ (Status)</label>
                      <Select
                        value={newUser.status || 'Active'}
                        onChange={(val) => setNewUser({ ...newUser, status: val })}
                        options={[
                          { label: 'Active (ปกติ)', value: 'Active' },
                          { label: 'Inactive (ระงับใช้งาน)', value: 'Inactive' },
                        ]}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={resetUserForm}
                      className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddUser}
                      className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900"
                    >
                      {editUserMode ? 'บันทึกการแก้ไข' : 'ยืนยันการเพิ่ม'}
                    </button>
                  </div>
                </div>
              )}

              {/* Users Table */}
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-700 font-medium">
                    <tr>
                      <th className="px-4 py-3">Username</th>
                      <th className="px-4 py-3">ชื่อ-นามสกุล</th>
                      <th className="px-4 py-3">อีเมล</th>
                      <th className="px-4 py-3">สิทธิ์ (Role)</th>
                      <th className="px-4 py-3 text-center">สถานะ</th>
                      <th className="px-4 py-3 text-center">จัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {systemUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-800 font-mono">{user.username}</td>
                        <td className="px-4 py-3 font-medium text-slate-800 flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold text-xs">
                            {user.name.charAt(0)}
                          </div>
                          {user.name}
                        </td>
                        <td className="px-4 py-3">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium border
                            ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-100 text-slate-600 border-slate-200'}
                          `}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {user.status === 'Active' ? (
                            <span className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-medium">
                              <CheckCircle size={14} /> ปกติ
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium">
                              <AlertCircle size={14} /> ปิดใช้งาน
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center flex justify-center gap-1">
                          <button
                            onClick={() => handleEditClick(user)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="แก้ไขข้อมูล"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="ลบผู้ใช้งาน"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-slate-800 border-b border-slate-100 pb-4">ตั้งค่าการแจ้งเตือน</h2>
              <div className="text-center text-slate-400 py-10">
                กำลังปรับปรุงส่วนนี้...
              </div>
            </div>
          )}

          {/* Save Button Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 shadow-md flex items-center gap-2 transition"
            >
              <Save size={18} /> บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>

      <SuccessModal
        isOpen={successModal.isOpen}
        title={successModal.title}
        message={successModal.message}
      />
    </div>
  );
};

export default Settings;
