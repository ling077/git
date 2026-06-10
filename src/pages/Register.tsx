import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, User, Mail, Lock, Globe } from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const LANG_OPTIONS = [
  { code: 'english', label: '英语', flag: '🇬🇧' },
  { code: 'japanese', label: '日语', flag: '🇯🇵' },
  { code: 'korean', label: '韩语', flag: '🇰🇷' },
];

export default function Register() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleLanguage = (code: string) => {
    setSelectedLanguages((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
    setError('');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('请输入用户名');
      return;
    }
    if (!email.trim()) {
      setError('请输入邮箱');
      return;
    }
    if (!password) {
      setError('请输入密码');
      return;
    }
    if (password.length < 6) {
      setError('密码至少需要6个字符');
      return;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (selectedLanguages.length === 0) {
      setError('请至少选择一门学习语言');
      return;
    }

    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password, selectedLanguages);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 page-enter">
      <div className="card w-full max-w-md p-8 fade-in-scale">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">创建账号</h1>
          <p className="text-sm text-slate-500 mt-1">开始你的多语言学习之旅</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">用户名</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => { setUsername(e.target.value); setError(''); }}
                placeholder="请输入用户名"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">邮箱</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                placeholder="请输入邮箱"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                placeholder="请设置密码（至少6位）"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">确认密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="请再次输入密码"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          </div>

          {/* Language preferences */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              想学习的语言 <span className="text-red-400">*</span>
            </label>
            <div className="flex gap-3">
              {LANG_OPTIONS.map((lang) => (
                <label
                  key={lang.code}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 cursor-pointer transition-all text-sm font-medium',
                    selectedLanguages.includes(lang.code)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={selectedLanguages.includes(lang.code)}
                    onChange={() => toggleLanguage(lang.code)}
                    className="sr-only"
                  />
                  <span>{lang.flag}</span>
                  <span>{lang.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2.5">
              {error}
            </div>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                注册中...
              </>
            ) : (
              '注册'
            )}
          </button>

          {/* Login link */}
          <p className="text-center text-sm text-slate-500">
            已有账号？{' '}
            <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              立即登录
            </a>
          </p>
        </form>
      </div>
    </div>
  );
}