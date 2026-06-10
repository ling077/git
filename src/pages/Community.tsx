import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { apiGet, apiPostAuth } from '@/utils/api';
import { LANGUAGE_LIST, getLanguageInfo } from '@/utils/languageIcons';
import {
  Heart, MessageCircle, Send, ChevronDown, ChevronUp, Loader2, Lock,
} from 'lucide-react';

interface Post {
  id: number; content: string; language: string; likes_count: number;
  username: string; created_at: string; commentCount: number;
}

interface Comment {
  id: number; post_id: number; user_id: number; content: string;
  username: string; created_at: string;
}

const FILTER_TABS = [
  { label: '全部', value: '' },
  { label: '英语', value: 'english' },
  { label: '日语', value: 'japanese' },
  { label: '韩语', value: 'korean' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins} 分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  return `${months} 个月前`;
}

export default function Community() {
  const { isLoggedIn, user } = useAuthStore();
  const [filter, setFilter] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState('');
  const [newLang, setNewLang] = useState('english');
  const [submitting, setSubmitting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<Set<number>>(new Set());
  const [commentsMap, setCommentsMap] = useState<Record<number, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Set<number>>(new Set());

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const params = filter ? `?language=${filter}` : '';
      const data = await apiGet<any>(`/community/posts${params}`);
      setPosts(data.posts || []);
    } catch { /* silently fail */ } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const handleCreatePost = async () => {
    if (!newContent.trim()) return;
    setSubmitting(true);
    try {
      await apiPostAuth('/community/posts', { content: newContent.trim(), language: newLang });
      setNewContent('');
      fetchPosts();
    } catch { /* silently fail */ } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const data = await apiPostAuth<any>(`/community/posts/${postId}/like`);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: data.likes } : p));
    } catch { /* silently fail */ }
  };

  const toggleComments = async (postId: number) => {
    const isExpanded = expandedComments.has(postId);
    if (isExpanded) {
      setExpandedComments(prev => { const n = new Set(prev); n.delete(postId); return n; });
    } else {
      setExpandedComments(prev => new Set(prev).add(postId));
      if (!commentsMap[postId]) {
        setLoadingComments(prev => new Set(prev).add(postId));
        try {
          const data = await apiGet<any>(`/community/posts/${postId}/comments`);
          setCommentsMap(prev => ({ ...prev, [postId]: data.comments || [] }));
        } catch { /* silently fail */ } finally {
          setLoadingComments(prev => { const n = new Set(prev); n.delete(postId); return n; });
        }
      }
    }
  };

  const handleAddComment = async (postId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const data = await apiPostAuth<any>(`/community/posts/${postId}/comments`, { content: content.trim() });
      setCommentsMap(prev => ({
        ...prev,
        [postId]: [...(prev[postId] || []), data.comment],
      }));
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, commentCount: p.commentCount + 1 } : p));
    } catch { /* silently fail */ }
  };

  return (
    <div className="page-enter max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="text-center mb-2">
        <h1 className="text-2xl font-bold text-slate-900">学习社区</h1>
        <p className="text-slate-500 mt-1">与全球语言学习者一起交流成长</p>
      </div>

      {/* Language Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map(tab => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              filter === tab.value
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Post Creation */}
      {isLoggedIn ? (
        <div className="card p-5 space-y-3">
          <textarea
            value={newContent}
            onChange={e => setNewContent(e.target.value)}
            placeholder="分享你的学习心得..."
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all placeholder:text-slate-400"
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">{newContent.length}/500</span>
              <select
                value={newLang}
                onChange={e => setNewLang(e.target.value)}
                className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              >
                {LANGUAGE_LIST.map(l => (
                  <option key={l.code} value={l.code}>{l.flag} {l.label}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleCreatePost}
              disabled={submitting || !newContent.trim()}
              className="btn-primary text-sm !px-4 !py-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              发布
            </button>
          </div>
        </div>
      ) : (
        <div className="card p-5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Lock className="w-4 h-4" />
            登录后参与互动
          </div>
          <Link to="/login" className="btn-primary text-sm !px-4 !py-2">立即登录</Link>
        </div>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
        </div>
      ) : posts.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-2xl flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-600">还没有动态</h3>
          <p className="text-sm text-slate-400 mt-1">成为第一个分享的人吧！</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(post => {
            const info = getLanguageInfo(post.language);
            const isExpanded = expandedComments.has(post.id);
            const comments = commentsMap[post.id] || [];
            const isLoadingComments = loadingComments.has(post.id);
            return (
              <div key={post.id} className="card p-5">
                {/* Post Header */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {post.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-slate-800">{post.username}</span>
                    <span className="text-xs text-slate-400 ml-2">{timeAgo(post.created_at)}</span>
                  </div>
                  {post.language && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                      backgroundColor: `${info.color}15`,
                      color: info.color,
                    }}>
                      {info.flag} {info.displayName}
                    </span>
                  )}
                </div>

                {/* Content */}
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{post.content}</p>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => handleLike(post.id)}
                    disabled={!isLoggedIn}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Heart className="w-4 h-4" />
                    <span>{post.likes_count}</span>
                  </button>
                  <button
                    onClick={() => toggleComments(post.id)}
                    className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-blue-500 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>{post.commentCount}</span>
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Comments */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    {isLoadingComments ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {comments.map(c => (
                          <div key={c.id} className="flex gap-2">
                            <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0">
                              {c.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-semibold text-slate-700">{c.username}</span>
                                <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                              </div>
                              <p className="text-sm text-slate-600 mt-0.5">{c.content}</p>
                            </div>
                          </div>
                        ))}
                        {isLoggedIn ? (
                          <CommentInput onSubmit={content => handleAddComment(post.id, content)} />
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-2">
                            <Link to="/login" className="text-blue-500 hover:underline">登录</Link>后参与评论
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentInput({ onSubmit }: { onSubmit: (content: string) => void }) {
  const [text, setText] = useState('');
  return (
    <div className="flex gap-2">
      <input
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="写下你的评论..."
        maxLength={200}
        className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 placeholder:text-slate-400"
        onKeyDown={e => {
          if (e.key === 'Enter' && text.trim()) {
            onSubmit(text);
            setText('');
          }
        }}
      />
      <button
        onClick={() => { if (text.trim()) { onSubmit(text); setText(''); } }}
        disabled={!text.trim()}
        className="text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-slate-300 shrink-0"
      >
        发送
      </button>
    </div>
  );
}