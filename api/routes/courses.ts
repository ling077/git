import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import db from '../database.ts';
import type { CourseRow, LessonRow } from '../../shared/types.ts';

const router = Router();

interface ListQuery {
  language?: string;
  level?: string;
}

router.get('/', (req: Request<{}, {}, {}, ListQuery>, res: Response): void => {
  let sql = 'SELECT * FROM courses';
  const params: string[] = [];

  if (req.query.language || req.query.level) {
    const conditions: string[] = [];
    if (req.query.language) {
      conditions.push('language = ?');
      params.push(req.query.language);
    }
    if (req.query.level) {
      conditions.push('level = ?');
      params.push(req.query.level);
    }
    sql += ' WHERE ' + conditions.join(' AND ');
  }

  sql += ' ORDER BY language, level';
  const courses = db.prepare(sql).all(params) as CourseRow[];

  res.json({ success: true, courses });
});

router.get('/:id', authMiddleware, (req: AuthRequest, res: Response): void => {
  const courseId = parseInt(req.params.id);
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(courseId) as CourseRow | undefined;

  if (!course) {
    res.status(404).json({ success: false, error: '课程不存在' });
    return;
  }

  const lessons = db.prepare('SELECT * FROM lessons WHERE course_id = ? ORDER BY sort_order').all(courseId) as LessonRow[];

  const parsedLessons = lessons.map(lesson => ({
    ...lesson,
    content: JSON.parse(lesson.content),
  }));

  // Get user progress for this course
  if (req.userId) {
    const progressRows = db.prepare(
      'SELECT lesson_id, completed, score FROM progress WHERE user_id = ? AND course_id = ?'
    ).all(req.userId, courseId) as { lesson_id: number; completed: number; score: number }[];

    const progressMap: Record<number, { completed: boolean; score: number }> = {};
    progressRows.forEach(p => {
      progressMap[p.lesson_id] = { completed: p.completed === 1, score: p.score };
    });

    res.json({ success: true, course, lessons: parsedLessons, progress: progressMap });
  } else {
    res.json({ success: true, course, lessons: parsedLessons, progress: {} });
  }
});

export default router;