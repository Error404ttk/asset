import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, Monitor, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.login({ username, password });

      // Trigger Exit Animation
      setIsExiting(true);

      // Successful login
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('token', response.token);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Delay navigation to allow animation to play
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      setError(err.message || 'ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 transition-colors duration-700">
      {/* Background Decoration */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none transition-opacity duration-700 ${isExiting ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary-200/20 blur-3xl"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-200/20 blur-3xl"></div>
      </div>

      <div
        className={`bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-10 flex flex-col 
        animate-scale-in transition-all duration-500 ease-in-out transform
        ${isExiting ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}
        `}
      >
        {/* Header Section */}
        <div className="bg-slate-900 p-8 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary-400 via-blue-500 to-primary-600"></div>
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-lg shadow-primary-900/50">
            <span className="text-3xl font-bold">G</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">ระบบสำรวจครุภัณฑ์คอมพิวเตอร์</h1>
          <p className="text-slate-400 text-sm">ระบบบริหารจัดการครุภัณฑ์คอมพิวเตอร์</p>
        </div>

        {/* Login Form */}
        <div className="p-8 pt-10">
          <form onSubmit={handleLogin} className="space-y-6">

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg flex items-center gap-2 animate-fade-in">
                <ShieldCheck size={18} />
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">ชื่อผู้ใช้งาน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="Username"
                    value={username}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^a-zA-Z0-9@._-]/g, '');
                      setUsername(value);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">รหัสผ่าน</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-primary-500 transition-colors" />
                  </div>
                  <input
                    type="password"
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all bg-slate-50 focus:bg-white"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="flex justify-end mt-2">
                  <a href="#" className="text-xs text-primary-600 hover:text-primary-700 hover:underline font-medium">ลืมรหัสผ่าน?</a>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isExiting}
              className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-primary-600/30 transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  เข้าสู่ระบบ <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-xs text-slate-400">
              © 2025 ระบบสำรวจครุภัณฑ์ประจำปี <br />
              ติดต่อฝ่ายสารสนเทศ โทร 203
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;