import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGetAuth } from '@/utils/api';
import { getLanguageInfo, getLevelLabel, getLevelColor } from '@/utils/languageIcons';
import {
  Flame, BookOpen, CheckCircle, Pencil, LogIn, Trophy,
  Users, Crown, Mic, Headphones, FileText, Lock, RefreshCw,
  ChevronRight, Loader2,
} from 'lucide-react';

const ACHIEVEMENT_ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Login: LogIn, Flame: Flame, BookOpen: BookOpen, FileText: FileText,
  Headphones: Headphones, Mic: Mic, Trophy: Trophy, Users: Users, Crown: Crown,
};

interface AchievementData {
  id: number; name: string; description: string; icon: string;
}

const ALL_ACHIEVEMENTS: AchievementData[] = [
  { id: 1, name: '初次登录', description: '完成首次登录', icon: 'Login' },
  { id: 2, name: '连续学习3天', description: '连续打卡学习3天', icon: 'Flame' },
  { id: 3, name: '连续学习7天', description: '连续打卡学习7天', icon: 'Flame' },
  { id: 4, name: '单词达人', description: '累计学习100个单词', icon: 'BookOpen' },
  { id: 5, name: '语法专家', description: '完成50道语法练习', icon: 'FileText' },
  { id: 6, name: '听力冠军', description: '完成30次听力训练', icon: 'Headphones' },
  { id: 7, name: '口语先锋', description: '完成20次口语练习', icon: 'Mic' },
  { id: 8, name: '完成首门课程', description: '完成第一门完整课程', icon: 'Trophy' },
  { id: 9, name: '社区活跃', description: '发布10条社区动态', icon: 'Users' },
  { id: 10, name: '坚持王者', description: '连续学习30天', icon: 'Crown' },
];

interface ProgressCourse {
  course_id: number; title: string; language: string; level: string;
  lesson_count: number; completed_lessons: number;
}

interface LanguageStat {
  language: string; lessons: number; completed: number;
}

interface ProfileData {
  user: { id: number; username: string; preferred_languages: string[]; consecutive_days: number };
  progress: ProgressCourse[];
  stats: { total_courses: number; completed_lessons: number; word_count: number };
  achievements: { unlocked: AchievementData[]; unlockedCount: number };
  languageStats: LanguageStat[];
}

interface RecommendationCourse {
  id: number; title: string; language: string; level: string;
  description: string; cover_color: string; estimated_minutes: number; lesson_count: number;
}

// --- Inline Components ---

function StatCard({ icon: Icon, value, label }: { icon: React.ComponentType<{ className?: string }>; value: number | string; label: string }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-xs text-slate-500 mt-0.5">{label}</div>
      </div>
    </div>
  );
}

function AchievementBadge({ achievement, unlocked }: { achievement: AchievementData; unlocked: boolean }) {
  const Icon = ACHIEVEMENT_ICON_MAP[achievement.icon] || Trophy;
  return (
    <div className={`relative rounded-xl p-4 text-center transition-all ${
      unlocked
        ? 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 shadow-sm'
        : 'bg-slate-100 border border-slate-200'
    }`}>
      {!unlocked && (
        <div className="absolute inset-0 bg-white/60 rounded-xl flex items-center justify-center z-10">
          <Lock className="w-5 h-5 text-slate-400" />
        </div>
      )}
      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center mb-2 ${
        unlocked ? 'bg-amber-100' : 'bg-slate-200'
      }`}>
        <Icon className={`w-5 h-5 ${unlocked ? 'text-amber-600' : 'text-slate-400'}`} />
      </div>
      <div className={`text-sm font-semibold ${unlocked ? 'text-slate-800' : 'text-slate-400'}`}>
        {achievement.name}
      </div>
      <div className={`text-xs mt-1 ${unlocked ? 'text-slate-500' : 'text-slate-400'}`}>
        {unlocked ? achievement.description : '未解锁'}
      </div>
    </div>
  );
}

function CourseProgressRow({ course }: { course: ProgressCourse }) {
  const info = getLanguageInfo(course.language);
  const pct = Math.round((course.completed_lessons / course.lesson_count) * 100);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-0">
      <span className="text-xl">{info.flag}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">{course.title}</span>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getLevelColor(course.level)}`}>
            {getLevelLabel(course.level)}
          </span>
        </div>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{
              width: `${pct}%`,
              backgroundColor: info.color,
            }} />
          </div>
          <span className="text-xs text-slate-500 w-12 text-right">
            {course.completed_lessons}/{course.lesson_count}
          </span>
          <span className="text-xs font-semibold text-slate-700 w-9 text-right">{pct}%</span>
        </div>
      </div>
    </div>
  );
}

function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`card p-5 animate-pulse ${className}`}>
    <div className="flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-slate-200" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-100 rounded w-1/2" />
      </div>
    </div>
  </div>;
}

// --- Page Component ---

export default function Profile() {
  const { isLoggedIn, user: authUser } = useAuthStore();
  const [data, setData] = useState<ProfileData | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = async () => {
    setLoading(true); setError('');
    try {
      const [profileData, recData] = await Promise.all([
        apiGetAuth<any>('/progress'),
        apiGetAuth<any>('/recommendations'),
      ]);
      setData(profileData);
      setRecommendations(recData.courses || []);
    } catch (err: any) {
      setError(err.message || '加载失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (isLoggedIn) fetchData(); }, [isLoggedIn]);
  useEffect(() => { if (!isLoggedIn) setLoading(false); }, [isLoggedIn]);

  // Not logged in
  if (!isLoggedIn) {
    return (
      <div className="page-enter max-w-lg mx-auto px-4 py-20 text-center">
        <div className="card p-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <Lock className="w-8 h-8 text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-6">登录后即可查看个人学习数据和进度</p>
          <Link to="/login" className="btn-primary text-sm">立即登录</Link>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="page-enter max-w-lg mx-auto px-4 py-20 text-center">
        <div className="card p-10">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">加载失败</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={fetchData} className="btn-primary text-sm">重试</button>
        </div>
      </div>
    );
  }

  // Loading
  if (loading) {
    return (
      <div className="page-enter max-w-4xl mx-auto px-4 py-8 space-y-6">
        <SkeletonCard className="!bg-gradient-to-br !from-blue-50 !to-indigo-50 h-24" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <SkeletonCard key={i} />)}
        </div>
        <SkeletonCard className="h-40" />
        <SkeletonCard className="h-32" />
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5].map(i => <div key={i} className="card p-4 animate-pulse"><div className="w-10 h-10 bg-slate-200 rounded-full mx-auto mb-2" /><div className="h-3 bg-slate-200 rounded mx-auto w-16" /></div>)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { user, progress, stats, achievements, languageStats } = data;
  const unlockedIds = new Set(achievements.unlocked.map(a => a.id));

  return (
    <div className="page-enter max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* User Info Header */}
      <div className="card !bg-gradient-to-br from-blue-500 to-indigo-600 text-white !border-none p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{user.username}</h1>
            <p className="text-blue-100 text-sm">{authUser?.email}</p>
            <div className="flex items-center gap-3 mt-2 text-sm text-blue-100">
              <span className="flex items-center gap-1">
                <Flame className="w-4 h-4 text-amber-300" />
                连续 {user.consecutive_days} 天
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Learning Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={BookOpen} value={stats.total_courses} label="已学课程" />
        <StatCard icon={CheckCircle} value={stats.completed_lessons} label="已完成课时" />
        <StatCard icon={Flame} value={user.consecutive_days} label="连续学习" />
        <StatCard icon={Pencil} value={stats.word_count} label="单词练习" />
      </div>

      {/* Language Proficiency */}
      {languageStats.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">语言能力</h2>
          <div className="space-y-4">
            {languageStats.map(ls => {
              const info = getLanguageInfo(ls.language);
              const pct = ls.lessons > 0 ? Math.round((ls.completed / ls.lessons) * 100) : 0;
              return (
                <div key={ls.language} className="flex items-center gap-3">
                  <span className="text-xl w-8">{info.flag}</span>
                  <span className="text-sm font-medium text-slate-700 w-16">{info.displayName}</span>
                  <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{
                      width: `${pct}%`,
                      backgroundColor: info.color,
                    }} />
                  </div>
                  <span className="text-sm font-semibold text-slate-600 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Progress */}
      {progress.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">最近进度</h2>
          <div>
            {progress.slice(0, 6).map(c => (
              <CourseProgressRow key={c.course_id} course={c} />
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">成就徽章</h2>
          <span className="text-sm text-slate-500">{achievements.unlockedCount}/{ALL_ACHIEVEMENTS.length}</span>
        </div>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
          {ALL_ACHIEVEMENTS.map(ach => (
            <AchievementBadge
              key={ach.id}
              achievement={ach}
              unlocked={unlockedIds.has(ach.id)}
            />
          ))}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="card p-6">
          <h2 className="text-lg font-bold text-slate-800 mb-4">推荐课程</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.slice(0, 4).map(rec => {
              const info = getLanguageInfo(rec.language);
              return (
                <Link
                  key={rec.id}
                  to={`/courses/${rec.id}`}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all group"
                >
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: rec.cover_color || info.color }}>
                    {rec.title.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-700 truncate">
                      {rec.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs">{info.flag}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${getLevelColor(rec.level)}`}>
                        {getLevelLabel(rec.level)}
                      </span>
                      <span className="text-xs text-slate-400">{rec.lesson_count} 课时</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 shrink-0" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}