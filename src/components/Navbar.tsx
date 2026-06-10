import { Link, useLocation, useNavigate } from 'react-router-dom';
import { BookOpen, Users, User, LogOut, Menu, X, GraduationCap, Globe } from 'lucide-react';
import { useAuth } from '@/stores/authStore';
import { useState } from 'react';

const navLinks = [
  { to: '/', label: '首页', icon: Globe },
  { to: '/community', label: '社区', icon: Users },
  { to: '/profile', label: '我的', icon: User, requiresAuth: true },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isLoggedIn, user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/25">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">
              Polyglot<span className="text-blue-600">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.requiresAuth && !isLoggedIn) return null;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <link.icon className="w-4 h-4" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                <span className="text-sm text-slate-500">
                  {user?.username}
                  {user?.consecutive_days > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-500 text-xs font-semibold">
                      🔥 {user.consecutive_days}天
                    </span>
                  )}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
                  登录
                </Link>
                <Link
                  to="/register"
                  className="btn-primary text-sm"
                >
                  免费注册
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/95 backdrop-blur-lg animate-fadeIn">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map(link => {
              if (link.requiresAuth && !isLoggedIn) return null;
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
            <div className="border-t border-slate-200 pt-3 mt-3">
              {isLoggedIn ? (
                <>
                  <div className="px-4 py-2 text-sm text-slate-500">
                    {user?.username} · 连续 {user?.consecutive_days || 0} 天
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 w-full"
                  >
                    <LogOut className="w-5 h-5" />
                    退出登录
                  </button>
                </>
              ) : (
                <div className="flex gap-3 px-4">
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-lg border border-slate-300 text-sm font-medium text-slate-700">
                    登录
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 text-center py-2.5 rounded-lg btn-primary text-sm">
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}