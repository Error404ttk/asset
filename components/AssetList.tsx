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
  Maximize // Added Maximize icon for image zoom
} from 'lucide-react';
import { AssetStatus, AssetType, AssetStatusLabels, AssetTypeLabels } from '../types';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import Select from './ui/Select';
import ImageModal from './ui/ImageModal'; // Imported ImageModal

const AssetList: React.FC = () => {
  const { assets, deleteAsset, settings } = useAssets(); // Use Context
  const [showQRModal, setShowQRModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);

  // Image Lightbox State
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [viewingImageUrl, setViewingImageUrl] = useState('');

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

  const handleShowDetail = (asset: any) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
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
    const matchesType = filterType ? (asset.type === filterType || AssetTypeLabels[asset.type] === filterType) : true;
    const matchesSearch = searchTerm === '' ||
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.assetCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.currentUser.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesYear && matchesStatus && matchesType && matchesSearch;
  });

  // Pre-calculate replaced asset IDs for locking
  const replacedAssetIds = new Set(assets.map(a => a.replacedAssetId).filter(Boolean));

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
        {/* Responsive Filters - Wrap on mobile instead of scroll to prevent dropdown clipping */}
        <div className="flex flex-wrap gap-2 items-center">

          {/* Year Filter */}
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
                // Use settings options if available to include custom types, otherwise fallback to Enums
                ...(settings.commonAssetTypes && settings.commonAssetTypes.length > 0
                  ? (settings.commonAssetTypes.includes('Server') || settings.commonAssetTypes.includes('เครื่องแม่ข่าย')
                    ? settings.commonAssetTypes
                    : [...settings.commonAssetTypes, 'Server']).map(t => ({ label: t, value: t }))
                  : Object.entries(AssetTypeLabels).map(([key, label]) => ({ label, value: key })) // Use Keys for value if using Enum logic
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

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 min-w-[900px]">
            <thead className="bg-slate-50 text-slate-700 uppercase font-bold text-xs sticky top-0 z-10 shadow-sm">
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
                filteredAssets.map((asset) => {
                  const isReplaced = replacedAssetIds.has(asset.id);
                  return (
                    <tr key={asset.id} className={`hover: bg - slate - 50 transition - colors ${isReplaced ? 'bg-slate-50/50' : ''} `}>
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
                        <span className={`px - 2 py - 1 rounded - full text - xs font - semibold
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
                          <button
                            onClick={() => handleShowDetail(asset)}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg"
                            title="ดูรายละเอียด"
                          >
                            <Eye size={18} />
                          </button>
                          {isReplaced ? (
                            <button
                              className="p-2 text-slate-300 cursor-not-allowed rounded-lg"
                              title="ไม่สามารถแก้ไขได้ (ถูกทดแทนแล้ว)"
                              disabled
                            >
                              <Lock size={18} />
                            </button>
                          ) : (
                            <>
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
              </div >
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
            </div >
          </div >
        </div >
      )}

      {/* Asset Detail Modal */}
      {
        showDetailModal && selectedAsset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
              <div className="bg-slate-900 p-6 text-white relative shrink-0">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/50 p-1 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
                <div className="flex items-start gap-4">
                  <div
                    className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 cursor-zoom-in group relative"
                    onClick={() => {
                      if (selectedAsset.imageUrl) {
                        setViewingImageUrl(`http://${window.location.hostname}:3008${selectedAsset.imageUrl}`);
                        setIsImageModalOpen(true);
                      }
                    }}
                  >
                    {selectedAsset.imageUrl ? (
                      <>
                        <img
                          src={`http://${window.location.hostname}:3008${selectedAsset.imageUrl}`}
                          alt={selectedAsset.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <Maximize className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" size={24} />
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400">
                        <Monitor size={32} />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">{selectedAsset.name}</h3>
                    <p className="text-slate-500 flex items-center gap-2 mt-1">
                      <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-sm text-slate-600">
                        {selectedAsset.assetCode}
                      </span>
                      {selectedAsset.serialNumber && (
                        <span className="text-sm">S/N: {selectedAsset.serialNumber}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* Status Section */}
                  <div className="md:col-span-2 flex flex-wrap gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex-1 min-w-[150px]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ปีงบประมาณ</span>
                      <p className="font-semibold text-slate-700">{selectedAsset.fiscalYear}</p>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">สถานะ</span>
                      <div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-bold mt-1
                          ${selectedAsset.status === AssetStatus.NORMAL ? 'bg-emerald-100 text-emerald-700' : ''}
                          ${selectedAsset.status === AssetStatus.BROKEN ? 'bg-red-100 text-red-700' : ''}
                          ${selectedAsset.status === AssetStatus.REPAIRING ? 'bg-amber-100 text-amber-700' : ''}
                        `}>{AssetStatusLabels[selectedAsset.status]}</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">ประเภท</span>
                      <p className="font-semibold text-slate-700">{AssetTypeLabels[selectedAsset.type]}</p>
                    </div>
                  </div>

                  {/* Replacement Info (If applicable) */}
                  {(selectedAsset.replacedAssetId || assets.some((a: any) => a.replacedAssetId === selectedAsset.id)) && (
                    <div className="md:col-span-2 bg-orange-50 border border-orange-100 rounded-xl p-4">
                      <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                        <History size={18} /> ประวัติการทดแทน (Replacement History)
                      </h4>

                      {/* Case 1: This asset replaces an old one */}
                      {selectedAsset.replacedAssetId && (
                        <div className="flex items-start gap-3 text-sm">
                          <div className="bg-orange-100 p-2 rounded text-orange-600 mt-1">
                            <RefreshCcw size={16} />
                          </div>
                          <div>
                            <p className="font-bold text-slate-700">ครุภัณฑ์นี้จัดซื้อทดแทนเครื่องเดิม:</p>
                            {(() => {
                              const oldAsset = assets.find((a: any) => a.id === selectedAsset.replacedAssetId);
                              return oldAsset ? (
                                <div className="bg-white border border-orange-200 rounded p-2 mt-1">
                                  <p className="font-mono text-orange-700 font-bold">{oldAsset.assetCode}</p>
                                  <p className="text-slate-600">{oldAsset.name}</p>
                                  <p className="text-xs text-slate-400 mt-0.5">สถานะปัจจุบัน: {oldAsset.status}</p>
                                </div>
                              ) : (
                                <p className="text-slate-500 italic">ไม่พบข้อมูลเครื่องเดิม (ID: {selectedAsset.replacedAssetId})</p>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Case 2: This asset was replaced by a new one */}
                      {(() => {
                        const newReplacement = assets.find((a: any) => a.replacedAssetId === selectedAsset.id);
                        return newReplacement ? (
                          <div className="flex items-start gap-3 text-sm mt-3 pt-3 border-t border-orange-200">
                            <div className="bg-red-100 p-2 rounded text-red-600 mt-1">
                              <Trash2 size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-red-700">ครุภัณฑ์นี้ถูกจำหน่าย/ทดแทนแล้ว โดย:</p>
                              <div className="bg-white border border-red-200 rounded p-2 mt-1">
                                <p className="font-mono text-emerald-700 font-bold">{newReplacement.assetCode}</p>
                                <p className="text-slate-600">{newReplacement.name}</p>
                                <Link to={`/assets/${newReplacement.id}`} className="text-xs text-blue-500 underline mt-1 inline-block" onClick={() => setShowDetailModal(false)}>
                                  ดูเครื่องใหม่
                                </Link>
                              </div>
                            </div>
                          </div>
                        ) : null;
                      })()}
                    </div>
                  )}

                  {/* Location Info */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                      <MapPin size={18} className="text-primary-500" /> ข้อมูลการใช้งาน
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">ผู้รับผิดชอบ:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.currentUser || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">หน่วยงาน:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.department || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">สถานที่ตั้ง:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.location || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">วันที่ได้รับ:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.acquiredDate ? new Date(selectedAsset.acquiredDate).toLocaleDateString('th-TH') : '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Specs Info */}
                  <div>
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                      <Cpu size={18} className="text-primary-500" /> สเปค/ข้อมูลเทคนิค
                    </h4>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">CPU:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.cpu || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">RAM:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.ram || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Storage:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.storage || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">OS:</span>
                        <span className="font-medium text-slate-800">{selectedAsset.os || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">License:</span>
                        <span className="font-medium text-slate-800">
                          {selectedAsset.licenseType ? (
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border
                             ${selectedAsset.licenseType === 'OEM' ? 'bg-blue-50 text-blue-700 border-blue-200' : ''}
                             ${selectedAsset.licenseType === 'Volume' ? 'bg-purple-50 text-purple-700 border-purple-200' : ''}
                             ${selectedAsset.licenseType === 'FPP' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                             ${!['OEM', 'Volume', 'FPP'].includes(selectedAsset.licenseType) ? 'bg-slate-50 text-slate-700 border-slate-200' : ''}
                           `}>
                              {selectedAsset.licenseType}
                            </span>
                          ) : '-'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">S/N:</span>
                        <span className="font-medium text-slate-800 font-mono">{selectedAsset.serialNumber || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance History Preview */}
                  <div className="md:col-span-2">
                    <h4 className="font-bold text-slate-800 mb-3 flex items-center gap-2 border-b pb-2">
                      <History size={18} className="text-primary-500" /> ประวัติการซ่อมบำรุงล่าสุด
                    </h4>
                    {selectedAsset.maintenanceHistory && selectedAsset.maintenanceHistory.length > 0 ? (
                      <div className="bg-slate-50 rounded-lg border border-slate-100 overflow-hidden text-sm">
                        <table className="w-full text-left">
                          <thead className="bg-slate-100 text-slate-500 font-medium">
                            <tr>
                              <th className="px-3 py-2">วันที่</th>
                              <th className="px-3 py-2">อาการ/รายละเอียด</th>
                              <th className="px-3 py-2 text-right">ค่าใช้จ่าย</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {selectedAsset.maintenanceHistory.slice(0, 3).map((log: any, idx: number) => (
                              <tr key={idx}>
                                <td className="px-3 py-2 whitespace-nowrap text-slate-600">{new Date(log.date).toLocaleDateString('th-TH')}</td>
                                <td className="px-3 py-2 text-slate-800">{log.description}</td>
                                <td className="px-3 py-2 text-right font-mono text-slate-600">{log.cost.toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {selectedAsset.maintenanceHistory.length > 3 && (
                          <div className="px-3 py-2 text-center text-xs text-slate-400 border-t border-slate-200">
                            มีอีก {selectedAsset.maintenanceHistory.length - 3} รายการ...
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-slate-400 text-sm text-center py-4 bg-slate-50 rounded-lg dashed-border">ยังไม่มีประวัติการซ่อมบำรุง</p>
                    )}
                  </div>

                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  ปิดหน้าต่าง
                </button>
                {replacedAssetIds.has(selectedAsset.id) ? (
                  <button
                    disabled
                    className="px-4 py-2 bg-slate-100 text-slate-400 rounded-lg font-medium cursor-not-allowed flex items-center gap-2"
                    title="ไม่สามารถแก้ไขได้ เนื่องจากถูกทดแทนแล้ว"
                  >
                    <Lock size={16} /> ถูกจำหน่าย/ทดแทนแล้ว
                  </button>
                ) : (
                  <Link
                    to={`/assets/${selectedAsset.id}`}
                    className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded-lg font-medium transition-colors shadow-sm flex items-center gap-2"
                  >
                    <Edit3 size={16} /> แก้ไขข้อมูลเต็ม
                  </Link>
                )}
              </div>
            </div>
          </div>
        )
      }
      {/* Image Lightbox */}
      {
        selectedAsset && ( // Only render ImageModal if an asset is selected, to ensure altText is available
          <ImageModal
            isOpen={isImageModalOpen}
            imageUrl={viewingImageUrl}
            onClose={() => setIsImageModalOpen(false)}
            altText={selectedAsset.name}
          />
        )
      }
    </div >
  );
};

export default AssetList;