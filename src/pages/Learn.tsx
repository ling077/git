import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Languages,
  Mic,
  Headphones,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Play,
  Loader2,
  AlertCircle,
  RotateCcw,
  Circle,
  Radio,
  Sparkles,
} from 'lucide-react';
import { apiGetAuth, apiPostAuth } from '@/utils/api';
import { getLanguageInfo, getLevelLabel } from '@/utils/languageIcons';
import Empty from '@/components/Empty';

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface Course {
  id: number;
  title: string;
  language: string;
  level: string;
  description: string;
  cover_color: string;
  estimated_minutes: number;
  lesson_count: number;
}

interface WordItem {
  en: string;
  zh: string;
  example: string;
}

interface GrammarQuestion {
  q: string;
  options: string[];
  answer: number;
  explain: string;
}

interface ListeningQuestion {
  q: string;
  options: string[];
  answer: number;
}

interface LessonContent {
  words?: WordItem[];
  questions?: GrammarQuestion[];
  sentence?: string;
  translation?: string;
  script?: string;
}

interface Lesson {
  id: number;
  course_id: number;
  title: string;
  type: string;
  content: LessonContent;
  sort_order: number;
}

interface ProgressEntry {
  completed: boolean;
  score: number;
}

type ProgressMap = Record<number, ProgressEntry>;
type TabKey = 'word' | 'grammar' | 'speaking' | 'listening';

/* ------------------------------------------------------------------ */
/*  Tab config                                                        */
/* ------------------------------------------------------------------ */

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'word', label: '单词记忆', icon: BookOpen },
  { key: 'grammar', label: '语法练习', icon: Languages },
  { key: 'speaking', label: '口语跟读', icon: Mic },
  { key: 'listening', label: '听力训练', icon: Headphones },
];

/* ================================================================== */
/*  Word Module                                                        */
/* ================================================================== */

function WordModule({ words, onComplete }: { words: WordItem[]; onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [finished, setFinished] = useState(false);

  const current = words[index];

  const handleAnswer = (isKnown: boolean) => {
    if (isKnown) setKnown((k) => k + 1);
    else setUnknown((u) => u + 1);

    if (index + 1 < words.length) {
      setFlipped(false);
      setIndex((i) => i + 1);
    } else {
      const score = Math.round((known + (isKnown ? 1 : 0)) / words.length * 100);
      setFinished(true);
      onComplete(score);
    }
  };

  const handleRetry = () => {
    setIndex(0);
    setFlipped(false);
    setKnown(0);
    setUnknown(0);
    setFinished(false);
  };

  if (words.length === 0) {
    return <Empty title="暂无单词内容" description="该课程暂未添加单词数据" />;
  }

  if (finished) {
    const totalScore = Math.round(known / words.length * 100);
    return (
      <div className="fade-in-scale space-y-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">单词复习完成！</h3>
        </div>

        <div className="card p-6 space-y-4">
          <div className="flex justify-around text-center">
            <div>
              <p className="text-3xl font-bold text-emerald-500">{known}</p>
              <p className="text-sm text-slate-500 mt-1">已认识</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-rose-400">{unknown}</p>
              <p className="text-sm text-slate-500 mt-1">需复习</p>
            </div>
          </div>

          <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${totalScore}%` }}
            />
          </div>
          <p className="text-center text-sm text-slate-500">掌握率 {totalScore}%</p>

          <button onClick={handleRetry} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4" />
            重新复习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{index + 1} / {words.length}</span>
        <div className="flex-1 mx-4 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((index) / words.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flip Card */}
      <div
        className="relative cursor-pointer select-none"
        style={{ perspective: '1000px' }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="card relative w-full min-h-[220px] transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <p className="text-3xl font-bold text-blue-700">{current.en}</p>
            <p className="text-sm text-slate-400 mt-3">点击翻转查看释义</p>
          </div>
          {/* Back */}
          <div
            className="absolute inset-0 flex flex-col items-center justify-center p-6 gap-3"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <p className="text-2xl font-bold text-emerald-600">{current.zh}</p>
            <p className="text-sm text-slate-500 italic text-center">{current.example}</p>
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3">
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer(false); }}
          className="flex-1 py-3 rounded-xl border-2 border-rose-200 text-rose-500 font-semibold hover:bg-rose-50 transition-colors"
        >
          <XCircle className="w-5 h-5 inline mr-1.5 -mt-0.5" />
          不认识
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleAnswer(true); }}
          className="flex-1 py-3 rounded-xl border-2 border-emerald-200 text-emerald-500 font-semibold hover:bg-emerald-50 transition-colors"
        >
          <CheckCircle2 className="w-5 h-5 inline mr-1.5 -mt-0.5" />
          认识
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Grammar Module                                                     */
/* ================================================================== */

function GrammarModule({ questions, onComplete }: { questions: GrammarQuestion[]; onComplete: (score: number) => void }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<(boolean | null)[]>(() => new Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  const current = questions[index];
  const answered = selected !== null;

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    const correct = optIdx === current.answer;
    const next = [...answers];
    next[index] = correct;
    setAnswers(next);
  };

  const handleNext = () => {
    if (index + 1 < questions.length) {
      setSelected(null);
      setIndex((i) => i + 1);
    } else {
      const correctCount = answers.filter((a) => a === true).length;
      const score = Math.round(correctCount / questions.length * 100);
      setFinished(true);
      onComplete(score);
    }
  };

  const handleRetry = () => {
    setIndex(0);
    setSelected(null);
    setAnswers(new Array(questions.length).fill(null));
    setFinished(false);
  };

  if (questions.length === 0) {
    return <Empty title="暂无语法题目" description="该课程暂未添加语法练习" />;
  }

  if (finished) {
    const correctCount = answers.filter((a) => a === true).length;
    const score = Math.round(correctCount / questions.length * 100);
    return (
      <div className="fade-in-scale space-y-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">语法练习完成！</h3>
        </div>

        <div className="card p-6 space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">{correctCount}<span className="text-xl text-slate-400">/{questions.length}</span></p>
            <p className="text-sm text-slate-500 mt-1">正确率 {score}%</p>
          </div>

          <div className="bg-slate-100 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-400' : 'bg-rose-400'}`}
              style={{ width: `${score}%` }}
            />
          </div>

          <button onClick={handleRetry} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4" />
            重新练习
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-5">
      {/* Progress */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>题目 {index + 1} / {questions.length}</span>
        <span className="font-semibold text-blue-600">
          得分 {answers.filter((a) => a === true).length}
        </span>
      </div>

      {/* Question */}
      <div className="card p-6">
        <p className="text-lg font-semibold text-slate-800 mb-5">{current.q}</p>

        <div className="space-y-2.5">
          {current.options.map((opt, i) => {
            let btnClass = 'border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50 text-slate-700';
            if (answered) {
              if (i === current.answer) {
                btnClass = 'border-emerald-400 bg-emerald-50 text-emerald-700';
              } else if (i === selected && i !== current.answer) {
                btnClass = 'border-rose-400 bg-rose-50 text-rose-700';
              } else {
                btnClass = 'border-slate-200 bg-slate-50 text-slate-400';
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left font-medium transition-all duration-200 ${btnClass}`}
              >
                {answered && i === current.answer ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : answered && i === selected && i !== current.answer ? (
                  <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                )}
                <span>{opt}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation */}
        {answered && (
          <div className={`mt-4 p-4 rounded-xl text-sm animate-fadeIn ${selected === current.answer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
            <p className="font-semibold mb-1">{selected === current.answer ? '✓ 回答正确！' : '✗ 回答错误'}</p>
            <p>{current.explain}</p>
          </div>
        )}
      </div>

      {answered && (
        <button onClick={handleNext} className="btn-primary w-full">
          {index + 1 < questions.length ? (
            <>下一题 <ChevronRight className="w-4 h-4" /></>
          ) : (
            <>查看结果 <Sparkles className="w-4 h-4" /></>
          )}
        </button>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Speaking Module                                                    */
/* ================================================================== */

function SpeakingModule({ sentence, translation, onComplete }: { sentence: string; translation: string; onComplete: (score: number) => void }) {
  const [phase, setPhase] = useState<'idle' | 'recording' | 'done'>('idle');
  const [score, setScore] = useState(0);

  const startRecording = () => {
    setPhase('recording');
    // Simulate 3-second recording
    setTimeout(() => {
      const simulated = 70 + Math.floor(Math.random() * 30);
      setScore(simulated);
      setPhase('done');
      onComplete(simulated);
    }, 3000);
  };

  const handleRetry = () => {
    setPhase('idle');
    setScore(0);
  };

  if (!sentence) {
    return <Empty title="暂无口语内容" description="该课程暂未添加口语练习" />;
  }

  return (
    <div className="fade-in space-y-5">
      {/* Target Sentence */}
      <div className="card p-6 text-center space-y-3">
        <p className="text-2xl font-bold text-slate-800 leading-relaxed">{sentence}</p>
        <p className="text-sm text-slate-500">{translation}</p>
      </div>

      {/* Recording UI */}
      {phase === 'idle' && (
        <button onClick={startRecording} className="btn-primary w-full py-4 text-lg">
          <Mic className="w-5 h-5" />
          开始录音
        </button>
      )}

      {phase === 'recording' && (
        <div className="card p-8 text-center space-y-4">
          <div className="relative w-20 h-20 mx-auto">
            <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-20" />
            <div className="absolute inset-0 rounded-full border-4 border-rose-400 flex items-center justify-center">
              <Mic className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-semibold text-rose-500">正在录音中...</p>
          <p className="text-sm text-slate-400">请大声跟读上方句子</p>
        </div>
      )}

      {phase === 'done' && (
        <div className="fade-in-scale space-y-4">
          <div className="card p-6 text-center space-y-4">
            <div className="w-20 h-20 mx-auto rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <div>
              <p className="text-3xl font-bold text-emerald-600">{score}<span className="text-lg text-slate-400">分</span></p>
              <p className="text-sm text-slate-500 mt-1">
                {score >= 90 ? '发音非常标准！' : score >= 75 ? '发音良好，继续加油！' : '还需多练习发音哦~'}
              </p>
            </div>
          </div>

          <button onClick={handleRetry} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4" />
            再试一次
          </button>
        </div>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Listening Module                                                   */
/* ================================================================== */

function ListeningModule({ script, questions, onComplete }: { script: string; questions: ListeningQuestion[]; onComplete: (score: number) => void }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScript, setShowScript] = useState(false);
  const [qIndex, setQIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [qAnswers, setQAnswers] = useState<(boolean | null)[]>(() => new Array(questions.length).fill(null));
  const [finished, setFinished] = useState(false);

  const current = questions[qIndex];
  const answered = selected !== null;

  const handlePlay = () => {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
      setShowScript(true);
    }, 2000);
  };

  const handleSelect = (optIdx: number) => {
    if (answered) return;
    setSelected(optIdx);
    const correct = optIdx === current.answer;
    const next = [...qAnswers];
    next[qIndex] = correct;
    setQAnswers(next);
  };

  const handleNext = () => {
    if (qIndex + 1 < questions.length) {
      setSelected(null);
      setQIndex((i) => i + 1);
    } else {
      const correctCount = qAnswers.filter((a) => a === true).length;
      setFinished(true);
      onComplete(Math.round(correctCount / questions.length * 100));
    }
  };

  const handleRetry = () => {
    setShowScript(false);
    setIsPlaying(false);
    setQIndex(0);
    setSelected(null);
    setQAnswers(new Array(questions.length).fill(null));
    setFinished(false);
  };

  if (questions.length === 0) {
    return <Empty title="暂无听力题目" description="该课程暂未添加听力训练" />;
  }

  if (finished) {
    const correctCount = qAnswers.filter((a) => a === true).length;
    const score = Math.round(correctCount / questions.length * 100);
    return (
      <div className="fade-in-scale space-y-6">
        <div className="text-center">
          <Sparkles className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-slate-800">听力训练完成！</h3>
        </div>

        <div className="card p-6 space-y-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-violet-600">{correctCount}<span className="text-xl text-slate-400">/{questions.length}</span></p>
            <p className="text-sm text-slate-500 mt-1">正确率 {score}%</p>
          </div>

          <button onClick={handleRetry} className="btn-primary w-full">
            <RotateCcw className="w-4 h-4" />
            重新训练
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-5">
      {/* Play Audio */}
      {!showScript ? (
        <button
          onClick={handlePlay}
          disabled={isPlaying}
          className="card w-full p-6 flex flex-col items-center gap-3 hover:border-violet-300 transition-colors"
        >
          {isPlaying ? (
            <>
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-violet-500 animate-ping opacity-20" />
                <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                </div>
              </div>
              <p className="font-semibold text-violet-600">播放中...</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center">
                <Play className="w-8 h-8 text-violet-500 ml-1" />
              </div>
              <p className="font-semibold text-violet-600">播放音频</p>
              <p className="text-xs text-slate-400">点击播放，仔细听内容</p>
            </>
          )}
        </button>
      ) : (
        <>
          {/* Script display */}
          <div className="card p-5 bg-violet-50/50 border-violet-200">
            <p className="text-sm text-violet-700 leading-relaxed">{script}</p>
            <button
              onClick={handlePlay}
              className="mt-3 text-xs text-violet-500 hover:text-violet-700 flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> 重新播放
            </button>
          </div>

          {/* Question */}
          <div className="card p-5">
            <p className="text-sm text-slate-400 mb-4">题目 {qIndex + 1} / {questions.length}</p>
            <p className="text-base font-semibold text-slate-800 mb-4">{current.q}</p>

            <div className="space-y-2">
              {current.options.map((opt, i) => {
                let btnClass = 'border-slate-200 bg-white hover:border-violet-300 hover:bg-violet-50';
                if (answered) {
                  if (i === current.answer) {
                    btnClass = 'border-emerald-400 bg-emerald-50';
                  } else if (i === selected && i !== current.answer) {
                    btnClass = 'border-rose-400 bg-rose-50';
                  } else {
                    btnClass = 'border-slate-200 bg-slate-50 opacity-60';
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={answered}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left text-sm transition-all duration-200 ${btnClass}`}
                  >
                    {answered && i === current.answer ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    ) : answered && i === selected && i !== current.answer ? (
                      <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    ) : (
                      <Radio className="w-5 h-5 text-slate-300 shrink-0" />
                    )}
                    <span className="font-medium text-slate-700">{opt}</span>
                  </button>
                );
              })}
            </div>

            {answered && (
              <div className={`mt-4 p-3 rounded-xl text-sm ${selected === current.answer ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                {selected === current.answer ? '✓ 正确！' : `✗ 错误，正确答案是: ${current.options[current.answer]}`}
              </div>
            )}
          </div>

          {answered && (
            <button onClick={handleNext} className="btn-primary w-full">
              {qIndex + 1 < questions.length ? (
                <>下一题 <ChevronRight className="w-4 h-4" /></>
              ) : (
                <>查看结果 <Sparkles className="w-4 h-4" /></>
              )}
            </button>
          )}
        </>
      )}
    </div>
  );
}

/* ================================================================== */
/*  Main Learn Page                                                    */
/* ================================================================== */

export default function Learn() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<ProgressMap>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLessonIndex, setActiveLessonIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<TabKey>('word');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());

  /* ---- fetch course ---- */
  useEffect(() => {
    let cancelled = false;
    const fetchCourse = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiGetAuth<{ course: Course; lessons: Lesson[]; progress: ProgressMap }>(`/courses/${courseId}`);
        if (cancelled) return;
        setCourse(data.course);
        setLessons(data.lessons || []);
        setProgress(data.progress || {});
      } catch (e: any) {
        if (!cancelled) setError(e.message || '加载失败');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchCourse();
    return () => { cancelled = true; };
  }, [courseId]);

  /* ---- helpers ---- */
  const currentLesson = lessons[activeLessonIndex];

  const lessonCompleted = (lessonId: number) => {
    return progress[lessonId]?.completed === true;
  };

  const completedCount = lessons.filter((l) => lessonCompleted(l.id)).length;

  const setLessonProgress = (lessonId: number, score: number) => {
    setProgress((prev) => ({
      ...prev,
      [lessonId]: { completed: true, score },
    }));
  };

  /* ---- save progress ---- */
  const saveProgress = useCallback(
    async (lessonId: number, moduleType: string, score: number) => {
      const key = `${lessonId}-${moduleType}`;
      if (completedModules.has(key)) return;
      setCompletedModules((prev) => new Set(prev).add(key));
      try {
        await apiPostAuth(`/progress/${courseId}`, {
          lessonId,
          moduleType,
          score,
          completed: true,
        });
        setLessonProgress(lessonId, score);
      } catch {
        // silently fail
      }
    },
    [courseId, completedModules],
  );

  /* ---- Determine default tab based on lesson type ---- */
  useEffect(() => {
    if (currentLesson) {
      const typeMap: Record<string, TabKey> = {
        word: 'word',
        grammar: 'grammar',
        speaking: 'speaking',
        listening: 'listening',
      };
      setActiveTab(typeMap[currentLesson.type] || 'word');
    }
  }, [activeLessonIndex, lessons]);

  /* ---- render states ---- */

  if (loading) {
    return (
      <div className="page-enter max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded-lg w-48" />
          <div className="h-4 bg-slate-200 rounded w-64" />
          <div className="h-3 bg-slate-200 rounded-full w-full" />
          <div className="flex gap-4">
            <div className="w-56 h-96 bg-slate-200 rounded-xl" />
            <div className="flex-1 h-96 bg-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-enter max-w-6xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">加载失败</h2>
        <p className="text-slate-500 mb-6">{error}</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          重新加载
        </button>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="page-enter max-w-6xl mx-auto px-4 py-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-6">
          <ArrowLeft className="w-4 h-4" /> 返回
        </button>
        <Empty title="暂无课程内容" description="该课程还没有可用的学习内容" />
      </div>
    );
  }

  const langInfo = course ? getLanguageInfo(course.language) : null;

  return (
    <div className="page-enter max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* ---- Header ---- */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-0.5">
            <span>课程</span>
            <ChevronRight className="w-3 h-3" />
            <span className="text-slate-700 font-medium truncate">{course?.title}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
            {langInfo && <span className="text-2xl">{langInfo.flag}</span>}
            {course?.title}
          </h1>
        </div>
        {course && (
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-semibold">
            {getLevelLabel(course.level)}
          </span>
        )}
      </div>

      {/* ---- Progress Bar ---- */}
      <div className="card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-slate-700">
            {completedCount} / {lessons.length} 已完成
          </span>
          <span className="text-slate-400">
            {completedCount === lessons.length ? '🎉 全部完成！' : `${lessons.length - completedCount} 课待学习`}
          </span>
        </div>
        <div className="bg-slate-200 rounded-full h-2.5 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-500"
            style={{ width: `${lessons.length > 0 ? (completedCount / lessons.length) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* ---- Body: Sidebar + Content ---- */}
      <div className="flex gap-5">
        {/* Mobile dropdown */}
        <div className="md:hidden w-full">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="card w-full p-3.5 flex items-center justify-between text-sm font-medium text-slate-700"
          >
            <span className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-500" />
              {currentLesson?.title || '选择课时'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
          </button>
          {sidebarOpen && (
            <div className="card mt-2 divide-y divide-slate-100 animate-fadeIn">
              {lessons.map((lesson, i) => (
                <button
                  key={lesson.id}
                  onClick={() => { setActiveLessonIndex(i); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                    i === activeLessonIndex ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    i === activeLessonIndex ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {i + 1}
                  </span>
                  <span className="flex-1 truncate">{lesson.title}</span>
                  {lessonCompleted(lesson.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Desktop sidebar */}
        <div className="hidden md:block w-60 shrink-0">
          <div className="card divide-y divide-slate-100 sticky top-20 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50/50">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">课程列表</p>
            </div>
            {lessons.map((lesson, i) => (
              <button
                key={lesson.id}
                onClick={() => setActiveLessonIndex(i)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors ${
                  i === activeLessonIndex ? 'bg-blue-50 text-blue-700 font-semibold border-r-2 border-blue-500' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  i === activeLessonIndex ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  {i + 1}
                </span>
                <span className="flex-1 truncate">{lesson.title}</span>
                {lessonCompleted(lesson.id) && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="card overflow-hidden">
            {/* Tab switcher */}
            <div className="flex border-b border-slate-200 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-700 bg-blue-50/50'
                      : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Module content */}
            <div className="p-5">
              {currentLesson && (
                <ModuleRenderer
                  lesson={currentLesson}
                  activeTab={activeTab}
                  saveProgress={saveProgress}
                />
              )}
            </div>
          </div>

          {/* Lesson navigation */}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => setActiveLessonIndex(Math.max(0, activeLessonIndex - 1))}
              disabled={activeLessonIndex === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> 上一课
            </button>
            <button
              onClick={() => setActiveLessonIndex(Math.min(lessons.length - 1, activeLessonIndex + 1))}
              disabled={activeLessonIndex >= lessons.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              下一课 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Module Renderer – delegates to the correct sub-module              */
/* ================================================================== */

function ModuleRenderer({
  lesson,
  activeTab,
  saveProgress,
}: {
  lesson: Lesson;
  activeTab: TabKey;
  saveProgress: (lessonId: number, moduleType: string, score: number) => void;
}) {
  const content = lesson.content || {};

  const handleComplete = (score: number) => {
    saveProgress(lesson.id, activeTab, score);
  };

  switch (activeTab) {
    case 'word':
      return <WordModule words={content.words || []} onComplete={handleComplete} />;
    case 'grammar':
      return <GrammarModule questions={(content.questions as any[]) || []} onComplete={handleComplete} />;
    case 'speaking':
      return (
        <SpeakingModule
          sentence={content.sentence || ''}
          translation={content.translation || ''}
          onComplete={handleComplete}
        />
      );
    case 'listening':
      return (
        <ListeningModule
          script={content.script || ''}
          questions={(content.questions as any[]) || []}
          onComplete={handleComplete}
        />
      );
    default:
      return null;
  }
}