import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, '..', 'data.db'));

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      preferred_languages TEXT DEFAULT '[]',
      avatar_url TEXT DEFAULT '',
      consecutive_days INTEGER DEFAULT 0,
      last_checkin_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS courses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      language TEXT NOT NULL,
      level TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_color TEXT DEFAULT '#165DFF',
      estimated_minutes INTEGER DEFAULT 30,
      lesson_count INTEGER DEFAULT 10
    );

    CREATE TABLE IF NOT EXISTS lessons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      course_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      content TEXT DEFAULT '{}',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS progress (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      course_id INTEGER NOT NULL,
      lesson_id INTEGER NOT NULL,
      module_type TEXT NOT NULL,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 10,
      completed INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
      FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      icon TEXT DEFAULT 'star',
      condition_type TEXT NOT NULL,
      condition_value INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      achievement_id INTEGER NOT NULL,
      unlocked_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      language TEXT DEFAULT '',
      likes_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed data if empty
  const courseCount = db.prepare('SELECT COUNT(*) as count FROM courses').get() as { count: number };
  if (courseCount.count === 0) {
    seedData();
  }
}

function seedData(): void {
  const insertCourse = db.prepare(`
    INSERT INTO courses (title, language, level, description, cover_color, estimated_minutes, lesson_count)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertLesson = db.prepare(`
    INSERT INTO lessons (course_id, title, type, content, sort_order)
    VALUES (?, ?, ?, ?, ?)
  `);

  const insertAchievement = db.prepare(`
    INSERT OR IGNORE INTO achievements (name, description, icon, condition_type, condition_value)
    VALUES (?, ?, ?, ?, ?)
  `);

  const courses = [
    ['英语入门基础', 'english', 'beginner', '从零开始学习英语，掌握日常基本词汇和简单句型', '#165DFF', 30, 5],
    ['英语进阶提升', 'english', 'intermediate', '提升英语阅读和写作能力，掌握复杂语法结构', '#165DFF', 45, 5],
    ['英语高级精通', 'english', 'advanced', '流利英语表达，商务英语和学术写作训练', '#165DFF', 60, 5],
    ['日语入门五十音', 'japanese', 'beginner', '从五十音图开始，掌握日语基础发音和书写', '#E02020', 30, 5],
    ['日语日常会话', 'japanese', 'intermediate', '学习日语日常表达，掌握敬语和口语交流', '#E02020', 45, 5],
    ['日语能力考试N1', 'japanese', 'advanced', '冲刺N1考试，掌握高级日语语法和阅读', '#E02020', 60, 5],
    ['韩语发音入门', 'korean', 'beginner', '掌握韩文字母和发音规则，学习基础单词', '#7B2D8E', 30, 5],
    ['韩语实用语法', 'korean', 'intermediate', '系统学习韩语语法体系，提升读写能力', '#7B2D8E', 45, 5],
    ['韩语高级阅读', 'korean', 'advanced', '阅读韩国新闻和文学作品，提升综合能力', '#7B2D8E', 60, 5],
  ];

  const courseIds: number[] = [];
  for (const [title, language, level, description, coverColor, minutes, count] of courses) {
    const result = insertCourse.run(title, language, level, description, coverColor, Number(minutes), Number(count));
    courseIds.push(result.lastInsertRowid as number);
  }

  // English Beginner lessons
  const lessonData: [number, string, string, string, number][] = [
    [courseIds[0], '基础问候语', 'word', JSON.stringify({
      words: [
        { en: 'Hello', zh: '你好', example: 'Hello, how are you?' },
        { en: 'Goodbye', zh: '再见', example: 'Goodbye, see you tomorrow!' },
        { en: 'Thank you', zh: '谢谢', example: 'Thank you very much.' },
        { en: 'Please', zh: '请', example: 'Please sit down.' },
        { en: 'Sorry', zh: '对不起', example: 'I am sorry.' },
      ]
    }), 1],
    [courseIds[0], '简单句型', 'grammar', JSON.stringify({
      questions: [
        { q: 'I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0, explain: '"I" 后面用 "am"' },
        { q: 'She ___ from China.', options: ['am', 'is', 'are', 'be'], answer: 1, explain: '"She" 后面用 "is"' },
        { q: 'They ___ my friends.', options: ['am', 'is', 'are', 'be'], answer: 2, explain: '"They" 后面用 "are"' },
        { q: 'He ___ reading a book.', options: ['am', 'is', 'are', 'be'], answer: 1, explain: '"He" 后面用 "is"' },
        { q: 'We ___ happy today.', options: ['am', 'is', 'are', 'be'], answer: 2, explain: '"We" 后面用 "are"' },
      ]
    }), 2],
    [courseIds[0], '自我介绍口语', 'speaking', JSON.stringify({
      sentence: 'Hello, my name is [Name]. I am from China. I like learning English.',
      translation: '你好，我的名字是[名字]。我来自中国。我喜欢学英语。'
    }), 3],
    [courseIds[0], '日常听力训练', 'listening', JSON.stringify({
      script: 'Hello, my name is Tom. I am a teacher. I live in Beijing. I love teaching English.',
      questions: [
        { q: 'What is the speaker\'s name?', options: ['Tom', 'Jerry', 'Mike', 'John'], answer: 0 },
        { q: 'What does the speaker do?', options: ['Doctor', 'Teacher', 'Student', 'Engineer'], answer: 1 },
        { q: 'Where does the speaker live?', options: ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen'], answer: 1 },
      ]
    }), 4],
    [courseIds[0], '基础单词复习', 'word', JSON.stringify({
      words: [
        { en: 'Book', zh: '书', example: 'I read a book every day.' },
        { en: 'School', zh: '学校', example: 'I go to school by bus.' },
        { en: 'Teacher', zh: '老师', example: 'My teacher is very kind.' },
        { en: 'Student', zh: '学生', example: 'She is a good student.' },
        { en: 'Family', zh: '家庭', example: 'I love my family.' },
      ]
    }), 5],
    // Japanese Beginner
    [courseIds[3], '五十音图', 'word', JSON.stringify({
      words: [
        { en: 'あ', zh: 'a', example: 'あい（愛）- 爱' },
        { en: 'い', zh: 'i', example: 'いえ（家）- 家' },
        { en: 'う', zh: 'u', example: 'うみ（海）- 海' },
        { en: 'え', zh: 'e', example: 'えき（駅）- 车站' },
        { en: 'お', zh: 'o', example: 'おかし（お菓子）- 点心' },
      ]
    }), 1],
    [courseIds[3], '基础语法', 'grammar', JSON.stringify({
      questions: [
        { q: '私 ___ 学生です。', options: ['は', 'が', 'を', 'に'], answer: 0, explain: '主语后用「は」' },
        { q: 'これは本 ___ す。', options: ['は', 'が', 'で', 'に'], answer: 2, explain: '「です」表示判断' },
        { q: '教室 ___ 先生がいます。', options: ['は', 'が', 'に', 'を'], answer: 2, explain: '存在场所用「に」' },
        { q: 'りんご ___ 食べます。', options: ['は', 'が', 'に', 'を'], answer: 3, explain: '宾语后用「を」' },
        { q: '今日 ___ 天気がいいです。', options: ['は', 'が', 'に', 'を'], answer: 0, explain: '主题后用「は」' },
      ]
    }), 2],
    [courseIds[3], '自我介绍口语', 'speaking', JSON.stringify({
      sentence: 'はじめまして、私は[名前]です。中国から来ました。日本語を勉強しています。',
      translation: '初次见面，我是[名字]。来自中国。我正在学习日语。'
    }), 3],
    [courseIds[3], '听力训练', 'listening', JSON.stringify({
      script: 'こんにちは。私は田中です。東京に住んでいます。会社員です。趣味は読書です。',
      questions: [
        { q: '说话者叫什么名字？', options: ['田中', '佐藤', '鈴木', '高橋'], answer: 0 },
        { q: '住在哪里？', options: ['大阪', '京都', '東京', '名古屋'], answer: 2 },
        { q: '职业是什么？', options: ['学生', '老师', '医生', '公司职员'], answer: 3 },
      ]
    }), 4],
    [courseIds[3], '片假名练习', 'word', JSON.stringify({
      words: [
        { en: 'カ', zh: 'ka', example: 'カメラ - 相机' },
        { en: 'キ', zh: 'ki', example: 'キス - 吻' },
        { en: 'ク', zh: 'ku', example: 'クラス - 班级' },
        { en: 'ケ', zh: 'ke', example: 'ケーキ - 蛋糕' },
        { en: 'コ', zh: 'ko', example: 'コーヒー - 咖啡' },
      ]
    }), 5],
    // Korean Beginner
    [courseIds[6], '韩文基础字母', 'word', JSON.stringify({
      words: [
        { en: 'ㄱ', zh: 'g/k', example: '가구 (家具) - 家具' },
        { en: 'ㄴ', zh: 'n', example: '나 (我) - 我' },
        { en: 'ㄷ', zh: 'd/t', example: '다리 (腿) - 腿' },
        { en: 'ㄹ', zh: 'r/l', example: '라디오 (收音机) - 收音机' },
        { en: 'ㅁ', zh: 'm', example: '마음 (心) - 心' },
      ]
    }), 1],
    [courseIds[6], '基础语法', 'grammar', JSON.stringify({
      questions: [
        { q: '저는 학생 ___.', options: ['입니다', '입니다까', '이에요', '이야'], answer: 0, explain: '正式场合用「입니다」' },
        { q: '이것은 책 ___.', options: ['입니다', '입니다까', '이에요', '이야'], answer: 2, explain: '非正式尊敬用「이에요」' },
        { q: '어디 ___ 가요?', options: ['에', '에서', '을', '는'], answer: 0, explain: '方向/目的地用「에」' },
        { q: '밥 ___ 먹어요.', options: ['에', '에서', '을', '는'], answer: 2, explain: '宾语后用「을/를」' },
        { q: '학교 ___ 공부해요.', options: ['에', '에서', '을', '는'], answer: 1, explain: '动作场所用「에서」' },
      ]
    }), 2],
    [courseIds[6], '自我介绍口语', 'speaking', JSON.stringify({
      sentence: '안녕하세요, 저는 [이름]입니다. 중국에서 왔어요. 한국어를 공부하고 있어요.',
      translation: '你好，我是[名字]。来自中国。我正在学习韩语。'
    }), 3],
    [courseIds[6], '听力训练', 'listening', JSON.stringify({
      script: '안녕하세요. 저는 김민수입니다. 서울에 살고 있습니다. 회사원입니다. 취미는 여행입니다.',
      questions: [
        { q: '说话者叫什么？', options: ['김민수', '이민호', '박지성', '최우식'], answer: 0 },
        { q: '住在哪里？', options: ['釜山', '仁川', '首尔', '大邱'], answer: 2 },
        { q: '兴趣爱好是什么？', options: ['读书', '运动', '旅行', '料理'], answer: 2 },
      ]
    }), 4],
    [courseIds[6], '数字和时间', 'word', JSON.stringify({
      words: [
        { en: '하나', zh: '一', example: '사과 하나 주세요. - 请给我一个苹果' },
        { en: '둘', zh: '二', example: '두 명이에요. - 是两个人' },
        { en: '셋', zh: '三', example: '세 시예요. - 是三点了' },
        { en: '넷', zh: '四', example: '네 개 있어요. - 有四个' },
        { en: '다섯', zh: '五', example: '다섯 분이세요. - 是五位' },
      ]
    }), 5],
  ];

  for (const [courseId, title, type, content, order] of lessonData) {
    insertLesson.run(courseId, title, type, content, order);
  }

  const achievements = [
    ['初次登录', '完成首次登录', 'Login', 'login', 1],
    ['连续学习3天', '连续打卡学习3天', 'Flame', 'consecutive_days', 3],
    ['连续学习7天', '连续打卡学习7天', 'Flame', 'consecutive_days', 7],
    ['单词达人', '累计学习100个单词', 'BookOpen', 'word_count', 100],
    ['语法专家', '完成50道语法练习', 'FileText', 'grammar_count', 50],
    ['听力冠军', '完成30次听力训练', 'Headphones', 'listening_count', 30],
    ['口语先锋', '完成20次口语练习', 'Mic', 'speaking_count', 20],
    ['完成首门课程', '完成第一门完整课程', 'Trophy', 'course_complete', 1],
    ['社区活跃', '发布10条社区动态', 'Users', 'post_count', 10],
    ['坚持王者', '连续学习30天', 'Crown', 'consecutive_days', 30],
  ];

  for (const [name, desc, icon, type, val] of achievements) {
    insertAchievement.run(name, desc, icon, type, val);
  }

  console.log('Database seeded with initial data.');
}

export default db;