import React from 'react';
import { AssetLog } from '../types';
import { Search, Calendar, User, FileText, PlusCircle, Trash2, Edit, ArrowRightLeft, AlertCircle, Settings } from 'lucide-react';

import { api } from '../services/api';

const AuditLog: React.FC = () => {
  const [logs, setLogs] = React.useState<AssetLog[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const data = await api.getLogs();
      setLogs(data);
    } catch (err) {
      setError('ไม่สามารถโหลดข้อมูลประวัติได้');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getActionStyle = (action: string) => {
    if (action.includes('ลบ')) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-500',
        icon: <Trash2 size={16} className="text-red-500" />,
        badge: 'bg-red-100 text-red-700'
      };
    }
    if (action.includes('เพิ่ม') || action.includes('Add')) {
      return {
        bg: 'bg-emerald-50',
        text: 'text-emerald-700',
        border: 'border-emerald-500',
        icon: <PlusCircle size={16} className="text-emerald-500" />,
        badge: 'bg-emerald-100 text-emerald-700'
      };
    }
    if (action.includes('แจ้งซ่อม')) {
      return {
        bg: 'bg-amber-50',
        text: 'text-amber-700',
        border: 'border-amber-500',
        icon: <AlertCircle size={16} className="text-amber-500" />,
        badge: 'bg-amber-100 text-amber-700'
      };
    }
    if (action.includes('ย้าย')) {
      return {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-500',
        icon: <ArrowRightLeft size={16} className="text-blue-500" />,
        badge: 'bg-blue-100 text-blue-700'
      };
    }
    if (action.includes('LOGIN') || action.includes('LOGOUT')) {
      return {
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        border: 'border-purple-500',
        icon: <User size={16} className="text-purple-500" />,
        badge: 'bg-purple-100 text-purple-700'
      };
    }
    if (action.includes('SETTINGS') || action.includes('USER')) {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        border: 'border-gray-500',
        icon: <Settings size={16} className="text-gray-500" />,
        badge: 'bg-gray-100 text-gray-700'
      };
    }
    // Default / Edit
    return {
      bg: 'bg-white',
      text: 'text-slate-700',
      border: 'border-slate-300',
      icon: <Edit size={16} className="text-slate-400" />,
      badge: 'bg-slate-100 text-slate-600'
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">ประวัติการทำงาน (Audit Log)</h1>
          <p className="text-slate-500">ติดตามกิจกรรมและการเปลี่ยนแปลงทั้งหมดในระบบ</p>
        </div>

        <div className="flex items-center bg-white border border-slate-200 rounded-lg px-3 py-2 shadow-sm w-full md:w-auto">
          <Search size={18} className="text-slate-400 mr-2" />
          <input
            type="text"
            placeholder="ค้นหา Log..."
            className="outline-none text-sm w-full md:w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
        <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
          {loading ? (
            <div className="text-center py-10 text-slate-500">กำลังโหลดข้อมูล...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-500">{error}</div>
          ) : (
            logs.map((log) => {
              const style = getActionStyle(log.action);
              const dateObj = new Date(log.timestamp);
              const formattedDate = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })
                : 'ไม่ระบุเวลา';

              return (
                <div key={log.id} className="relative pl-8 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-white border-2 ${style.border} ring-4 ring-slate-50 group-hover:ring-slate-100 transition-all`}></div>

                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 wrapped-content">
                      <div className={`p-1.5 rounded-full ${style.bg} shrink-0`}>
                        {style.icon}
                      </div>
                      <h3 className={`text-base font-bold ${style.text}`}>
                        {log.action}
                      </h3>
                      {log.assetId && (
                        <span className="text-xs font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {log.assetId}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center text-xs text-slate-400 gap-1 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      <Calendar size={12} /> {formattedDate}
                    </div>
                  </div>

                  <div className={`p-3 rounded-lg ${style.bg} border border-slate-100/50`}>
                    <p className="text-slate-600 text-sm leading-relaxed">{log.details}</p>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 ml-1">
                    <div className="flex items-center gap-1">
                      <User size={12} /> โดย: <span className="font-medium text-slate-700">{log.user || 'System'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}


        </div>
        <div className="mt-8 pt-4 border-t border-slate-100 text-center">
          <button className="text-primary-600 text-sm font-medium hover:underline">โหลดเพิ่มเติม...</button>
        </div>
      </div>
    </div>
  );
};

export default AuditLog;