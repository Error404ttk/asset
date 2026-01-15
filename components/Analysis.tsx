import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    AlertTriangle,
    Clock,
    BarChart3,
    PieChart,
    Activity,
    Target,
    Wrench,
    Calendar,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    AlertCircle,
    RefreshCw
} from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { Asset, AssetStatus, AssetType } from '../types';

const Analysis: React.FC = () => {
    const { assets } = useAssets();
    const [selectedView, setSelectedView] = useState<'overview' | 'age' | 'maintenance' | 'recommendations'>('overview');

    // Calculate statistics
    const totalAssets = assets.length;
    const normalAssets = assets.filter(a => a.status === AssetStatus.NORMAL).length;
    const brokenAssets = assets.filter(a => a.status === AssetStatus.BROKEN).length;
    const repairingAssets = assets.filter(a => a.status === AssetStatus.REPAIRING).length;

    // Age analysis (assets older than 5 years)
    const currentYear = new Date().getFullYear();
    const getAssetAge = (asset: Asset) => {
        if (!asset.acquiredDate) return 0;
        const acquiredYear = new Date(asset.acquiredDate).getFullYear();
        return currentYear - acquiredYear;
    };

    const oldAssets = assets.filter(a => getAssetAge(a) >= 5);
    const veryOldAssets = assets.filter(a => getAssetAge(a) >= 7);

    // Warranty analysis
    const today = new Date();
    const assetsNearWarrantyEnd = assets.filter(a => {
        if (!a.warrantyExpireDate) return false;
        const warranty = new Date(a.warrantyExpireDate);
        const daysLeft = Math.ceil((warranty.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysLeft > 0 && daysLeft <= 90;
    });

    const assetsExpiredWarranty = assets.filter(a => {
        if (!a.warrantyExpireDate) return false;
        return new Date(a.warrantyExpireDate) < today;
    });

    // Group by type
    const assetsByType = Object.values(AssetType).map(type => ({
        type,
        count: assets.filter(a => a.type === type).length,
        broken: assets.filter(a => a.type === type && a.status === AssetStatus.BROKEN).length
    }));

    // Group by department
    const departments = [...new Set(assets.map(a => a.department).filter(Boolean))];
    const assetsByDepartment = departments.map(dept => ({
        department: dept,
        count: assets.filter(a => a.department === dept).length,
        broken: assets.filter(a => a.department === dept && a.status === AssetStatus.BROKEN).length
    })).sort((a, b) => b.count - a.count);

    // Recommendations
    const recommendations = [
        ...oldAssets.map(a => ({
            type: 'age' as const,
            asset: a,
            message: `ครุภัณฑ์อายุ ${getAssetAge(a)} ปี ควรพิจารณาเปลี่ยนทดแทน`,
            priority: getAssetAge(a) >= 7 ? 'high' : 'medium'
        })),
        ...assets.filter(a => a.status === AssetStatus.BROKEN).map(a => ({
            type: 'broken' as const,
            asset: a,
            message: 'ครุภัณฑ์ชำรุด ต้องซ่อมแซมหรือจำหน่าย',
            priority: 'high' as const
        })),
        ...assetsNearWarrantyEnd.map(a => ({
            type: 'warranty' as const,
            asset: a,
            message: 'ประกันใกล้หมดอายุ ควรตรวจสอบและวางแผน',
            priority: 'medium' as const
        }))
    ].slice(0, 20); // Limit to 20 items

    const StatCard = ({ title, value, subtitle, icon, color }: {
        title: string;
        value: number | string;
        subtitle?: string;
        icon: React.ReactNode;
        color: string
    }) => (
        <div className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow`}>
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500 font-medium">{title}</p>
                    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                    {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
                </div>
                <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('600', '100').replace('700', '100')}`}>
                    {icon}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">วิเคราะห์ ประเมิน และปรับปรุง</h1>
                    <p className="text-slate-500">วิเคราะห์สถานะครุภัณฑ์และวางแผนปรับปรุง</p>
                </div>

                {/* View Tabs */}
                <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                    {[
                        { key: 'overview', label: 'ภาพรวม', icon: <BarChart3 size={16} /> },
                        { key: 'age', label: 'วิเคราะห์อายุ', icon: <Clock size={16} /> },
                        { key: 'maintenance', label: 'การบำรุงรักษา', icon: <Wrench size={16} /> },
                        { key: 'recommendations', label: 'ข้อเสนอแนะ', icon: <Target size={16} /> }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedView(tab.key as any)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedView === tab.key
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-slate-600 hover:text-slate-800'
                                }`}
                        >
                            {tab.icon}
                            <span className="hidden sm:inline">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Overview View */}
            {selectedView === 'overview' && (
                <>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            title="ครุภัณฑ์ทั้งหมด"
                            value={totalAssets}
                            icon={<BarChart3 size={24} className="text-blue-600" />}
                            color="text-blue-600"
                        />
                        <StatCard
                            title="สถานะปกติ"
                            value={normalAssets}
                            subtitle={`${totalAssets > 0 ? Math.round((normalAssets / totalAssets) * 100) : 0}%`}
                            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                            color="text-emerald-600"
                        />
                        <StatCard
                            title="ชำรุด/ซ่อมแซม"
                            value={brokenAssets + repairingAssets}
                            subtitle={`${brokenAssets} ชำรุด, ${repairingAssets} กำลังซ่อม`}
                            icon={<AlertTriangle size={24} className="text-amber-600" />}
                            color="text-amber-600"
                        />
                        <StatCard
                            title="อายุเกิน 5 ปี"
                            value={oldAssets.length}
                            subtitle={`รวม ${veryOldAssets.length} เครื่องอายุเกิน 7 ปี`}
                            icon={<Clock size={24} className="text-red-600" />}
                            color="text-red-600"
                        />
                    </div>

                    {/* Charts Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* By Type */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <PieChart size={20} className="text-primary-500" />
                                จำนวนตามประเภท
                            </h3>
                            <div className="space-y-3">
                                {assetsByType.filter(t => t.count > 0).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-24 text-sm text-slate-600 truncate">{item.type}</div>
                                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-primary-500 to-primary-400 h-full rounded-full flex items-center justify-end pr-2"
                                                style={{ width: `${Math.max((item.count / totalAssets) * 100, 10)}%` }}
                                            >
                                                <span className="text-xs font-medium text-white">{item.count}</span>
                                            </div>
                                        </div>
                                        {item.broken > 0 && (
                                            <span className="text-xs text-red-500 flex items-center gap-1">
                                                <XCircle size={12} /> {item.broken}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* By Department */}
                        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Activity size={20} className="text-indigo-500" />
                                จำนวนตามหน่วยงาน (Top 5)
                            </h3>
                            <div className="space-y-3">
                                {assetsByDepartment.slice(0, 5).map((item, idx) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className="w-32 text-sm text-slate-600 truncate">{item.department || 'ไม่ระบุ'}</div>
                                        <div className="flex-1 bg-slate-100 rounded-full h-6 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full flex items-center justify-end pr-2"
                                                style={{ width: `${Math.max((item.count / totalAssets) * 100, 10)}%` }}
                                            >
                                                <span className="text-xs font-medium text-white">{item.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Age Analysis View */}
            {selectedView === 'age' && (
                <div className="space-y-6">
                    {/* Age Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="อายุ 0-4 ปี"
                            value={assets.filter(a => getAssetAge(a) < 5).length}
                            subtitle="สภาพดี"
                            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                            color="text-emerald-600"
                        />
                        <StatCard
                            title="อายุ 5-6 ปี"
                            value={assets.filter(a => getAssetAge(a) >= 5 && getAssetAge(a) < 7).length}
                            subtitle="ควรเฝ้าระวัง"
                            icon={<AlertCircle size={24} className="text-amber-600" />}
                            color="text-amber-600"
                        />
                        <StatCard
                            title="อายุ 7 ปีขึ้นไป"
                            value={veryOldAssets.length}
                            subtitle="ควรเปลี่ยนทดแทน"
                            icon={<AlertTriangle size={24} className="text-red-600" />}
                            color="text-red-600"
                        />
                    </div>

                    {/* Old Assets List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800">รายการครุภัณฑ์อายุเกิน 5 ปี ({oldAssets.length} รายการ)</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">รหัสครุภัณฑ์</th>
                                        <th className="px-4 py-3 text-left">ชื่อ</th>
                                        <th className="px-4 py-3 text-left">ประเภท</th>
                                        <th className="px-4 py-3 text-center">อายุ (ปี)</th>
                                        <th className="px-4 py-3 text-center">สถานะ</th>
                                        <th className="px-4 py-3 text-left">หน่วยงาน</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {oldAssets.slice(0, 15).map(asset => (
                                        <tr key={asset.id} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 font-mono text-xs">{asset.assetCode}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{asset.name}</td>
                                            <td className="px-4 py-3 text-slate-600">{asset.type}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getAssetAge(asset) >= 7 ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {getAssetAge(asset)} ปี
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${asset.status === AssetStatus.NORMAL ? 'bg-emerald-100 text-emerald-700' :
                                                        asset.status === AssetStatus.BROKEN ? 'bg-red-100 text-red-700' :
                                                            'bg-slate-100 text-slate-600'
                                                    }`}>
                                                    {asset.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{asset.department}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {oldAssets.length > 15 && (
                                <div className="p-4 text-center text-sm text-slate-500 border-t border-slate-100">
                                    และอีก {oldAssets.length - 15} รายการ...
                                </div>
                            )}
                            {oldAssets.length === 0 && (
                                <div className="p-10 text-center text-slate-400">
                                    ไม่มีครุภัณฑ์ที่อายุเกิน 5 ปี
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Maintenance View */}
            {selectedView === 'maintenance' && (
                <div className="space-y-6">
                    {/* Warranty Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="ประกันยังไม่หมดอายุ"
                            value={assets.filter(a => a.warrantyExpireDate && new Date(a.warrantyExpireDate) > today).length}
                            icon={<CheckCircle2 size={24} className="text-emerald-600" />}
                            color="text-emerald-600"
                        />
                        <StatCard
                            title="ประกันใกล้หมด (90 วัน)"
                            value={assetsNearWarrantyEnd.length}
                            icon={<AlertCircle size={24} className="text-amber-600" />}
                            color="text-amber-600"
                        />
                        <StatCard
                            title="ประกันหมดอายุแล้ว"
                            value={assetsExpiredWarranty.length}
                            icon={<XCircle size={24} className="text-red-600" />}
                            color="text-red-600"
                        />
                    </div>

                    {/* Broken/Repairing Assets */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Wrench size={18} className="text-amber-500" />
                                ครุภัณฑ์ที่ต้องซ่อมบำรุง ({brokenAssets + repairingAssets} รายการ)
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 text-slate-600">
                                    <tr>
                                        <th className="px-4 py-3 text-left">รหัสครุภัณฑ์</th>
                                        <th className="px-4 py-3 text-left">ชื่อ</th>
                                        <th className="px-4 py-3 text-center">สถานะ</th>
                                        <th className="px-4 py-3 text-left">หน่วยงาน</th>
                                        <th className="px-4 py-3 text-left">ผู้ครอบครอง</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {assets.filter(a => a.status === AssetStatus.BROKEN || a.status === AssetStatus.REPAIRING)
                                        .slice(0, 15)
                                        .map(asset => (
                                            <tr key={asset.id} className="hover:bg-slate-50">
                                                <td className="px-4 py-3 font-mono text-xs">{asset.assetCode}</td>
                                                <td className="px-4 py-3 font-medium text-slate-800">{asset.name}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${asset.status === AssetStatus.BROKEN ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                        }`}>
                                                        {asset.status === AssetStatus.BROKEN ? 'ชำรุด' : 'กำลังซ่อม'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-slate-600">{asset.department}</td>
                                                <td className="px-4 py-3 text-slate-600">{asset.currentUser}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                            {(brokenAssets + repairingAssets) === 0 && (
                                <div className="p-10 text-center text-slate-400">
                                    ไม่มีครุภัณฑ์ที่ต้องซ่อมบำรุง
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations View */}
            {selectedView === 'recommendations' && (
                <div className="space-y-6">
                    {/* Recommendations Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StatCard
                            title="ข้อเสนอแนะทั้งหมด"
                            value={recommendations.length}
                            icon={<Target size={24} className="text-primary-600" />}
                            color="text-primary-600"
                        />
                        <StatCard
                            title="ความสำคัญสูง"
                            value={recommendations.filter(r => r.priority === 'high').length}
                            icon={<AlertTriangle size={24} className="text-red-600" />}
                            color="text-red-600"
                        />
                        <StatCard
                            title="ความสำคัญปานกลาง"
                            value={recommendations.filter(r => r.priority === 'medium').length}
                            icon={<AlertCircle size={24} className="text-amber-600" />}
                            color="text-amber-600"
                        />
                    </div>

                    {/* Recommendations List */}
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Target size={18} className="text-primary-500" />
                                รายการข้อเสนอแนะ
                            </h3>
                        </div>
                        <div className="divide-y divide-slate-100">
                            {recommendations.length > 0 ? recommendations.map((rec, idx) => (
                                <div key={idx} className="p-4 hover:bg-slate-50 flex items-start gap-4">
                                    <div className={`p-2 rounded-lg ${rec.priority === 'high' ? 'bg-red-100' : 'bg-amber-100'
                                        }`}>
                                        {rec.type === 'age' && <Clock size={20} className={rec.priority === 'high' ? 'text-red-600' : 'text-amber-600'} />}
                                        {rec.type === 'broken' && <AlertTriangle size={20} className="text-red-600" />}
                                        {rec.type === 'warranty' && <Calendar size={20} className="text-amber-600" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-medium text-slate-800">{rec.asset.name}</span>
                                            <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                                {rec.asset.assetCode}
                                            </span>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${rec.priority === 'high' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {rec.priority === 'high' ? 'สำคัญสูง' : 'สำคัญปานกลาง'}
                                            </span>
                                        </div>
                                        <p className="text-sm text-slate-600">{rec.message}</p>
                                        <p className="text-xs text-slate-400 mt-1">หน่วยงาน: {rec.asset.department || 'ไม่ระบุ'}</p>
                                    </div>
                                    <button className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded-lg transition-colors">
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            )) : (
                                <div className="p-10 text-center text-slate-400 flex flex-col items-center gap-2">
                                    <RefreshCw size={32} className="text-slate-300" />
                                    <p>ไม่มีข้อเสนอแนะในขณะนี้</p>
                                    <p className="text-sm">ครุภัณฑ์ทั้งหมดอยู่ในสภาพดี</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analysis;
