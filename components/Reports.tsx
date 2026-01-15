import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { FileText, TrendingUp, PackagePlus, AlertTriangle, Archive, Download } from 'lucide-react';
import { useAssets } from '../context/AssetContext';
import { AssetStatus } from '../types';

const Reports: React.FC = () => {
  const { assets } = useAssets();

  // Calculate stats from Real Context Data
  const yearlyStats = useMemo(() => {
    // 1. Group by Year
    const statsByYear: Record<string, { year: string, newAcquired: number, broken: number, disposed: number, totalSurvey: number }> = {};
    
    // Initialize last 3 years
    const currentYear = 2567;
    for (let i = 0; i < 3; i++) {
        const y = (currentYear - i).toString();
        statsByYear[y] = { year: y, newAcquired: 0, broken: 0, disposed: 0, totalSurvey: 0 };
    }

    assets.forEach(asset => {
      const year = asset.fiscalYear || 'Unknown';
      
      if (!statsByYear[year]) {
         statsByYear[year] = { year, newAcquired: 0, broken: 0, disposed: 0, totalSurvey: 0 };
      }

      statsByYear[year].totalSurvey++;
      
      // Assumption: Acquired in the same fiscal year = New
      // In a real app, compare acquiredDate year with fiscalYear
      statsByYear[year].newAcquired++; 

      if (asset.status === AssetStatus.BROKEN || asset.status === AssetStatus.REPAIRING) {
        statsByYear[year].broken++;
      }
      
      if (asset.status === AssetStatus.SOLD || asset.status === AssetStatus.WITHDRAWN) {
        statsByYear[year].disposed++;
      }
    });

    return Object.values(statsByYear).sort((a, b) => a.year.localeCompare(b.year));
  }, [assets]);

  // Calculate totals for summary cards
  const totalAcquired = assets.length; // Simplified for "Total Assets in System"
  const totalBroken = assets.filter(a => a.status === AssetStatus.BROKEN || a.status === AssetStatus.REPAIRING).length;
  const totalDisposed = assets.filter(a => a.status === AssetStatus.SOLD || a.status === AssetStatus.WITHDRAWN).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">รายงานสรุปครุภัณฑ์ประจำปี</h1>
          <p className="text-slate-500">สถิติเปรียบเทียบการได้มา, ชำรุด และจำหน่าย แยกตามปีงบประมาณ</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 shadow-sm transition-colors">
          <Download size={18} /> ดาวน์โหลด Excel
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <PackagePlus size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">ครุภัณฑ์ในระบบทั้งหมด</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalAcquired} <span className="text-sm font-normal text-slate-400">รายการ</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">ชำรุด/เสียสะสม</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalBroken} <span className="text-sm font-normal text-slate-400">รายการ</span></h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="p-3 bg-slate-100 text-slate-600 rounded-lg">
            <Archive size={24} />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">จำหน่ายออกแล้ว</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalDisposed} <span className="text-sm font-normal text-slate-400">รายการ</span></h3>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-6">
           <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
             <TrendingUp size={20} className="text-slate-400"/> 
             เปรียบเทียบสถิติรายปี (จากข้อมูลจริง)
           </h2>
        </div>
        
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={yearlyStats}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="newAcquired" name="สำรวจพบ (เครื่อง)" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50} />
              <Bar dataKey="broken" name="ชำรุด/เสีย (เครื่อง)" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={50} />
              <Bar dataKey="disposed" name="จำหน่ายออก (เครื่อง)" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText size={20} className="text-slate-400"/> 
            ตารางสรุปข้อมูลแยกตามปี
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">ปีงบประมาณ</th>
                <th className="px-6 py-4 text-center text-blue-700 bg-blue-50">สำรวจพบ</th>
                <th className="px-6 py-4 text-center text-amber-700 bg-amber-50">ชำรุด/ซ่อม</th>
                <th className="px-6 py-4 text-center text-slate-700 bg-slate-100">จำหน่ายออก</th>
                <th className="px-6 py-4 text-right">จำนวนสำรวจรวม</th>
                <th className="px-6 py-4 text-right">อัตราการเสีย (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {yearlyStats.map((stat, index) => (
                <tr key={index} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-800">{stat.year}</td>
                  <td className="px-6 py-4 text-center font-medium">{stat.newAcquired}</td>
                  <td className="px-6 py-4 text-center font-medium">{stat.broken}</td>
                  <td className="px-6 py-4 text-center font-medium">{stat.disposed}</td>
                  <td className="px-6 py-4 text-right font-mono">{stat.totalSurvey.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold
                      ${(stat.broken / stat.totalSurvey) > 0.05 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}
                    `}>
                      {stat.totalSurvey > 0 ? ((stat.broken / stat.totalSurvey) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;