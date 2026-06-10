import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import db from '../database.ts';
import type {
  UserRow, CourseProgressRow, UserStatsRow,
  LanguageStatRow, AchievementRow, UserAchievementRow
} from '../../shared/types.ts';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const userId = req.userId!;

  const user = db.prepare('SELECT id, username, preferred_languages, consecutive_days FROM users WHERE id = ?').get(userId) as any;
  user.preferred_languages = JSON.parse(user.preferred_languages);

  const progressRows = db.prepare(`
    SELECT c.id as course_id, c.title, c.language, c.level, c.lesson_count,
           COUNT(p.id) as completed_lessons
    FROM courses c
    LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = ? AND p.completed = 1
    WHERE c.id IN (
      SELECT DISTINCT course_id FROM progress WHERE user_id = ?
    )
    GROUP BY c.id
  `).all(userId, userId) as CourseProgressRow[];

  const totalStats = db.prepare(`
    SELECT
      COUNT(DISTINCT course_id) as total_courses,
      COUNT(*) as total_lessons,
      SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed_lessons,
      SUM(CASE WHEN module_type = 'word' THEN 1 ELSE 0 END) as word_count,
      SUM(CASE WHEN module_type = 'grammar' THEN 1 ELSE 0 END) as grammar_count,
      SUM(CASE WHEN module_type = 'listening' THEN 1 ELSE 0 END) as listening_count,
      SUM(CASE WHEN module_type = 'speaking' THEN 1 ELSE 0 END) as speaking_count
    FROM progress WHERE user_id = ?
  `).get(userId) as UserStatsRow;

  const achievements = db.prepare(`
    SELECT a.*, ua.unlocked_at
    FROM achievements a
    JOIN user_achievements ua ON a.id = ua.achievement_id
    WHERE ua.user_id = ?
    ORDER BY a.id
  `).all(userId) as (AchievementRow & { unlocked_at: string })[];

  const allAchievements = db.prepare('SELECT * FROM achievements ORDER BY id').all() as AchievementRow[];

  const languageStats = db.prepare(`
    SELECT c.language, COUNT(p.id) as lessons, SUM(CASE WHEN p.completed = 1 THEN 1 ELSE 0 END) as completed
    FROM courses c
    JOIN progress p ON c.id = p.course_id
    WHERE p.user_id = ?
    GROUP BY c.language
  `).all(userId) as LanguageStatRow[];

  res.json({
    success: true,
    user,
    progress: progressRows,
    stats: totalStats,
    achievements: {
      unlocked: achievements,
      total: allAchievements.length,
      unlockedCount: achievements.length
    },
    languageStats
  });
});

interface ProgressBody {
  lessonId: number;
  moduleType: string;
  score: number;
  completed: boolean;
}

router.post('/:courseId', authMiddleware, (req: Request<{ courseId: string }, {}, ProgressBody>, res: Response): void => {
  const userId = (req as AuthRequest).userId!;
  const courseId = parseInt(req.params.courseId);
  const { lessonId, moduleType, score, completed } = req.body;

  const existing = db.prepare(
    'SELECT id FROM progress WHERE user_id = ? AND course_id = ? AND lesson_id = ?'
  ).get(userId, courseId, lessonId) as { id: number } | undefined;

  if (existing) {
    db.prepare(`
      UPDATE progress SET score = ?, completed = ?, module_type = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(score, completed ? 1 : 0, moduleType, existing.id);
  } else {
    db.prepare(`
      INSERT INTO progress (user_id, course_id, lesson_id, module_type, score, completed)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(userId, courseId, lessonId, moduleType, score, completed ? 1 : 0);
  }

  // Check for achievements
  const stats = db.prepare(`
    SELECT
    COUNT(CASE WHEN module_type = 'word' THEN 1 ELSE 0 END) as word_count,
      COUNT(CASE WHEN module_type = 'grammar' THEN 1 ELSE 0 END) as grammar_count,
      COUNT(CASE WHEN module_type = 'listening' THEN 1 ELSE 0 END) as listening_count,
      COUNT(CASE WHEN module_type = 'speaking' THEN 1 ELSE 0 END) as speaking_count,
      COUNT(DISTINCT CASE WHEN completed = 1 THEN course_id ELSE NULL END) as course_complete
    FROM progress WHERE user_id = ? AND completed = 1
  `).get(userId) as any;

  const user = db.prepare('SELECT consecutive_days FROM users WHERE id = ?').get(userId) as { consecutive_days: number };

  const checkConditions: { type: string; value: number }[] = [
    { type: 'word_count', value: stats.word_count },
    { type: 'grammar_count', value: stats.grammar_count },
    { type: 'listening_count', value: stats.listening_count },
    { type: 'speaking_count', value: stats.speaking_count },
    { type: 'course_complete', value: stats.course_complete },
    { type: 'consecutive_days', value: user.consecutive_days },
  ];

  const achievementsToUnlock = db.prepare(`
    SELECT a.* FROM achievements a
    LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = ?
    WHERE ua.id IS NULL
  `).all(userId) as AchievementRow[];

  for (const ach of achievementsToUnlock) {
    const cond = checkConditions.find(c => c.type === ach.condition_type);
    if (cond && cond.value >= ach.condition_value) {
      db.prepare('INSERT INTO user_achievements (user_id, achievement_id) VALUES (?, ?)').run(userId, ach.id);
    }
  }

  res.json({ success: true, message: '进度已保存' });
});

export default router;