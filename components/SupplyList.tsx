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
  Trash2,
  Eye,
  MapPin,
  Cpu,
  Monitor,
  HardDrive,
  RefreshCcw,
  Lock,
  Maximize
} from 'lucide-react';
import { AssetStatus, AssetType, AssetStatusLabels, AssetTypeLabels, BudgetType } from '../types';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import Select from './ui/Select';
import ImageModal from './ui/ImageModal';
import Pagination from './ui/Pagination';

const SupplyList: React.FC = () => {
  const { assets, deleteAsset, settings, deleteAssetsBulk } = useAssets();
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Image Lightbox State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState('');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const currentThaiYear = (new Date().getFullYear() + 543).toString();
  const [filterYear, setFilterYear] = useState(currentThaiYear);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');

  const handleShowQR = (asset: any) => {
    setSelectedAsset(asset);
    setShowQRModal(true);
  };

  const handleShowDetail = (asset: any) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบรายการวัสดุนี้?')) {
      deleteAsset(id);
    }
  };

  // Bulk Delete Logic
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredAssets.map(a => a.id)));
      setSelectAll(true);
    } else {
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    setSelectAll(newSelected.size === filteredAssets.length && filteredAssets.length > 0);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (window.confirm(`คุณแน่ใจหรือไม่ที่จะลบ ${selectedIds.size} รายการที่เลือก?`)) {
      await deleteAssetsBulk(Array.from(selectedIds));
      setSelectedIds(new Set());
      setSelectAll(false);
    }
  };

  const handleDeleteAll = async () => {
    if (filteredAssets.length === 0) return;
    if (window.confirm(`⚠️ คุณแน่ใจหรือไม่ที่จะลบวัสดุทั้งหมด ${filteredAssets.length} รายการที่แสดงอยู่?\n\nการกระทำนี้รวมถึงไฟล์รูปภาพและประวัติทั้งหมด!`)) {
      if (window.confirm('ยืนยันครั้งสุดท้าย: ลบทั้งหมดจริงหรือไม่?')) {
        await deleteAssetsBulk(filteredAssets.map(a => a.id));
        setSelectedIds(new Set());
        setSelectAll(false);
      }
    }
  };

  // Filter Logic
  const filteredAssets = assets.filter(asset => {
    // STRICT FILTER: ONLY SUPPLIES
    if (asset.budgetType !== BudgetType.SUPPLY) return false;

    const matchesYear = filterYear ? asset.fiscalYear === filterYear : true;
    const matchesStatus = filterStatus ? asset.status === filterStatus : true;
    const matchesType = filterType ? (asset.type === filterType || AssetTypeLabels[asset.type] === filterType) : true;
    const matchesSearch = searchTerm === '' ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.currentUser.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesStatus && matchesType && matchesSearch;
  });

  // Pagination Logic
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterYear, filterStatus, filterType, searchTerm]);

  const paginatedAssets = filteredAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const replacedAssetIds = new Set(assets.map(a => a.replacedAssetId).filter(Boolean));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ทะเบียนวัสดุ (Supplies) ({filterYear})</h1>
          <p className="text-slate-500">จัดการและตรวจสอบรายการวัสดุคอมพิวเตอร์ แยกตามปีงบประมาณ</p>
        </div>
        <Link
          to="/assets/new"
          className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap"
        >
          <Plus size={18} /> เพิ่มวัสดุใหม่
        </Link>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="ค้นหาชื่อ, รหัสวัสดุ, ผู้ใช้งาน..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <div className="w-40 shrink-0">
            <Select
              value={filterYear}
              onChange={setFilterYear}
              options={[
                ...[0, 1, 2, 3, 4, 5, 6].map(offset => {
                  const year = (parseInt(currentThaiYear) - offset).toString();
                  return { label: `ปี ${year} `, value: year };
                }),
                { label: 'ทุกปี', value: '' }
              ]}
              placeholder="เลือกปี"
              icon={<Calendar size={16} />}
            />
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1 hidden lg:block"></div>
          <div className="w-48 shrink-0">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { label: 'ทุกสถานะ', value: '' },
                ...Object.values(AssetStatus).map(s => ({ label: AssetStatusLabels[s] || s, value: s }))
              ]}
              placeholder="สถานะ"
            />
          </div>
          <div className="w-48 shrink-0">
            <Select
              value={filterType}
              onChange={setFilterType}
              options={[
                { label: 'ทุกประเภท', value: '' },
                ...(settings.commonAssetTypes && settings.commonAssetTypes.length > 0
                  ? (settings.commonAssetTypes.includes('Server') || settings.commonAssetTypes.includes('เครื่องแม่ข่าย')
                    ? settings.commonAssetTypes
                    : [...settings.commonAssetTypes, 'Server']).map(t => ({ label: t, value: t }))
                  : Object.entries(AssetTypeLabels).map(([key, label]) => ({ label, value: key }))
                )
              ]}
              placeholder="ประเภท"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 whitespace-nowrap shrink-0">
            <Filter size={18} /> ตัวกรอง
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {(selectedIds.size > 0 || (filteredAssets.length > 0 && selectedIds.size > 0)) && (
        <div className="bg-blue-50 px-4 py-2 rounded-lg border border-blue-100 flex items-center justify-between animate-fade-in mb-4">
          <div className="text-sm font-medium text-blue-800">
            {selectedIds.size > 0
              ? `เลือกอยู่ ${selectedIds.size} รายการ`
              : `แสดงผลทั้งหมด ${filteredAssets.length} รายการ`}
          </div>
          <div className="flex gap-2">
            {selectedIds.size > 0 ? (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm hover:bg-red-700 shadow-sm transition-colors"
              >
                <Trash2 size={16} /> ลบที่เลือก
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Bulk Actions Bar (Always visible if items exist, specific for Delete All) */}
      {filteredAssets.length > 0 && selectedIds.size === 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={handleDeleteAll}
            className="flex items-center gap-2 px-3 py-1.5 text-red-600 hover:bg-red-50 rounded-md text-sm transition-colors"
          >
            <Trash2 size={16} /> ลบทั้งหมด ({filteredAssets.length})
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-4 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll && filteredAssets.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="px-6 py-4">รหัสวัสดุ</th>
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
              {paginatedAssets.length > 0 ? (
                paginatedAssets.map((asset) => {
                  const isReplaced = replacedAssetIds.has(asset.id);
                  return (
                    <tr key={asset.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(asset.id) ? 'bg-blue-50/50' : ''} ${isReplaced ? 'bg-slate-50/50' : ''}`}>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(asset.id)}
                          onChange={() => handleSelectOne(asset.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4 cursor-pointer"
                        />
                      </td>
                      <td className="px-6 py-4 font-mono font-medium text-primary-700">
                        {asset.assetCode}
                        {isReplaced && <Lock size={12} className="inline ml-2 text-slate-400" />}
                      </td>
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
                      <td className="px-6 py-4">
                        {(() => {
                          const displayType = AssetTypeLabels[asset.type] || asset.type;
                          const getStyle = (t: string) => {
                            const lower = t.toLowerCase();
                            if (lower.includes('คอมพิวเตอร์') || lower.includes('computer')) return 'bg-blue-50 text-blue-700 border-blue-200';
                            if (lower.includes('จอภาพ') || lower.includes('monitor')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
                            if (lower.includes('เครื่องพิมพ์') || lower.includes('printer')) return 'bg-orange-50 text-orange-700 border-orange-200';
                            if (lower.includes('สำรองไฟ') || lower.includes('ups')) return 'bg-amber-50 text-amber-700 border-amber-200';
                            if (lower.includes('เครือข่าย') || lower.includes('network')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
                            if (lower.includes('server') || lower.includes('เครื่องแม่ข่าย')) return 'bg-violet-50 text-violet-700 border-violet-200';
                            return 'bg-slate-100 text-slate-700 border-slate-200';
                          };
                          return (
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStyle(displayType)}`}>
                              {displayType}
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold
                          ${asset.status === AssetStatus.NORMAL ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${asset.status === AssetStatus.BROKEN ? 'bg-red-100 text-red-700' : ''}
                          ${asset.status === AssetStatus.REPAIRING ? 'bg-amber-100 text-amber-700' : ''}
                          ${asset.status === AssetStatus.WITHDRAWN ? 'bg-slate-100 text-slate-700' : ''}
                          ${asset.status === AssetStatus.SOLD ? 'bg-gray-100 text-gray-700' : ''}
                          ${asset.status === AssetStatus.WAIT_FOR_DISPOSAL ? 'bg-orange-100 text-orange-700' : ''}
                        `}>
                          {AssetStatusLabels[asset.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleShowQR(asset)} className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg tooltip" title="QR Code">
                            <QrCode size={18} />
                          </button>
                          <button onClick={() => handleShowDetail(asset)} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg" title="ดูรายละเอียด">
                            <Eye size={18} />
                          </button>
                          {isReplaced ? (
                            <button className="p-2 text-slate-300 cursor-not-allowed rounded-lg" title="ไม่สามารถแก้ไขได้ (ถูกทดแทนแล้ว)" disabled>
                              <Lock size={18} />
                            </button>
                          ) : (
                            <>
                              <Link to={`/assets/${asset.id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="แก้ไข/รายละเอียด">
                                <Edit3 size={18} />
                              </Link>
                              <button onClick={() => handleDelete(asset.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="ลบ">
                                <Trash2 size={18} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-slate-400">
                    ไม่พบข้อมูลวัสดุสำหรับเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          totalItems={filteredAssets.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {showQRModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-scale-in">
            <div className="bg-slate-900 p-6 text-center text-white relative">
              <button onClick={() => setShowQRModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur"><QrCode size={32} /></div>
              <h3 className="text-xl font-bold">{selectedAsset.name}</h3>
              <p className="text-slate-400 text-sm mt-1">{selectedAsset.assetCode}</p>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="w-48 h-48 bg-slate-100 rounded-xl border-4 border-slate-900 flex items-center justify-center mb-6">
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${selectedAsset.assetCode}`} alt="QR Code" className="w-40 h-40 mix-blend-multiply" />
              </div>
              <button className="mt-6 w-full py-3 bg-primary-600 text-white rounded-lg font-bold shadow-lg hover:bg-primary-700 transition" onClick={() => window.alert('จำลองการพิมพ์สติ๊กเกอร์ QR Code')}>พิมพ์สติ๊กเกอร์</button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 p-6 text-white relative shrink-0">
              <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"><X size={20} /></button>
              <div className="flex items-start gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 cursor-zoom-in group relative" onClick={() => { if (selectedAsset.imageUrl) { setViewingImageUrl(`http://${window.location.hostname}:3008${selectedAsset.imageUrl}`); setIsImageModalOpen(true); } }}>
                  {selectedAsset.imageUrl ? (
                    <>
                      <img src={`http://${window.location.hostname}:3008${selectedAsset.imageUrl}`} alt={selectedAsset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Maximize className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400"><Monitor size={32} /></div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedAsset.name}</h3>
                  <p className="text-slate-500 flex items-center gap-2 mt-1">
                    <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-600">{selectedAsset.assetCode}</span>
                    {selectedAsset.serialNumber && <span className="text-sm">S/N: {selectedAsset.serialNumber}</span>}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex-1 min-w-[150px]"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ปีงบประมาณ</span><p className="font-semibold text-slate-700">{selectedAsset.fiscalYear}</p></div>
                  <div className="flex-1 min-w-[150px]"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะ</span><div><span className="inline-flex px-2 py-0.5 rounded-full text-xs font-bold mt-1 bg-slate-200">{AssetStatusLabels[selectedAsset.status]}</span></div></div>
                  <div className="flex-1 min-w-[150px]"><span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ประเภท</span><p className="font-semibold text-slate-700">{AssetTypeLabels[selectedAsset.type]}</p></div>
                </div>
                {/* Simplified Details View for Supply */}
                <div><h4 className="font-bold border-b pb-2 mb-2">ข้อมูล</h4>
                  <p className="text-sm">ผู้รับผิดชอบ: {selectedAsset.currentUser}</p>
                  <p className="text-sm">หน่วยงาน: {selectedAsset.department}</p>
                  <p className="text-sm">สถานที่: {selectedAsset.location}</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 mt-4">
                <button onClick={() => setShowDetailModal(false)} className="px-4 py-2 bg-white border border-slate-200">ปิด</button>
                <Link to={`/assets/${selectedAsset.id}`} className="px-4 py-2 bg-primary-600 text-white rounded-lg">แก้ไข</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAsset && (
        <ImageModal
          isOpen={isImageModalOpen}
          imageUrl={viewingImageUrl}
          onClose={() => setIsImageModalOpen(false)}
          altText={selectedAsset.name}
        />
      )}
    </div>
  );
};

export default SupplyList;