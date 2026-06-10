import { Router, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import db from '../database.ts';
import type { CourseRow, UserRow } from '../../shared/types.ts';

const router = Router();

router.get('/', authMiddleware, (req: AuthRequest, res: Response): void => {
  const userId = req.userId!;

  const user = db.prepare('SELECT preferred_languages FROM users WHERE id = ?').get(userId) as { preferred_languages: string };
  let preferredLanguages: string[] = [];
  try {
    preferredLanguages = JSON.parse(user.preferred_languages);
  } catch {
    preferredLanguages = [];
  }

  const progressByLanguage = db.prepare(`
    SELECT c.language, COUNT(p.id) as completed
    FROM courses c
    LEFT JOIN progress p ON c.id = p.course_id AND p.user_id = ? AND p.completed = 1
    GROUP BY c.language
  `).all(userId) as { language: string; completed: number }[];

  let recommendations: CourseRow[];

  if (preferredLanguages.length > 0) {
    const completedCourses = db.prepare(`
      SELECT DISTINCT c.language, c.level FROM courses c
      JOIN progress p ON c.id = p.course_id WHERE p.user_id = ? AND p.completed = 1
    `).all(userId) as { language: string; level: string }[];

    const completedLevels = new Set<string>();
    completedCourses.forEach(c => completedLevels.add(`${c.language}:${c.level}`));

    const levelsOrder = ['beginner', 'intermediate', 'advanced'];
    const placeholders = preferredLanguages.map(() => '?').join(',');
    const queryParams = [...preferredLanguages];

    const allCourses = db.prepare(
      `SELECT * FROM courses WHERE language IN (${placeholders})`
    ).all(queryParams) as CourseRow[];

    recommendations = allCourses.filter(c => {
      const levelIndex = levelsOrder.indexOf(c.level);
      const prevLevel = levelsOrder[levelIndex - 1];
      if (!prevLevel) return true;
      return completedLevels.has(`${c.language}:${prevLevel}`);
    });
  } else {
    recommendations = db.prepare('SELECT * FROM courses WHERE level = ? ORDER BY language').all('beginner') as CourseRow[];
  }

  recommendations = recommendations.sort(() => Math.random() - 0.5).slice(0, 6);

  res.json({ success: true, courses: recommendations });
});

export default router;