import React, { useState } from 'react';
import {
    Plus, Search, Filter, FileText, MoreHorizontal, Download, Upload,
    Monitor, Trash2, Edit3, Eye, Check, X, AlertCircle, ChevronDown,
    Shield, Server, Activity, Wrench, Box, Key, Calendar, Loader,
    ArrowUpDown, ChevronsDown, ChevronsUp, FileSpreadsheet // Added Icons
} from 'lucide-react';
import { AssetStatus, AssetType, AssetStatusLabels, AssetTypeLabels, SoftwareCategory, LicenseType } from '../types';
import { Link } from 'react-router-dom';
import { useAssets } from '../context/AssetContext';
import Select from './ui/Select';
import Pagination from './ui/Pagination';

const SoftwareList: React.FC = () => {
    // State for software data from software_import table
    const [softwareData, setSoftwareData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [importProgress, setImportProgress] = useState<number>(0);
    const [selectedAsset, setSelectedAsset] = useState<any>(null);

    // Fetch software data from API
    const fetchSoftwareData = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('/api/software');
            if (response.ok) {
                const data = await response.json();
                setSoftwareData(data);
            }
        } catch (error) {
            console.error('Failed to fetch software:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Load data on mount
    React.useEffect(() => {
        fetchSoftwareData();
    }, []);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const currentThaiYear = (new Date().getFullYear() + 543).toString();
    const [filterYear, setFilterYear] = useState<string>(currentThaiYear);
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterLicenseType, setFilterLicenseType] = useState<string>('');
    const [filterCategory, setFilterCategory] = useState<string>(''); // New Category Filter
    const [filterGroup, setFilterGroup] = useState<string>('');
    // View Mode & Bulk Delete
    const [viewMode, setViewMode] = useState<'list' | 'computer' | 'group'>('list');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);
    const [expandedComputers, setExpandedComputers] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
    const [sortOption, setSortOption] = useState<'default' | 'name' | 'computer' | 'ip'>('default');

    const handleShowDetail = (asset: any) => {
        setSelectedAsset(asset);
        setShowDetailModal(true);
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('คุณแน่ใจหรือไม่ที่จะลบทะเบียน Software นี้?')) {
            try {
                const numericId = parseInt(id, 10);
                const response = await fetch(`/api/software/${numericId}`, { method: 'DELETE' });
                if (response.ok) {
                    await fetchSoftwareData();
                } else {
                    const error = await response.text();
                    alert('ลบไม่สำเร็จ: ' + error);
                }
            } catch (error) {
                console.error('Delete failed:', error);
                alert('เกิดข้อผิดพลาด: ' + error);
            }
        }
    };

    // Bulk Delete Functions
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredAssets.map(a => a.id)));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectOne = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
        setSelectAll(newSelected.size === filteredAssets.length);
    };

    const handleDeleteSelected = async () => {
        if (selectedIds.size === 0) return;

        const confirmed = window.confirm(
            `คุณแน่ใจหรือไม่ที่จะลบ ${selectedIds.size} รายการที่เลือก?`
        );

        if (confirmed) {
            const idsToDelete = Array.from(selectedIds).map(id => parseInt(id as string, 10));
            console.log('Bulk delete - IDs to delete:', idsToDelete);
            try {
                const response = await fetch('/api/software/delete-bulk', {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids: idsToDelete })
                });
                console.log('Bulk delete response:', response.status, response.ok);
                if (response.ok) {
                    const result = await response.json();
                    console.log('Bulk delete result:', result);
                    await fetchSoftwareData();
                    setSelectedIds(new Set());
                    setSelectAll(false);
                    alert('ลบสำเร็จ ' + idsToDelete.length + ' รายการ');
                } else {
                    const error = await response.text();
                    console.error('Bulk delete failed:', error);
                    alert('ลบไม่สำเร็จ: ' + String(error));
                }
            } catch (error) {
                console.error('Bulk delete error:', error);
                alert('เกิดข้อผิดพลาด: ' + String(error));
            }
        }
    };

    const handleDeleteAll = async () => {
        const confirmed = window.confirm(
            `⚠️ คุณแน่ใจหรือไม่ที่จะลบซอฟต์แวร์ทั้งหมด ${filteredAssets.length} รายการ?\n\nการกระทำนี้ไม่สามารถย้อนกลับได้!`
        );

        if (confirmed) {
            const doubleConfirm = window.confirm('ยืนยันอีกครั้ง: ลบทั้งหมดจริงหรือไม่?');
            if (doubleConfirm) {
                console.log('Delete all triggered');
                try {
                    const response = await fetch('/api/software/all', { method: 'DELETE' });
                    console.log('Delete all response:', response.status, response.ok);
                    if (response.ok) {
                        const result = await response.json();
                        console.log('Delete all result:', result);
                        await fetchSoftwareData();
                        setSelectedIds(new Set());
                        setSelectAll(false);
                    } else {
                        const error = await response.text();
                        console.error('Delete all failed:', error);
                        alert('ลบทั้งหมดไม่สำเร็จ: ' + error);
                    }
                } catch (error) {
                    console.error('Delete all error:', error);
                    alert('เกิดข้อผิดพลาด: ' + error);
                }
            }
        }
    };

    // Expand/Collapse All
    const handleExpandAll = () => {
        if (viewMode === 'computer') {
            setExpandedComputers(new Set(Object.keys(groupedByComputer)));
        } else if (viewMode === 'group') {
            setExpandedGroups(new Set(Object.keys(groupedByDepartment)));
        }
    };

    const handleCollapseAll = () => {
        if (viewMode === 'computer') {
            setExpandedComputers(new Set());
        } else if (viewMode === 'group') {
            setExpandedGroups(new Set());
        }
    };

    // Export CSV
    const handleExportCSV = () => {
        const headers = [
            'Asset Code', 'Software Name', 'Version', 'Type', 'License Type',
            'Product Key', 'Status', 'Department', 'Computer Name', 'IP Address', 'Purchase Date'
        ];

        const csvContent = [
            headers.join(','),
            ...sortedAssets.map(asset => [
                `"${asset.assetCode}"`,
                `"${asset.name.replace(/"/g, '""')}"`,
                `"${asset.model}"`,
                `"${asset.category}"`,
                `"${asset.licenseType}"`,
                `"${asset.productKey}"`,
                `"${asset.status}"`,
                `"${asset.department}"`,
                `"${asset.currentUser}"`,
                `"${asset.ipAddress}"`,
                `"${asset.purchaseDate}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `software_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Helper function to detect license type based on software name and key
    const detectLicenseType = (softwareName: string, publisher: string, productKey: string): string => {
        const name = softwareName.toLowerCase();
        const pub = publisher.toLowerCase();

        // 0. Specific Adobe Acrobat Logic
        if (name.includes('adobe acrobat') || name.includes('acrobat')) {
            // If it contains "reader", it's definitely Freeware
            if (name.includes('reader')) {
                return LicenseType.FREEWARE;
            }
            // If it's Acrobat but NOT Reader, it's Commercial (Pro, Standard, DC, XI, etc.)
            // Check for Product Key
            if (productKey && productKey.length > 5 && !productKey.toLowerCase().includes('not found')) {
                return LicenseType.LICENSED;
            } else {
                return LicenseType.POTENTIALLY_UNLICENSED;
            }
        }

        // 0.1 Windows OEM Logic (Home / OEM usually come with device)
        if (name.includes('windows') && (name.includes('home') || name.includes('oem') || name.includes('single language'))) {
            return LicenseType.LICENSED;
        }

        // 0.2 Office Home & Student Logic (Bundled with device)
        if ((name.includes('microsoft office') || name.includes('office')) &&
            name.includes('home') && name.includes('student')) {
            return LicenseType.LICENSED;
        }

        // Freeware patterns - Free to use software
        const freewarePatterns = [
            'chrome', 'google chrome', 'edge', 'microsoft edge', 'brave',
            'zoom', 'teams', 'microsoft teams', 'discord', 'slack',
            'anydesk', 'teamviewer free', 'vlc', 'winrar trial',
            'adobe reader', 'acrobat reader', 'foxit reader',
            'skype', 'line', 'telegram', 'whatsapp'
        ];

        // Open Source patterns
        const openSourcePatterns = [
            'linux', 'ubuntu', 'debian', 'centos', 'fedora',
            'firefox', 'mozilla firefox', 'chromium', 'libreoffice',
            'gimp', 'inkscape', 'blender', 'audacity',
            'vscode', 'visual studio code', 'atom', 'notepad++',
            'mysql', 'postgresql', 'mariadb', 'mongodb',
            'apache', 'nginx', 'wordpress', 'drupal',
            '7-zip', 'vlc media player'
        ];

        // Commercial software that requires license
        const commercialPatterns = [
            'windows', 'microsoft office', 'office 365', 'office 2019', 'office 2021',
            'adobe photoshop', 'adobe illustrator', 'adobe premiere', 'adobe acrobat pro',
            'autocad', 'solidworks', 'matlab', 'corel draw',
            'vmware', 'oracle', 'sql server', 'microsoft sql',
            'kaspersky', 'norton', 'mcafee', 'avg premium',
            'winrar', 'winzip pro', 'idm', 'internet download manager'
        ];

        // Security Software - Usually Licensed/Subscription
        const securityPatterns = [
            'watchguard', 'eset', 'kaspersky', 'symantec', 'sophos', 'trend micro',
            'mcafee', 'bitdefender', 'crowdstrike', 'sentinelone', 'malwarebytes'
        ];
        if (securityPatterns.some(p => name.includes(p))) {
            return LicenseType.LICENSED;
        }

        // Check Freeware first
        if (freewarePatterns.some(pattern => name.includes(pattern))) {
            return LicenseType.FREEWARE;
        }

        // Check Open Source
        if (openSourcePatterns.some(pattern => name.includes(pattern))) {
            return LicenseType.OPEN_SOURCE;
        }

        // Check Commercial software
        if (commercialPatterns.some(pattern => name.includes(pattern))) {
            // Has product key = Licensed
            if (productKey && productKey.trim() !== '' && productKey.trim().length > 5) {
                return LicenseType.LICENSED;
            }
            // No product key = Potentially Unlicensed
            return LicenseType.POTENTIALLY_UNLICENSED;
        }

        // Unknown software - check if has key
        if (productKey && productKey.trim() !== '' && productKey.trim().length > 5) {
            return LicenseType.LICENSED;
        }

        return LicenseType.UNKNOWN;
    };

    // Helper function to parse various date formats
    const parseDate = (dateStr: string): string => {
        if (!dateStr) return '';

        try {
            // Try DD/MM/YYYY format (common in Thailand)
            if (dateStr.includes('/')) {
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const day = parts[0].padStart(2, '0');
                    const month = parts[1].padStart(2, '0');
                    const year = parts[2];
                    return `${year}-${month}-${day}`;
                }
            }

            // Try YYYY-MM-DD format
            if (dateStr.includes('-')) {
                return dateStr;
            }

            return '';
        } catch (error) {
            console.error('Date parse error:', error);
            return '';
        }
    };

    // Enhanced category determination with Security and Patch/OS detection
    const determineCategory = (name: string, type: string = ''): string => {
        const lowerName = name.toLowerCase();
        const lowerType = type.toLowerCase();

        // 1. PATCHES & UPDATES (Highest priority as per user request)
        // Regex for KB numbers (e.g., KB5034441) - KB followed by 6+ digits
        if (/kb\d{6,}/.test(lowerName)) {
            return SoftwareCategory.PATCH;
        }

        const patchPatterns = [
            'security intelligence update', 'cumulative update', 'stack update', 'feature update',
            'security update for', 'service pack', 'hotfix',
            'update for windows', 'update for microsoft',
            'definition update', 'rollsu', 'dynamic update'
        ];
        if (patchPatterns.some(pattern => lowerName.includes(pattern))) {
            return SoftwareCategory.PATCH;
        }

        // 2. SECURITY SOFTWARE
        const securityPatterns = [
            // Antivirus & Endpoint Protection
            'antivirus', 'anti-virus', 'kaspersky', 'norton', 'mcafee', 'avg', 'avast',
            'eset', 'bitdefender', 'sophos', 'trend micro', 'symantec', 'f-secure',
            'malwarebytes', 'windows defender', 'defender', 'crowdstrike', 'sentinelone',
            'cylance', 'carbon black', 'fireeye', 'forticlient', 'endpoint security',
            'deep security', 'virus', 'anti-malware',
            // Firewall & Network Security
            'firewall', 'watchguard', 'fortigate', 'fortinet', 'palo alto',
            'checkpoint', 'cisco asa', 'sonicwall', 'barracuda', 'pfSense',
            // VPN & Access Control
            'vpn', 'openvpn', 'nordvpn', 'expressvpn', 'cisco anyconnect',
            'globalprotect', 'pulse secure', 'wireguard', 'tailscale',
            // Security Tools
            'encryption', 'veracrypt', 'truecrypt', 'bitlocker', 'keepass', 'lastpass',
            '1password', 'security agent', 'qualys', 'nessus', 'rapid7'
        ];
        if (securityPatterns.some(pattern => lowerName.includes(pattern))) {
            return SoftwareCategory.SECURITY;
        }

        // 3. OPERATING SYSTEMS
        const osPatterns = {
            windows: ['windows 10', 'windows 11', 'windows 7', 'windows 8', 'windows 8.1',
                'windows server', 'win10', 'win11', 'microsoft windows', 'windows xp', 'windows vista'],
            linux: ['ubuntu', 'centos', 'redhat', 'red hat', 'debian', 'fedora',
                'linux', 'suse', 'arch linux', 'mint', 'kali', 'rocky linux', 'almalinux'],
            mac: ['macos', 'mac os', 'os x', 'monterey', 'ventura', 'sonoma', 'sequoia'],
            mobile: ['android', 'ios', 'ipados']
        };

        for (const [osType, patterns] of Object.entries(osPatterns)) {
            if (patterns.some(pattern => lowerName.includes(pattern))) {
                return SoftwareCategory.OS;
            }
        }

        // Check by type field if explicitly stated
        if (lowerType.includes('operating system') || lowerType.includes('os') ||
            (lowerType.includes('system') && !lowerType.includes('system utility'))) {
            return SoftwareCategory.OS;
        }

        // 4. DRIVERS & UTILITIES (Optional but good for cleanup)
        const driverPatterns = [
            'driver', 'realtek', 'intel', 'nvidia', 'amd', 'chipset', 'bios', 'uefi',
            'firmware', 'agent', 'client', 'runtime', 'redistributable', 'framework',
            'net framework', 'visual c++'
        ];
        if (driverPatterns.some(pattern => lowerName.includes(pattern))) {
            return SoftwareCategory.UTILITIES;
        }

        // 5. APPLICATIONS (Default)
        return SoftwareCategory.APPLICATION;
    };

    // Helper function to build note from multiple fields
    const buildNote = (row: any): string => {
        const notes: string[] = [];

        if (row.Size) notes.push(`ขนาด: ${row.Size}`);
        if (row.Domain) notes.push(`Domain: ${row.Domain}`);
        if (row.Description) notes.push(`รายละเอียด: ${row.Description}`);

        return notes.join(' | ');
    };

    // Helper function to get license badge color class
    const getLicenseBadgeClass = (licenseType: string): string => {
        switch (licenseType) {
            case LicenseType.FREEWARE:
                return 'bg-green-100 text-green-700 border border-green-300';
            case LicenseType.OPEN_SOURCE:
                return 'bg-blue-100 text-blue-700 border border-blue-300';
            case LicenseType.LICENSED:
                return 'bg-purple-100 text-purple-700 border border-purple-300';
            case LicenseType.POTENTIALLY_UNLICENSED:
                return 'bg-red-100 text-red-700 border border-red-300';
            case LicenseType.SUBSCRIPTION:
                return 'bg-amber-100 text-amber-700 border border-amber-300';
            default:
                return 'bg-gray-100 text-gray-700 border border-gray-300';
        }
    };

    // Helper function to get license label
    const getLicenseLabel = (licenseType: string): string => {
        switch (licenseType) {
            case LicenseType.FREEWARE:
                return 'Freeware';
            case LicenseType.OPEN_SOURCE:
                return 'Open Source';
            case LicenseType.LICENSED:
                return 'Licensed';
            case LicenseType.POTENTIALLY_UNLICENSED:
                return 'Unlicensed';
            case LicenseType.SUBSCRIPTION:
                return 'Subscription';
            default:
                return 'Unknown';
        }
    };

    const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();

        reader.onload = async (event) => {
            try {
                const text = event.target?.result as string;
                if (!text) return;

                const lines = text.split('\n');
                const headerLine = lines[0];
                const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));

                let successCount = 0;
                let skippedCount = 0;
                const softwareRecords: any[] = [];

                // 1. Parse all rows first
                for (let i = 1; i < lines.length; i++) {
                    if (!lines[i].trim()) continue;

                    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
                    const row: any = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });

                    const softwareName = row.Name || row.name || row['Software Name'] || row['ชื่อซอฟต์แวร์'];

                    if (!softwareName || softwareName.trim() === '') {
                        skippedCount++;
                        continue;
                    }

                    const publisher = row.Publisher || row['ผู้ผลิต'] || '';
                    const productKey = row.Key || row['Product Key'] || row['License Key'] || row['คีย์'] || '';

                    // Map to an intermediate structure from CSV
                    const softwareRecord: any = {
                        Name: softwareName,
                        Publisher: publisher,
                        Version: row.Version || row['เวอร์ชัน'] || '',
                        'Installed On': row['Installed On'] || row['Computer Name'] || row['Computer'] || row['เครื่อง'] || '',
                        'IP Address': row['IP Address'] || row['IP address'] || row['IP'] || row['ไอพี'] || '',
                        Size: row.Size || '',
                        Folder: row.Folder || row['โฟลเดอร์'] || '',
                        'Product Key': productKey, // Use the extracted productKey
                        Type: row.Type || row['ประเภท'] || '',
                        subtype: determineCategory(softwareName, row.Type || ''), // Use determineCategory
                        Department: row.Department || row['หน่วยงาน'] || row['Group'] || '',
                        'Budget Year': row['Budget Year'] || row['ปีงบประมาณ'] || ''
                    };

                    softwareRecords.push(softwareRecord);
                }

                // 2. Transform to software_import format with auto license detection
                const transformedRecords = softwareRecords.map(record => {
                    // Auto-detect license type based on software name, publisher, and product key
                    const detectedLicenseType = detectLicenseType(
                        record.Name || '',
                        record.Publisher || '', // Pass publisher
                        record['Product Key'] || ''
                    );

                    return {
                        name: record.Name || '',
                        category: record.subtype || '', // Use the determined subtype as category
                        license_type: detectedLicenseType, // Auto-detected
                        version: record.Version || '',
                        vendor: record.Publisher || '',
                        computer_name: record['Installed On'] || '',
                        ip_address: record['IP Address'] || '',
                        installation_count: 1,
                        license_count: record['Product Key'] ? 1 : 0,
                        expiry_date: null,
                        cost: 0,
                        notes: [record.Folder, record.Size].filter(Boolean).join(' | '),
                        department: record.Department || '',
                        fiscal_year: record['Budget Year'] || (new Date().getFullYear() + 543).toString() // Fallback for fiscal year
                    };
                });

                // 3. Send to /api/software/import endpoint in batches
                if (transformedRecords.length > 0) {
                    const BATCH_SIZE = 1000;
                    const total = transformedRecords.length;
                    let processed = 0;

                    for (let i = 0; i < total; i += BATCH_SIZE) {
                        const chunk = transformedRecords.slice(i, i + BATCH_SIZE);

                        const response = await fetch('/api/software/import', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json; charset=UTF-8' },
                            body: JSON.stringify({ data: chunk })
                        });

                        if (!response.ok) {
                            throw new Error(`Import failed: ${response.statusText}`);
                        }

                        processed += chunk.length;
                        setImportProgress(Math.round((processed / total) * 100));
                        await new Promise(r => setTimeout(r, 10));
                    }
                    successCount = total;

                    // Refresh to show new data
                    window.location.reload();
                }

                let message = `นำเข้าสำเร็จ: ${successCount} รายการ`;
                if (skippedCount > 0) {
                    message += `\nข้ามไป: ${skippedCount} รายการ (ไม่มีชื่อซอฟต์แวร์)`;
                }
                alert(message);

            } catch (error) {
                console.error('Import failed:', error);
                alert('การนำเข้าล้มเหลว กรุณาตรวจสอบรูปแบบ CSV');
            } finally {
                setIsImporting(false);

                setImportProgress(0);
                if (e.target) e.target.value = '';
            }
        };

        reader.readAsText(file, 'UTF-8');
    };

    // Filter Logic
    const filteredAssets = softwareData.filter(asset => {
        // Software data from software_import table

        const matchesYear = filterYear ? asset.fiscal_year === filterYear : true;
        const matchesStatus = true; // No status field in software_import
        const matchesLicenseType = filterLicenseType ? asset.license_type === filterLicenseType : true;
        const matchesCategory = filterCategory ? asset.category === filterCategory : true;
        const matchesGroup = filterGroup ? asset.department === filterGroup : true;
        const matchesSearch = searchTerm === '' ||
            asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (asset.vendor && asset.vendor.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (asset.department && asset.department.toLowerCase().includes(searchTerm.toLowerCase()));

        return matchesSearch && matchesYear && matchesStatus && matchesLicenseType && matchesCategory && matchesGroup;
    });

    // Sort Logic
    const sortedAssets = [...filteredAssets].sort((a, b) => {
        switch (sortOption) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'computer':
                return (a.currentUser || '').localeCompare(b.currentUser || '');
            case 'ip':
                // Simple string sort for IP
                return (a.ipAddress || '').localeCompare(b.ipAddress || '');
            default:
                return 0;
        }
    });

    // Get unique groups for filter
    const groups = Array.from(new Set(softwareData.map(a => a.department).filter(Boolean))).sort();

    // Helper for category icon
    const getCategoryIcon = (subtype: string) => {
        switch (subtype) {
            case SoftwareCategory.OS:
                return <Server size={16} className="text-slate-500" />;
            case SoftwareCategory.SECURITY:
                return <Shield size={16} className="text-emerald-500" />;
            case SoftwareCategory.PATCH:
                return <Activity size={16} className="text-amber-500" />;
            case SoftwareCategory.UTILITIES:
                return <Wrench size={16} className="text-blue-400" />;
            default:
                return <Box size={16} className="text-slate-300" />;
        }
    };

    // Grouping Logic
    const groupedByComputer = sortedAssets.reduce((acc, asset) => {
        const computer = asset.currentUser || 'Unknown Computer';
        if (!acc[computer]) acc[computer] = [];
        acc[computer].push(asset);
        return acc;
    }, {} as Record<string, typeof filteredAssets>);

    const groupedByDepartment = sortedAssets.reduce((acc, asset) => {
        const department = asset.department || 'Unknown Group';
        if (!acc[department]) acc[department] = [];
        acc[department].push(asset);
        return acc;
    }, {} as Record<string, typeof filteredAssets>);

    // Pagination Logic
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 50;

    // Reset page when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [filterYear, filterStatus, filterLicenseType, filterCategory, filterGroup, searchTerm]);

    const paginatedAssets = sortedAssets.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">ทะเบียน Software ({filterYear})</h1>
                    <p className="text-slate-500">จัดการลิขสิทธิ์ซอฟต์แวร์และการต่ออายุ</p>
                </div>
                <div className="flex gap-3">
                    <Link
                        to="/assets/new"
                        className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap"
                    >
                        <Plus size={18} /> ลงทะเบียน Software
                    </Link>
                    <label className={`flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-colors whitespace-nowrap cursor-pointer ${isImporting ? 'opacity-70 pointer-events-none' : ''}`}>
                        <Upload size={18} />
                        {isImporting ? 'Importing...' : 'Import CSV'}
                        <input type="file" accept=".csv" className="hidden" onChange={handleImportCSV} disabled={isImporting} />
                    </label>
                    <button
                        onClick={handleExportCSV}
                        className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium shadow-sm transition-colors"
                        title="Export filtered list to CSV"
                    >
                        <FileSpreadsheet size={18} /> Export
                    </button>
                </div>
            </div>

            {/* View Toggle & Bulk Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                {/* View Mode Toggle */}
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('list')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'list'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        📋 List View
                    </button>
                    <button
                        onClick={() => setViewMode('computer')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'computer'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        🖥️ Computer View
                    </button>
                    <button
                        onClick={() => setViewMode('group')}
                        className={`px-4 py-2 rounded-lg font-medium transition-all ${viewMode === 'group'
                            ? 'bg-primary-600 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                    >
                        🏢 Group View
                    </button>
                </div>

                {/* Bulk Expand/Collapse Actions (Only for Computer/Group Views) */}
                {(viewMode === 'computer' || viewMode === 'group') && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleExpandAll}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            <ChevronsDown size={16} /> Expand All
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                        >
                            <ChevronsUp size={16} /> Collapse All
                        </button>
                    </div>
                )}
            </div>

            {/* License & Category Summary Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                    <div className="text-emerald-600 text-sm font-medium mb-1">🛡️ Security</div>
                    <div className="text-2xl font-bold text-emerald-700">
                        {filteredAssets.filter(a => a.category === SoftwareCategory.SECURITY).length}
                    </div>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-600 text-sm font-medium mb-1">⚡ Patch / OS</div>
                    <div className="text-2xl font-bold text-orange-700">
                        {filteredAssets.filter(a => a.category === SoftwareCategory.PATCH || a.category === SoftwareCategory.OS).length}
                    </div>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-600 text-sm font-medium mb-1">🟢 Freeware</div>
                    <div className="text-2xl font-bold text-green-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.FREEWARE).length}
                    </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 text-sm font-medium mb-1">🔵 Open Source</div>
                    <div className="text-2xl font-bold text-blue-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.OPEN_SOURCE).length}
                    </div>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="text-purple-600 text-sm font-medium mb-1">🟣 Licensed</div>
                    <div className="text-2xl font-bold text-purple-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.LICENSED).length}
                    </div>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-600 text-sm font-medium mb-1">⚠️ Unlicensed</div>
                    <div className="text-2xl font-bold text-red-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.POTENTIALLY_UNLICENSED).length}
                    </div>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="text-amber-600 text-sm font-medium mb-1">🔶 Subscription</div>
                    <div className="text-2xl font-bold text-amber-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.SUBSCRIPTION).length}
                    </div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                    <div className="text-slate-600 text-sm font-medium mb-1">⚪ Unknown</div>
                    <div className="text-2xl font-bold text-slate-700">
                        {filteredAssets.filter(a => a.license_type === LicenseType.UNKNOWN || !a.license_type).length}
                    </div>
                </div>
            </div>

            {/* Combined Filters & Actions */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
                {/* Search Row */}
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="ค้นหาชื่อ Software, รหัส, ผู้รับผิดชอบ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Filters & Buttons Row */}
                <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
                    <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <div className="w-32 shrink-0">
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
                                placeholder="ปี"
                                icon={<Calendar size={16} />}
                            />
                        </div>
                        <div className="w-40 shrink-0">
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
                        <div className="w-40 shrink-0">
                            <Select
                                value={filterCategory}
                                onChange={setFilterCategory}
                                options={[
                                    { label: 'ทุกประเภท (Category)', value: '' },
                                    { label: '🛡️ Security', value: SoftwareCategory.SECURITY },
                                    { label: '⚡ Patch / Update', value: SoftwareCategory.PATCH },
                                    { label: '🖥️ OS', value: SoftwareCategory.OS },
                                    { label: '🔧 Utility', value: SoftwareCategory.UTILITIES },
                                    { label: '📦 Application', value: SoftwareCategory.APPLICATION }
                                ]}
                                placeholder="ประเภท (Category)"
                                icon={<Box size={16} />}
                            />
                        </div>
                        <div className="w-40 shrink-0">
                            <Select
                                value={sortOption}
                                onChange={(val) => setSortOption(val as any)}
                                options={[
                                    { label: 'เรียงตาม: ค่าเริ่มต้น', value: 'default' },
                                    { label: 'เรียงตาม: ชื่อซอฟต์แวร์', value: 'name' },
                                    { label: 'เรียงตาม: ชื่อเครื่อง', value: 'computer' },
                                    { label: 'เรียงตาม: IP Address', value: 'ip' }
                                ]}
                                placeholder="เรียงลำดับ"
                                icon={<ArrowUpDown size={16} />}
                            />
                        </div>
                        <div className="w-48 shrink-0">
                            <Select
                                value={filterLicenseType}
                                onChange={setFilterLicenseType}
                                options={[
                                    { label: 'ทุกประเภท', value: '' },
                                    { label: '🟢 Freeware', value: LicenseType.FREEWARE },
                                    { label: '🔵 Open Source', value: LicenseType.OPEN_SOURCE },
                                    { label: '🟣 Licensed', value: LicenseType.LICENSED },
                                    { label: '⚠️ Unlicensed', value: LicenseType.POTENTIALLY_UNLICENSED },
                                    { label: '🔶 Subscription', value: LicenseType.SUBSCRIPTION }
                                ]}
                                placeholder="License"
                                icon={<Shield size={16} />}
                            />
                        </div>
                        <div className="w-48 shrink-0">
                            <Select
                                value={filterGroup}
                                onChange={setFilterGroup}
                                options={[
                                    { label: 'ทุกหน่วยงาน', value: '' },
                                    ...groups.map(g => ({ label: `🏢 ${g}`, value: g }))
                                ]}
                                placeholder="หน่วยงาน"
                                icon={<Filter size={16} />}
                            />
                        </div>
                    </div>

                    {/* Bulk Delete Actions */}
                    {viewMode === 'list' && selectedIds.size > 0 && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-600 font-medium whitespace-nowrap">
                                ✓ {selectedIds.size} เลือก
                            </span>
                            <button
                                onClick={handleDeleteSelected}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-red-600 hover:bg-red-700 text-white shadow-sm text-sm"
                            >
                                <Trash2 size={16} /> ลบที่เลือก
                            </button>
                        </div>
                    )}
                    {viewMode === 'list' && selectedIds.size === 0 && filteredAssets.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg font-medium bg-red-100 hover:bg-red-200 text-red-700 border border-red-200 shadow-sm text-sm"
                        >
                            <Trash2 size={16} /> ลบทั้งหมด
                        </button>
                    )}
                </div>
            </div>

            {/* View Logic */}
            {viewMode === 'computer' ? (
                <div className="space-y-4">
                    {Object.entries(groupedByComputer)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([computer, software]: [string, any[]]) => {
                            const isExpanded = expandedComputers.has(computer);
                            const toggleExpand = () => {
                                const newExpanded = new Set(expandedComputers);
                                if (isExpanded) {
                                    newExpanded.delete(computer);
                                } else {
                                    newExpanded.add(computer);
                                }
                                setExpandedComputers(newExpanded);
                            };

                            return (
                                <div key={computer} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className="flex flex-col gap-3 p-6 pb-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={toggleExpand}
                                    >
                                        <div className="flex items-center gap-3">
                                            <ChevronDown
                                                size={20}
                                                className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                            />
                                            <Monitor size={24} className="text-primary-600" />
                                            <h3 className="font-bold text-lg text-slate-800">{computer}</h3>
                                            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                                {software.length} software
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 ml-9">
                                            {software[0]?.department && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-500">📁 Group:</span>
                                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200">
                                                        {software[0].department}
                                                    </span>
                                                </div>
                                            )}
                                            {software[0]?.ipAddress && (
                                                <div className="flex items-center gap-2">
                                                    <span className="font-medium text-slate-500">🌐 IP:</span>
                                                    <span className="font-mono bg-emerald-50 text-emerald-700 px-2 py-1 rounded border border-emerald-200">
                                                        {software[0].ipAddress}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* List */}
                                    {isExpanded && (
                                        <div className="p-6 pt-4 space-y-2">
                                            {software.map(s => (
                                                <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium border ${getLicenseBadgeClass(s.licenseType || '')}`}>
                                                        {s.licenseType || 'Unknown'}
                                                    </span>
                                                    <span className="flex-1 font-medium text-slate-800 flex items-center gap-2">
                                                        {getCategoryIcon(s.category)}
                                                        {s.name}
                                                    </span>
                                                    {s.model && (
                                                        <span className="text-sm text-slate-500">v{s.model}</span>
                                                    )}
                                                    {s.productKey && (
                                                        <span className="flex items-center gap-1 text-xs text-slate-400" title={s.productKey}>
                                                            <Key size={12} /> {s.productKey.substring(0, 8)}...
                                                        </span>
                                                    )}
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => handleShowDetail(s)}
                                                            className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <Link
                                                            to={`/assets/${s.id}/edit`}
                                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                        >
                                                            <Edit3 size={16} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            ) : viewMode === 'group' ? (
                <div className="space-y-4">
                    {Object.entries(groupedByDepartment)
                        .sort(([a], [b]) => a.localeCompare(b))
                        .map(([department, software]: [string, any[]]) => {
                            const isExpanded = expandedGroups.has(department);
                            const toggleExpand = () => {
                                const newExpanded = new Set(expandedGroups);
                                if (isExpanded) {
                                    newExpanded.delete(department);
                                } else {
                                    newExpanded.add(department);
                                }
                                setExpandedGroups(newExpanded);
                            };

                            return (
                                <div key={department} className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                                    {/* Header */}
                                    <div
                                        className="flex items-center gap-3 p-6 pb-4 border-b border-slate-200 cursor-pointer hover:bg-slate-50 transition-colors"
                                        onClick={toggleExpand}
                                    >
                                        <ChevronDown
                                            size={20}
                                            className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                                        />
                                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                                            <Filter size={20} />
                                        </div>
                                        <h3 className="font-bold text-lg text-slate-800">{department}</h3>
                                        <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                                            {software.length} software
                                        </span>
                                    </div>

                                    {/* Software List */}
                                    {isExpanded && (
                                        <div className="p-6 pt-4 space-y-2">
                                            {software.map(s => (
                                                <div key={s.id} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100">
                                                    <div className={`px-2 py-1 rounded text-xs font-medium border ${getLicenseBadgeClass(s.licenseType)} whitespace-nowrap w-24 text-center`}>
                                                        {s.licenseType || 'Unknown'}
                                                    </div>

                                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                                        <div className="font-medium text-slate-700 truncate" title={s.name}>
                                                            {s.name}
                                                        </div>
                                                        <div className="text-sm text-slate-500 truncate flex items-center gap-1">
                                                            <Monitor size={14} /> {s.currentUser}
                                                        </div>
                                                        <div className="text-sm text-slate-500 truncate font-mono bg-slate-50 px-2 py-0.5 rounded w-fit">
                                                            v{s.model || '-'}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleShowDetail(s)}
                                                            className="p-1 text-slate-400 hover:text-primary-600 transition-colors"
                                                            title="ดูรายละเอียด"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <Link
                                                            to={`/assets/${s.id}/edit`}
                                                            className="p-1 text-slate-400 hover:text-blue-600 transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit3 size={16} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 min-w-[1200px]">
                            <thead className="bg-blue-50">
                                <tr>
                                    <th className="px-4 py-2 text-left">
                                        <input
                                            type="checkbox"
                                            checked={selectAll}
                                            onChange={handleSelectAll}
                                            className="rounded"
                                        />
                                    </th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">ชื่อซอฟต์แวร์</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">Version</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">License</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">ผู้ผลิต</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">Computer</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">IP Address</th>
                                    <th className="px-4 py-2 text-left font-medium text-blue-900">Group</th>
                                    <th className="px-4 py-2 text-center font-medium text-blue-900">การจัดการ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {paginatedAssets.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                                            ไม่พบข้อมูล Software
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedAssets.map((asset) => (
                                        <tr key={asset.id} className={`hover:bg-slate-50 transition-colors ${selectedIds.has(asset.id) ? 'bg-blue-50/50' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(asset.id)}
                                                    onChange={() => handleSelectOne(asset.id)}
                                                    className="rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium text-slate-900 flex items-center gap-2">
                                                    {getCategoryIcon(asset.category)}
                                                    {asset.name}
                                                </div>
                                                {asset.notes && <div className="text-xs text-slate-400 truncate max-w-[200px] ml-6">{asset.notes}</div>}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{asset.version || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getLicenseBadgeClass(asset.license_type || '')}`}>
                                                    {getLicenseLabel(asset.license_type || '')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{asset.vendor || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{asset.computer_name || '-'}</td>
                                            <td className="px-4 py-3 font-mono text-xs text-slate-600">{asset.ip_address || '-'}</td>
                                            <td className="px-4 py-3">
                                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-600">
                                                    {asset.department || '-'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={() => handleShowDetail(asset)}
                                                        className="p-1.5 text-slate-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <Link
                                                        to={`/assets/${asset.id}/edit`}
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="แก้ไข"
                                                    >
                                                        <Edit3 size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleDelete(asset.id)}
                                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="ลบ"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
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
            )}

            {/* Detail Modal */}
            {
                showDetailModal && selectedAsset && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-scale-in max-h-[90vh] flex flex-col">
                            <div className="bg-slate-900 p-6 text-white relative shrink-0">
                                <button onClick={() => setShowDetailModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X size={20} /></button>
                                <h3 className="text-xl font-bold flex items-center gap-2"><Shield size={24} className="text-primary-400" /> {selectedAsset.name}</h3>
                                <p className="text-slate-400">{selectedAsset.licenseType} License</p>
                            </div>
                            <div className="p-6 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold text-slate-400 uppercase">Product Key / Serial Number</label>
                                        <div className="bg-slate-100 p-3 rounded-lg font-mono text-slate-800 break-all select-all border border-slate-200 mt-1">
                                            {selectedAsset.productKey || 'N/A'}
                                        </div>
                                    </div>
                                    <div><span className="text-slate-500 block">Version</span><span className="font-medium">{selectedAsset.model || '-'}</span></div>
                                    <div><span className="text-slate-500 block">Brand/Vendor</span><span className="font-medium">{selectedAsset.brand || '-'}</span></div>
                                    <div><span className="text-slate-500 block">วันหมดอายุ License</span><span className="font-medium text-red-600">{selectedAsset.warrantyExpireDate ? new Date(selectedAsset.warrantyExpireDate).toLocaleDateString('th-TH') : 'Lifetime / Unspecified'}</span></div>
                                    <div><span className="text-slate-500 block">จำนวนที่ติดตั้ง</span><span className="font-medium">1 (Single tracking)</span></div>
                                    <div className="col-span-2"><span className="text-slate-500 block">Note</span><span className="font-medium">{selectedAsset.note || '-'}</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Import Progress Modal */}
            {
                isImporting && (
                    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                        <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 w-80 animate-scale-in">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary-100 rounded-full animate-ping opacity-75"></div>
                                <div className="bg-primary-50 p-4 rounded-full relative z-10">
                                    <Loader className="animate-spin text-primary-600" size={32} />
                                </div>
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-xl font-bold text-slate-800">กำลังนำเข้าข้อมูล...</h3>
                                <p className="text-slate-500 text-sm">กรุณารอสักครู่ ห้ามปิดหน้าต่างนี้</p>
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs font-medium text-slate-600">
                                    <span>Progress</span>
                                    <span>{importProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                                    <div
                                        className="bg-primary-600 h-full transition-all duration-300 ease-out rounded-full"
                                        style={{ width: `${importProgress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >

    );
};

export default SoftwareList;
