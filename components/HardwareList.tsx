import React, { useState, useEffect } from 'react';
import { Upload, HardDrive, Search, Trash2, RefreshCw, FileText, AlertCircle, CheckCircle, Filter, Trash } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '../services/api';
import Select from './ui/Select';

const HardwareList: React.FC = () => {
    const [hardware, setHardware] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedGroup, setSelectedGroup] = useState<string>('');
    const [selectedOS, setSelectedOS] = useState<string>('');
    const [selectedCPU, setSelectedCPU] = useState<string>('');
    const [selectedRAM, setSelectedRAM] = useState<string>('');
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [importing, setImporting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchHardware = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/hardware');
            if (response.ok) {
                const data = await response.json();
                setHardware(data);
            } else {
                setError('Failed to fetch hardware data');
            }
        } catch (err) {
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHardware();
    }, []);

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setError(null);
        setSuccess(null);


        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            encoding: 'UTF-8',
            complete: async (results) => {
                try {
                    const response = await fetch('/api/hardware/import', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                        body: JSON.stringify(results.data)
                    });

                    if (response.ok) {
                        const result = await response.json();
                        setSuccess(result.message);
                        fetchHardware();
                    } else {
                        const err = await response.json();
                        setError(err.error || 'Import failed');
                    }
                } catch (err) {
                    setError('Error uploading data');
                } finally {
                    setImporting(false);
                    // Reset file input
                    event.target.value = '';
                }
            },
            error: (err) => {
                setError('CSV Parsing Error: ' + err.message);
                setImporting(false);
            }
        });
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const response = await fetch(`/api/hardware/${id}`, { method: 'DELETE' });
            if (response.ok) {
                setHardware(prev => prev.filter(item => item.id !== id));
            } else {
                alert('Failed to delete');
            }
        } catch (err) {
            alert('Error deleting item');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!window.confirm(`ต้องการลบ ${selectedIds.length} รายการที่เลือกหรือไม่?`)) return;

        try {
            const response = await fetch('/api/hardware/delete-bulk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: selectedIds })
            });

            if (response.ok) {
                setHardware(prev => prev.filter(item => !selectedIds.includes(item.id)));
                setSelectedIds([]);
                setSuccess('ลบข้อมูลสำเร็จ');
            } else {
                setError('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    };

    const handleDeleteAll = async () => {
        if (hardware.length === 0) return;

        if (!window.confirm(`ต้องการลบข้อมูลทั้งหมด ${hardware.length} รายการหรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้!`)) return;

        try {
            const response = await fetch('/api/hardware/all', { method: 'DELETE' });

            if (response.ok) {
                setHardware([]);
                setSelectedIds([]);
                setSuccess('ลบข้อมูลทั้งหมดสำเร็จ');
            } else {
                setError('เกิดข้อผิดพลาดในการลบข้อมูล');
            }
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.length === filteredHardware.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(filteredHardware.map(item => item.id));
        }
    };

    const handleSelectOne = (id: number) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(itemId => itemId !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // Extract Unique Groups
    const uniqueGroups = Array.from(new Set(hardware.map(item => item.group_name).filter(Boolean))).sort();
    const uniqueOS = Array.from(new Set(hardware.map(item => item.os_name).filter(Boolean))).sort();
    const uniqueCPU = Array.from(new Set(hardware.map(item => item.cpu_1).filter(Boolean))).sort();
    const uniqueRAM = Array.from(new Set(hardware.map(item => item.memory).filter(Boolean))).sort();

    // Filtered Data
    const filteredHardware = hardware.filter(item => {
        const matchesSearch = Object.values(item).some(val =>
            String(val).toLowerCase().includes(searchTerm.toLowerCase())
        );
        const matchesGroup = selectedGroup ? item.group_name === selectedGroup : true;
        const matchesOS = selectedOS ? item.os_name === selectedOS : true;
        const matchesCPU = selectedCPU ? item.cpu_1 === selectedCPU : true;
        const matchesRAM = selectedRAM ? item.memory === selectedRAM : true;

        return matchesSearch && matchesGroup && matchesOS && matchesCPU && matchesRAM;
    });

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('th-TH');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <HardDrive className="text-primary-600" />
                        ทะเบียน Hardware (Imported)
                    </h1>
                    <p className="text-slate-500 text-sm">จัดการข้อมูล Hardware ที่นำเข้าจาก CSV</p>
                </div>
                <div className="flex items-center gap-3">
                    {selectedIds.length > 0 && (
                        <button
                            onClick={handleBulkDelete}
                            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-shadow shadow-sm"
                        >
                            <Trash size={18} />
                            <span>ลบที่เลือก ({selectedIds.length})</span>
                        </button>
                    )}
                    {hardware.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-shadow shadow-sm"
                        >
                            <Trash size={18} />
                            <span>ลบทั้งหมด</span>
                        </button>
                    )}
                    <label className={`flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-shadow shadow-sm cursor-pointer ${importing ? 'opacity-50 pointer-events-none' : ''}`}>
                        <Upload size={18} />
                        <span>{importing ? 'Importing...' : 'Import CSV'}</span>
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={importing}
                        />
                    </label>
                </div>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center gap-2">
                    <AlertCircle size={20} />
                    {error}
                </div>
            )}

            {success && (
                <div className="bg-green-50 text-green-600 p-4 rounded-lg flex items-center gap-2">
                    <CheckCircle size={20} />
                    {success}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
                        <div className="flex flex-1 gap-2 w-full max-w-2xl">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="ค้นหา (IP, ชื่อเครื่อง, Serial No.)..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div className="text-sm text-slate-500">
                            {filteredHardware.length} รายการ
                        </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Select
                            value={selectedGroup}
                            onChange={setSelectedGroup}
                            options={[
                                { label: 'ทุกกลุ่ม', value: '' },
                                ...uniqueGroups.map(group => ({ label: `🏢 ${group}`, value: group as string }))
                            ]}
                            placeholder="กรองกลุ่ม"
                        />
                        <Select
                            value={selectedOS}
                            onChange={setSelectedOS}
                            options={[
                                { label: 'ทุก OS', value: '' },
                                ...uniqueOS.map(os => ({ label: os, value: os as string }))
                            ]}
                            placeholder="กรอง OS"
                        />
                        <Select
                            value={selectedCPU}
                            onChange={setSelectedCPU}
                            options={[
                                { label: 'ทุก CPU', value: '' },
                                ...uniqueCPU.map(cpu => ({ label: cpu, value: cpu as string }))
                            ]}
                            placeholder="กรอง CPU"
                        />
                        <Select
                            value={selectedRAM}
                            onChange={setSelectedRAM}
                            options={[
                                { label: 'ทุก RAM', value: '' },
                                ...uniqueRAM.map(ram => ({ label: ram, value: ram as string }))
                            ]}
                            placeholder="กรอง RAM"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-700 font-medium border-b border-slate-200 whitespace-nowrap">
                            <tr>
                                <th className="px-4 py-3 w-12">
                                    <input
                                        type="checkbox"
                                        checked={filteredHardware.length > 0 && selectedIds.length === filteredHardware.length}
                                        onChange={handleSelectAll}
                                        className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3">Imported At</th>
                                <th className="px-4 py-3">Client</th>
                                <th className="px-4 py-3">IP Address</th>
                                <th className="px-4 py-3">Computer Name</th>
                                <th className="px-4 py-3 min-w-[150px]">Group</th>
                                <th className="px-4 py-3">Model</th>
                                <th className="px-4 py-3">OS</th>
                                <th className="px-4 py-3">CPU</th>
                                <th className="px-4 py-3">RAM</th>
                                <th className="px-4 py-3">Last Connect</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={11} className="p-8 text-center text-slate-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <RefreshCw className="animate-spin" size={20} />
                                            Loading data...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredHardware.length === 0 ? (
                                <tr>
                                    <td colSpan={11} className="p-12 text-center text-slate-500">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="bg-slate-50 p-3 rounded-full">
                                                <HardDrive size={32} className="text-slate-400" />
                                            </div>
                                            <p>ไม่พบข้อมูล Hardware</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredHardware.map((item) => {
                                    const isSelected = selectedIds.includes(item.id);
                                    return (
                                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors whitespace-nowrap ${isSelected ? 'bg-blue-50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleSelectOne(item.id)}
                                                    className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500 cursor-pointer"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(item.imported_at)}</td>
                                            <td className="px-4 py-3 font-medium text-slate-800">{item.client}</td>
                                            <td className="px-4 py-3 text-slate-600 font-mono text-xs">{item.ip_address}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.computer_name}</td>
                                            <td className="px-4 py-3">
                                                <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs">{item.group_name}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{item.system_model}</td>
                                            <td className="px-4 py-3 text-slate-600">{item.os_name}</td>
                                            <td className="px-4 py-3 text-slate-600 text-xs truncate max-w-[150px]" title={item.cpu_1}>
                                                {item.cpu_1}
                                            </td>
                                            <td className="px-4 py-3 text-slate-600">{item.memory}</td>
                                            <td className="px-4 py-3 text-slate-500">{formatDate(item.last_connect)}</td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default HardwareList;
