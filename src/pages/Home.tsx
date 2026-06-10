import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mic, BarChart3, Users, ArrowRight } from 'lucide-react';
import { useAuthStore as useAuth } from '@/stores/authStore';
import { LANGUAGE_LIST, getLevelLabel, getLevelColor } from '@/utils/languageIcons';
import { apiGetAuth } from '@/utils/api';

interface CourseRec {
  id: number;
  title: string;
  level: string;
  language: string;
  coverColor: string;
}

const stats = [
  { value: '3', suffix: '+', label: '语种' },
  { value: '5000', suffix: '+', label: '学习者' },
  { value: '100', suffix: '+', label: '课程' },
  { value: '98', suffix: '%', label: '好评' },
];

const features = [
  { icon: BookOpen, title: '分级课程体系', desc: '从零基础到精通，科学分级学习路径', bg: 'bg-blue-100', text: 'text-blue-600' },
  { icon: Mic, title: '互动式学习', desc: '语音识别纠音，沉浸式听说训练', bg: 'bg-amber-100', text: 'text-amber-600' },
  { icon: BarChart3, title: '进度追踪', desc: '可视化学习数据，实时掌握学习进度', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  { icon: Users, title: '社区交流', desc: '与全球学习者互动，一起进步', bg: 'bg-purple-100', text: 'text-purple-600' },
];

function LanguageCard({ lang }: { lang: typeof LANGUAGE_LIST[number] }) {
  const info = { english: 'from-blue-500 to-blue-700', japanese: 'from-red-500 to-red-700', korean: 'from-purple-500 to-purple-700' }[lang.code] || 'from-slate-500 to-slate-700';
  return (
    <Link to={`/courses/${lang.code}`} className="card group overflow-hidden block" style={{ animationDelay: `${LANGUAGE_LIST.indexOf(lang) * 0.1}s` }}>
      <div className={`h-1.5 bg-gradient-to-r ${info}`} />
      <div className="p-6 text-center group-hover:-translate-y-1 transition-transform">
        <div className="text-4xl mb-3">{lang.flag}</div>
        <h3 className="text-lg font-semibold text-slate-800">{lang.name}</h3>
        <p className="text-sm text-slate-500 mt-1">{lang.label}</p>
        <p className="text-xs text-slate-400 mt-3">{lang.learners} 人在学</p>
      </div>
    </Link>
  );
}

function FeatureCard({ feat, i }: { feat: typeof features[number]; i: number }) {
  const Icon = feat.icon;
  return (
    <div className="card fade-in-scale p-6 flex flex-col items-center text-center gap-3" style={{ animationDelay: `${0.2 + i * 0.1}s` }}>
      <div className={`w-12 h-12 rounded-xl ${feat.bg} flex items-center justify-center`}>
        <Icon className={`w-6 h-6 ${feat.text}`} />
      </div>
      <h3 className="font-semibold text-slate-800">{feat.title}</h3>
      <p className="text-sm text-slate-500">{feat.desc}</p>
    </div>
  );
}

function StatCard({ stat }: { stat: typeof stats[number] }) {
  return (
    <div className="card fade-in-scale p-6 text-center">
      <div className="text-3xl font-bold text-slate-800 font-heading">
        <span className="counter-value">{stat.value}</span>{stat.suffix}
      </div>
      <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
    </div>
  );
}

export default function Home() {
  const { isLoggedIn, token } = useAuth();
  const [courses, setCourses] = useState<CourseRec[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    if (isLoggedIn && token) {
      apiGetAuth<{ courses: CourseRec[] }>('/recommendations')
        .then((data) => setCourses(data.courses?.slice(0, 6) || []))
        .catch(() => setCourses([]))
        .finally(() => setCoursesLoading(false));
    }
  }, [isLoggedIn, token]);

  return (
    <div className="page-enter">
      {/* ── Hero Section ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-tight">
              开启你的多语种学习之旅
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
              系统化的课程设计、智能学习追踪、沉浸式互动体验 — 让语言学习变得高效而有趣
            </p>
          </div>
          <div className="mt-14 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {LANGUAGE_LIST.map((lang) => (
              <LanguageCard key={lang.code} lang={lang} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800">为什么选择我们</h2>
          <p className="mt-3 text-slate-500">全方位的语言学习解决方案</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <FeatureCard key={i} feat={feat} i={i} />
          ))}
        </div>
      </section>

      {/* ── Recommended / CTA Section ── */}
      {isLoggedIn ? (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-800">为你推荐</h2>
            <p className="mt-3 text-slate-500">基于你的学习偏好，精选推荐课程</p>
          </div>
          {coursesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="card p-0 overflow-hidden animate-pulse">
                  <div className="h-24 bg-slate-200" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : courses.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c) => {
                const langInfo = LANGUAGE_LIST.find((l) => l.code === c.language);
                return (
                  <Link key={c.id} to={`/courses/${c.language}/${c.id}`} className="card fade-in-scale overflow-hidden block group">
                    <div className="h-24" style={{ background: c.coverColor || `linear-gradient(135deg, #2563EB, #7C3AED)` }} />
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getLevelColor(c.level)}`}>
                          {getLevelLabel(c.level)}
                        </span>
                        {langInfo && <span className="text-lg">{langInfo.flag}</span>}
                      </div>
                      <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{c.title}</h3>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-slate-400 py-12">
              <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>暂无推荐课程，快去探索吧</p>
            </div>
          )}
        </section>
      ) : (
        <section className="bg-gradient-to-br from-blue-50 to-purple-50 py-20">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-slate-800">准备好开始了吗？</h2>
            <p className="mt-4 text-slate-500 text-lg leading-relaxed">
              注册即可解锁个性化课程推荐、学习进度追踪和社区互动功能
            </p>
            <Link to="/register" className="btn-primary mt-8 text-base px-8 py-3 inline-flex items-center gap-2">
              免费注册 <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      )}

      {/* ── Stats Section ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <StatCard key={i} stat={stat} />
          ))}
        </div>
      </section>
    </div>
  );
}