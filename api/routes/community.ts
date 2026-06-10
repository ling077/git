import { Router, type Request, type Response } from 'express';
import { authMiddleware } from '../middleware/auth.ts';
import type { AuthRequest } from '../middleware/auth.ts';
import db from '../database.ts';
import type { PostRow, CommentRow } from '../../shared/types.ts';

const router = Router();

interface PostWithUser extends PostRow {
  username: string;
  commentCount: number;
}

router.get('/', (req: Request<{}, {}, {}, { language?: string }>, res: Response): void => {
  let sql = `
    SELECT p.*, u.username
    FROM posts p
    JOIN users u ON p.user_id = u.id
  `;
  const params: string[] = [];

  if (req.query.language) {
    sql += ' WHERE p.language = ?';
    params.push(req.query.language);
  }

  sql += ' ORDER BY p.created_at DESC';

  const posts = db.prepare(sql).all(params) as PostWithUser[];

  posts.forEach(post => {
    const countRow = db.prepare('SELECT COUNT(*) as count FROM comments WHERE post_id = ?').get(post.id) as { count: number };
    post.commentCount = countRow.count;
  });

  res.json({ success: true, posts });
});

interface PostBody {
  content: string;
  language: string;
}

router.post('/', authMiddleware, (req: Request<{}, {}, PostBody>, res: Response): void => {
  const userId = (req as AuthRequest).userId!;
  const { content, language } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).json({ success: false, error: '内容不能为空' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO posts (user_id, content, language) VALUES (?, ?, ?)'
  ).run(userId, content.trim(), language || '');

  const post = db.prepare(`
    SELECT p.*, u.username
    FROM posts p
    JOIN users u ON p.user_id = u.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid as number) as PostWithUser;

  res.json({ success: true, post });
});

router.post('/:id/like', authMiddleware, (req: Request<{ id: string }>, res: Response): void => {
  const postId = parseInt(req.params.id);

  db.prepare('UPDATE posts SET likes_count = likes_count + 1 WHERE id = ?').run(postId);

  const row = db.prepare('SELECT likes_count FROM posts WHERE id = ?').get(postId) as { likes_count: number };

  res.json({ success: true, likes: row.likes_count });
});

interface CommentBody {
  content: string;
}

router.post('/:id/comments', authMiddleware, (req: Request<{ id: string }, {}, CommentBody>, res: Response): void => {
  const userId = (req as AuthRequest).userId!;
  const postId = parseInt(req.params.id);
  const { content } = req.body;

  if (!content || content.trim().length === 0) {
    res.status(400).json({ success: false, error: '评论内容不能为空' });
    return;
  }

  const post = db.prepare('SELECT id FROM posts WHERE id = ?').get(postId) as { id: number } | undefined;
  if (!post) {
    res.status(404).json({ success: false, error: '帖子不存在' });
    return;
  }

  const result = db.prepare(
    'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)'
  ).run(postId, userId, content.trim());

  const comment = db.prepare(`
    SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).get(result.lastInsertRowid as number) as CommentRow & { username: string };

  res.json({ success: true, comment });
});

router.get('/:id/comments', (req: Request<{ id: string }>, res: Response): void => {
  const postId = parseInt(req.params.id);

  const comments = db.prepare(`
    SELECT c.*, u.username
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.post_id = ?
    ORDER BY c.created_at ASC
  `).all(postId) as (CommentRow & { username: string })[];

  res.json({ success: true, comments });
});

export default router;