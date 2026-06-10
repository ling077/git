import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../database.ts';
import { generateToken } from '../middleware/auth.ts';
import type { UserRow } from '../../shared/types.ts';

const router = Router();

type UserWithoutPassword = Omit<UserRow, 'password_hash'> & { preferred_languages: string[] };

interface RegisterBody {
  username: string;
  email: string;
  password: string;
  languages: string[];
}

router.post('/register', (req: Request<{}, {}, RegisterBody>, res: Response): void => {
  const { username, email, password, languages } = req.body;

  if (!username || !email || !password) {
    res.status(400).json({ success: false, error: '请填写所有必填字段' });
    return;
  }

  const existingUser = db.prepare('SELECT id FROM users WHERE email = ? OR username = ?').get(email, username) as { id: number } | undefined;
  if (existingUser) {
    res.status(400).json({ success: false, error: '邮箱或用户名已存在' });
    return;
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const languagesJson = JSON.stringify(languages || []);

  const result = db.prepare(
    'INSERT INTO users (username, email, password_hash, preferred_languages) VALUES (?, ?, ?, ?)'
  ).run(username, email, passwordHash, languagesJson);

  const userId = result.lastInsertRowid as number;
  const user = db.prepare('SELECT id, username, email, preferred_languages, consecutive_days FROM users WHERE id = ?').get(userId) as any;
  user.preferred_languages = JSON.parse(user.preferred_languages);

  const token = generateToken(userId);

  res.json({ success: true, token, user });
});

interface LoginBody {
  email: string;
  password: string;
}

router.post('/login', (req: Request<{}, {}, LoginBody>, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ success: false, error: '请填写邮箱和密码' });
    return;
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as UserRow | undefined;
  if (!user) {
    res.status(401).json({ success: false, error: '邮箱或密码错误' });
    return;
  }

  const valid = bcrypt.compareSync(password, user.password_hash);
  if (!valid) {
    res.status(401).json({ success: false, error: '邮箱或密码错误' });
    return;
  }

  const { password_hash, preferred_languages, ...safeUser } = user;
  const parsedLanguages = JSON.parse(preferred_languages);

  const token = generateToken(user.id);

  // Checkin
  const today = new Date().toISOString().split('T')[0];
  if (user.last_checkin_date !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (user.last_checkin_date === yesterday) {
      db.prepare('UPDATE users SET consecutive_days = consecutive_days + 1, last_checkin_date = ? WHERE id = ?').run(today, user.id);
    } else {
      db.prepare('UPDATE users SET consecutive_days = 1, last_checkin_date = ? WHERE id = ?').run(today, user.id);
    }
  }

  const updatedUser = db.prepare('SELECT consecutive_days FROM users WHERE id = ?').get(user.id) as { consecutive_days: number };
  safeUser.consecutive_days = updatedUser.consecutive_days;

  res.json({ success: true, token, user: { ...safeUser, preferred_languages: parsedLanguages } });
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ success: true, message: '登出成功' });
});

export default router;