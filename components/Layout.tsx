import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Monitor,
  FileText,
  ArrowLeftRight,
  History,
  Users,
  Settings,
  Menu,
  Bell,
  Search,
  ChevronDown,
  LogOut,
  User,
  X,
  TrendingUp
} from 'lucide-react';
import { api } from '../services/api';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  // Get user from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();

    // Trigger Exit Animation
    setIsExiting(true);

    try {
      await api.logout(); // Log the logout event
    } catch (error) {
      console.error("Logout failed", error);
    }

    setTimeout(() => {
      // Clear auth data
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user');
      localStorage.removeItem('token'); // Also clear token
      // Redirect to login
      navigate('/login');
    }, 400); // Wait for fade out
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'จัดการครุภัณฑ์', path: '/assets', icon: <Monitor size={20} /> },
    { name: 'รายงาน', path: '/reports', icon: <FileText size={20} /> },
    { name: 'การยืม-คืน', path: '/loans', icon: <ArrowLeftRight size={20} /> },
    { name: 'ประวัติการแก้ไข', path: '/audit-log', icon: <History size={20} /> },
    { name: 'วิเคราะห์ ปรับปรุง', path: '/analysis', icon: <TrendingUp size={20} /> },
    { name: 'ตั้งค่าระบบ', path: '/settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className={`flex h-screen bg-slate-100 overflow-hidden animate-fade-in transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
      {/* Sidebar - Desktop */}
      <aside
        className={`bg-slate-900 text-white transition-all duration-300 hidden md:flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'
          }`}
      >
        <div className="h-16 flex items-center justify-center border-b border-slate-700 px-2">
          {isSidebarOpen ? (
            <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shrink-0">G</div>
              <span className="truncate">ระบบสำรวจครุภัณฑ์คอมพิวเตอร์</span>
            </div>
          ) : (
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center font-bold">G</div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${isActive
                      ? 'bg-primary-600 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      } ${!isSidebarOpen && 'justify-center'}`}
                  >
                    {item.icon}
                    {isSidebarOpen && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm md:hidden" onClick={toggleMobileMenu}></div>
      )}

      {/* Sidebar - Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-[70] w-64 bg-slate-900 text-white transform transition-transform duration-300 md:hidden shadow-2xl ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
          <div className="flex items-center gap-2 font-bold text-sm tracking-wide">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shrink-0">G</div>
            <span className="truncate">ระบบครุภัณฑ์</span>
          </div>
          <button onClick={toggleMobileMenu} className="text-slate-400 hover:text-white"><X size={24} /></button>
        </div>
        <nav className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg ${location.pathname === item.path ? 'bg-primary-600 text-white' : 'text-slate-400 hover:bg-slate-800'
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 pt-8 border-t border-slate-800">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-red-400 hover:bg-slate-800"
            >
              <LogOut size={20} />
              <span>ออกจากระบบ</span>
            </button>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Navbar */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <button onClick={toggleMobileMenu} className="md:hidden text-slate-500 hover:text-slate-700 p-1 active:bg-slate-100 rounded-lg">
              <Menu size={24} />
            </button>
            <button onClick={toggleSidebar} className="hidden md:block text-slate-500 hover:text-slate-700">
              <Menu size={24} />
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-4 py-2 border border-slate-200 focus-within:ring-2 focus-within:ring-primary-100 focus-within:border-primary-300 transition-all">
              <Search size={18} className="text-slate-400 mr-2" />
              <input
                type="text"
                placeholder="ค้นหาครุภัณฑ์..."
                className="bg-transparent border-none focus:outline-none text-sm w-48 lg:w-64 placeholder-slate-400 text-slate-700"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell size={20} />
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="flex items-center gap-3 pl-2 sm:pl-4 sm:border-l border-slate-200 cursor-pointer group relative">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800">{user.name || 'ผู้ใช้งาน'}</div>
                <div className="text-xs text-slate-500">{user.role || 'Officer'}</div>
              </div>
              <div className="w-9 h-9 sm:w-10 sm:h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-bold border-2 border-primary-200 hover:border-primary-300 transition-colors uppercase">
                {user.name ? user.name.charAt(0) : 'U'}
              </div>
              <ChevronDown size={16} className="text-slate-400 hidden sm:block" />

              {/* Dropdown User Menu */}
              <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-2 hidden group-hover:block animate-fade-in-down z-50">
                <div className="sm:hidden px-4 py-2 border-b border-slate-100 mb-1">
                  <div className="text-sm font-semibold text-slate-800">{user.name || 'ผู้ใช้งาน'}</div>
                  <div className="text-xs text-slate-500">{user.role || 'Officer'}</div>
                </div>
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <User size={16} /> โปรไฟล์
                </a>
                <a href="#" className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
                  <Settings size={16} /> ตั้งค่า
                </a>
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <LogOut size={16} /> ออกจากระบบ
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-slate-50 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;