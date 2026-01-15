import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  QrCode,
  Edit3,
  History,
  Calendar,
  X,
  Trash2
} from 'lucide-react';
import { AssetStatus, AssetType, AssetStatusLabels, AssetTypeLabels } from '../types';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';

const AssetList: React.FC = () => {
  const { assets, deleteAsset } = useAssets(); // Use Context
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  // Determine current Thai year
  const currentThaiYear = (new Date().getFullYear() + 543).toString();
  const [filterYear, setFilterYear] = useState(currentThaiYear);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const handleShowQR = (asset: any) => {
    setSelectedAsset(asset);
    setShowQRModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบครุภัณฑ์รายการนี้?')) {
      deleteAsset(id);
    }
  };

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    const matchesYear = filterYear ? asset.fiscalYear === filterYear : true;
    const matchesStatus = filterStatus ? asset.status === filterStatus : true;
    const matchesType = filterType ? asset.type === filterType : true;
    const matchesSearch = searchTerm === '' ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.currentUser.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesStatus && matchesType && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ทะเบียนครุภัณฑ์ ({filterYear})</h1>
          <p className="text-slate-500">จัดการและตรวจสอบรายการครุภัณฑ์แยกตามปีงบประมาณ</p>
        </div>
        <Link
          to="/assets/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus size={18} /> เพิ่มครุภัณฑ์ใหม่
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสครุภัณฑ์, ผู้ใช้งาน..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {/* Scrollable Filters on Mobile */}
        <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 items-center no-scrollbar touch-pan-x">

          {/* Year Filter */}
          <div className="relative shrink-0">
            <select
              className="appearance-none pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 font-medium"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
            >
              {[0, 1, 2, 3].map(offset => {
                const year = parseInt(currentThaiYear) - offset;
                return <option key={year} value={year}>ปี {year}</option>;
              })}
              <option value="">ทุกปี</option>
            </select>
            <Calendar className="absolute left-3 top-2.5 text-slate-400" size={16} />
          </div>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block"></div>

          <select
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shrink-0"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">ทุกสถานะ</option>
            {Object.values(AssetStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select
            className="px-4 py-2 border border-slate-200 rounded-lg text-slate-600 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 shrink-0"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">ทุกประเภท</option>
            {Object.values(AssetType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0">
            <Filter size={18} /> ตัวกรอง
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto touch-pan-x">
          <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">รหัสครุภัณฑ์</th>
                <th className="px-6 py-4">ปีงบฯ</th>
                <th className="px-6 py-4">ชื่อรายการ</th>
                <th className="px-6 py-4">ยี่ห้อ</th>
                <th className="px-6 py-4">หน่วยงาน/ผู้ใช้</th>
                <th className="px-6 py-4">ประเภท</th>
                <th className="px-6 py-4">สถานะ</th>
                <th className="px-6 py-4 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAssets.length > 0 ? (
                filteredAssets.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-medium text-primary-700">{asset.assetCode}</td>
                    <td className="px-6 py-4">
                      <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs border border-slate-200">
                        {asset.fiscalYear}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">{asset.name}</td>
                    <td className="px-6 py-4">{asset.brand}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-700">{asset.currentUser}</span>
                        <span className="text-xs text-slate-400">{asset.department}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{AssetTypeLabels[asset.type]}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${asset.status === AssetStatus.NORMAL ? 'bg-emerald-100 text-emerald-700' : ''}
                        ${asset.status === AssetStatus.BROKEN ? 'bg-red-100 text-red-700' : ''}
                        ${asset.status === AssetStatus.REPAIRING ? 'bg-amber-100 text-amber-700' : ''}
                        ${asset.status === AssetStatus.WITHDRAWN ? 'bg-slate-100 text-slate-700' : ''}
                        ${asset.status === AssetStatus.SOLD ? 'bg-gray-100 text-gray-700' : ''}
                       `}>
                        {AssetStatusLabels[asset.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleShowQR(asset)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg tooltip" title="QR Code">
                          <QrCode size={18} />
                        </button>
                        <Link
                          to={`/assets/${asset.id}`}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="แก้ไข/รายละเอียด"
                        >
                          <Edit3 size={18} />
                        </Link>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                          title="ลบ"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    ไม่พบข้อมูลครุภัณฑ์สำหรับเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {/* Pagination Mock */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-sm text-slate-500">แสดง {filteredAssets.length} รายการ</span>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50 disabled:opacity-50" disabled>ก่อนหน้า</button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-500 hover:bg-slate-50">ถัดไป</button>
          </div>
        </div>
      </div>

      {/* QR Code Modal Mock */}
      {showQRModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="bg-slate-900 p-6 text-center text-white relative">
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur">
                <QrCode size={32} />
              </div>
              <h3 className="text-xl font-bold">{selectedAsset.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{selectedAsset.assetCode}</p>
            </div>
            <div className="p-8 flex flex-col items-center">
              {/* Dummy QR */}
              <div className="w-48 h-48 bg-slate-100 rounded-xl border-4 border-slate-900 flex items-center justify-center mb-6">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedAsset.assetCode}`}
                  alt="QR Code"
                  className="w-40 h-40 mix-blend-multiply"
                />
              </div>
              <div className="w-full space-y-2 text-sm">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">ปีงบประมาณ:</span>
                  <span className="font-medium">{selectedAsset.fiscalYear}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">สถานะ:</span>
                  <span className="font-medium text-emerald-600">{selectedAsset.status}</span>
                </div>
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-500">ผู้รับผิดชอบ:</span>
                  <span className="font-medium">{selectedAsset.currentUser}</span>
                </div>
              </div>
              <button
                className="mt-6 w-full py-3 bg-primary-600 text-white rounded-lg font-bold shadow-lg hover:bg-primary-700 transition"
                onClick={() => window.alert('จำลองการพิมพ์สติ๊กเกอร์ QR Code')}
              >
                พิมพ์สติ๊กเกอร์
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetList;