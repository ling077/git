import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, BookOpen } from 'lucide-react';
import { apiGet } from '@/utils/api';
import { getLanguageInfo, getLevelColor, getLevelLabel, LEVELS } from '@/utils/languageIcons';
import Empty from '@/components/Empty';

interface Course {
  id: number;
  title: string;
  language: string;
  level: string;
  cover_color: string;
  estimated_time: string;
  lesson_count: number;
}

interface CoursesResponse {
  success: boolean;
  courses: Course[];
}

type FilterLevel = 'all' | 'beginner' | 'intermediate' | 'advanced';

const LEVEL_FILTERS: { key: FilterLevel; label: string }[] = [
  { key: 'all', label: '全部' },
  ...LEVELS.map((l) => ({ key: l.value as FilterLevel, label: l.label })),
];

export default function Courses() {
  const { language } = useParams<{ language: string }>();
  const navigate = useNavigate();
  const lang = language || 'english';

  const langInfo = getLanguageInfo(lang);

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLevel, setActiveLevel] = useState<FilterLevel>('all');

  useEffect(() => {
    setLoading(true);
    setError('');

    let url = `/courses?language=${lang}`;
    if (activeLevel !== 'all') {
      url += `&level=${activeLevel}`;
    }

    apiGet<CoursesResponse>(url)
      .then((res) => {
        setCourses(res.courses || []);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : '加载失败');
      })
      .finally(() => setLoading(false));
  }, [lang, activeLevel]);

  const handleLevelChange = (level: FilterLevel) => {
    setActiveLevel(level);
  };

  // ── Skeleton cards ──
  const renderSkeletons = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="card overflow-hidden animate-pulse">
          <div className="h-40 bg-slate-200" />
          <div className="p-5 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4" />
            <div className="h-3 bg-slate-100 rounded w-1/4" />
            <div className="flex gap-4">
              <div className="h-3 bg-slate-100 rounded w-20" />
              <div className="h-3 bg-slate-100 rounded w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── Error state ──
  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
        <div className="text-center py-20">
          <p className="text-slate-500 mb-4">{error}</p>
          <button onClick={() => setActiveLevel(activeLevel)} className="btn-primary">
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 page-enter">
      {/* ── Header ── */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-4xl">{langInfo.flag}</span>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{langInfo.displayName}</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              选择适合你水平的课程，开始你的{langInfo.displayName}学习之旅
            </p>
          </div>
        </div>
      </div>

      {/* ── Filter tabs ── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {LEVEL_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => handleLevelChange(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activeLevel === f.key
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* ── Content area ── */}
      {loading ? (
        renderSkeletons()
      ) : courses.length === 0 ? (
        <Empty
          title="暂无课程"
          description="该分类下暂时没有课程，请尝试其他等级筛选"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <div
              key={course.id}
              onClick={() => navigate(`/learn/${course.id}`)}
              className="card overflow-hidden cursor-pointer group"
            >
              {/* Cover */}
              <div
                className={`h-40 bg-gradient-to-br ${course.cover_color} flex items-center justify-center relative`}
              >
                <BookOpen className="w-12 h-12 text-white/40" />
              </div>

              {/* Info */}
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {course.title}
                  </h3>
                </div>

                <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-medium ${getLevelColor(course.level)}`}>
                  {getLevelLabel(course.level)}
                </span>

                <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {course.estimated_time}
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.lesson_count} 课时
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}