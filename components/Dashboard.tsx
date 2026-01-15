import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import {
  Monitor,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  Calendar,
  Download,
  Loader
} from 'lucide-react';
import { StatCardProps, AssetStatus } from '../types';
import { useAssets } from '../context/AssetContext';
import Select from './ui/Select';

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass, trend }) => (
  <div className="bg-white rounded-xl shadow-sm p-6 flex items-start justify-between border border-slate-100 hover:shadow-md transition-shadow">
    <div>
      <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
      <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
      {trend && <p className="text-xs text-slate-400 mt-2 flex items-center gap-1"><TrendingUp size={12} /> {trend}</p>}
    </div>
    <div className={`p-3 rounded-lg ${colorClass} text-white shadow-md`}>
      {icon}
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { assets, isLoading } = useAssets();
  const [selectedYear, setSelectedYear] = useState('2568');

  // Dynamic Fiscal Years
  const currentYearBE = new Date().getFullYear() + 543;
  const fiscalYears = Array.from({ length: 6 }, (_, i) => currentYearBE + 1 - i);

  // Calculate Real Stats based on Assets Context
  const filteredAssets = assets.filter(a => a.fiscalYear === selectedYear);
  const totalAssets = filteredAssets.length;
  const normalAssets = filteredAssets.filter(a => a.status === AssetStatus.NORMAL).length;
  const brokenAssets = filteredAssets.filter(a => a.status === AssetStatus.BROKEN).length;
  const repairAssets = filteredAssets.filter(a => a.status === AssetStatus.REPAIRING).length;
  const soldAssets = filteredAssets.filter(a => a.status === AssetStatus.SOLD).length;

  // Real stats state
  const [dataRepairs, setDataRepairs] = useState<{ name: string; repairs: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const stats = await api.getMaintenanceStats(selectedYear);
        setDataRepairs(stats);
      } catch (err) {
        console.error("Failed to fetch maintenance stats", err);
      }
    };

    fetchStats();
  }, [selectedYear]);

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="text-center text-slate-500">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-2 text-primary-500" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ</h1>
          <div className="flex items-center gap-2 text-slate-500 mt-1 text-sm sm:text-base">
            <Calendar size={16} />
            <span>ข้อมูลการสำรวจประจำปีงบประมาณ {selectedYear}</span>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="w-48">
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              options={fiscalYears.map(y => y.toString())}
              placeholder="เลือกปีงบประมาณ"
            />
          </div>
          <button className="flex justify-center items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">
            <Download size={16} />
            <span>รายงาน ({selectedYear})</span>
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 animate-fade-in">
        <StatCard
          title="ครุภัณฑ์ทั้งหมด (ปีนี้)"
          value={totalAssets}
          icon={<Monitor size={24} />}
          colorClass="bg-blue-500"
        />
        <StatCard
          title="ใช้งานปกติ"
          value={normalAssets}
          icon={<CheckCircle size={24} />}
          colorClass="bg-emerald-500"
          trend={totalAssets > 0 ? `${((normalAssets / totalAssets) * 100).toFixed(1)}%` : "0%"}
        />
        <StatCard
          title="ส่งซ่อมบำรุง"
          value={repairAssets}
          icon={<AlertTriangle size={24} />}
          colorClass="bg-amber-500"
        />
        <StatCard
          title="จำหน่าย/ตัดยอด"
          value={soldAssets}
          icon={<Clock size={24} />}
          colorClass="bg-slate-500"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">สัดส่วนสถานะ ({selectedYear})</h3>
          <div className="h-64 w-full">
            {totalAssets > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'ใช้งานปกติ', value: normalAssets, color: '#10b981' },
                      { name: 'ชำรุด', value: brokenAssets, color: '#ef4444' },
                      { name: 'ซ่อมบำรุง', value: repairAssets, color: '#f59e0b' },
                      { name: 'จำหน่ายแล้ว', value: soldAssets, color: '#64748b' },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {[0, 1, 2, 3].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={[
                        '#10b981', '#ef4444', '#f59e0b', '#64748b'
                      ][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">ไม่มีข้อมูลในปีงบประมาณนี้</div>
            )}
          </div>
        </div>

        {/* Repair Trend Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">สถิติการแจ้งซ่อม</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataRepairs}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="repairs" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;