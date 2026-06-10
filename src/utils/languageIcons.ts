export interface LanguageInfo {
  code: string;
  displayName: string;
  color: string;
  gradient: string;
  flag: string;
}

const languageMap: Record<string, LanguageInfo> = {
  english: {
    code: 'english',
    displayName: 'English',
    color: '#2563EB',
    gradient: 'from-blue-500 to-blue-700',
    flag: '🇬🇧',
  },
  japanese: {
    code: 'japanese',
    displayName: '日本語',
    color: '#DC2626',
    gradient: 'from-red-500 to-red-700',
    flag: '🇯🇵',
  },
  korean: {
    code: 'korean',
    displayName: '한국어',
    color: '#7C3AED',
    gradient: 'from-purple-500 to-purple-700',
    flag: '🇰🇷',
  },
};

export function getLanguageInfo(language: string): LanguageInfo {
  return languageMap[language] || {
    code: language,
    displayName: language,
    color: '#64748B',
    gradient: 'from-slate-500 to-slate-700',
    flag: '🌐',
  };
}

export const LANGUAGE_LIST = [
  { code: 'english', name: 'English', label: '英语', flag: '🇬🇧', learners: '2.3万+' },
  { code: 'japanese', name: '日本語', label: '日语', flag: '🇯🇵', learners: '1.8万+' },
  { code: 'korean', name: '한국어', label: '韩语', flag: '🇰🇷', learners: '1.5万+' },
];

export const LEVELS = [
  { value: 'beginner', label: '初级', color: 'bg-green-100 text-green-700' },
  { value: 'intermediate', label: '中级', color: 'bg-amber-100 text-amber-700' },
  { value: 'advanced', label: '高级', color: 'bg-red-100 text-red-700' },
];

export function getLevelLabel(level: string): string {
  const found = LEVELS.find(l => l.value === level);
  return found ? found.label : level;
}

export function getLevelColor(level: string): string {
  const found = LEVELS.find(l => l.value === level);
  return found ? found.color : 'bg-slate-100 text-slate-600';
}