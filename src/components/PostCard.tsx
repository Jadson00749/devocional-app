import React, { useState } from 'react';
import { DevotionalPost } from '@/types';
import { Heart, MessageCircle, MoreHorizontal, CheckCircle2 } from 'lucide-react';

interface PostCardProps {
  post: DevotionalPost;
  index: number;
  commentsCount?: number;
  reactionsCount?: { pray: number; people: number; fire: number };
  userReactions?: ('pray' | 'people' | 'fire')[];
  onCommentClick?: () => void;
  onReactionClick?: (type: 'pray' | 'people' | 'fire') => void;
  onUserClick?: (userId: string) => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  index, 
  commentsCount = 0, 
  reactionsCount = { pray: 0, people: 0, fire: 0 },
  userReactions = [],
  onCommentClick,
  onReactionClick,
  onUserClick
}) => {
  const [liked, setLiked] = useState(false);
  const [amens, setAmens] = useState(Math.floor(Math.random() * 20) + 5);

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUserClick) {
      onUserClick(post.userId);
    }
  };

  return (
    <div className="animate-slide-up bg-white overflow-hidden rounded-xl border border-slate-100 shadow-sm" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <button onClick={handleUserClick} className="relative group focus:outline-none">
            <img 
              src={post.userAvatar} 
              alt={post.userName} 
              className="w-8 h-8 rounded-lg object-cover ring-1 ring-slate-100 group-hover:ring-orange-200 transition-all" 
            />
          </button>
          <div className="flex flex-col items-start">
            <button onClick={handleUserClick} className="flex items-center gap-1 hover:text-orange-600 transition-colors focus:outline-none">
              <h3 className="text-[12px] font-bold text-slate-900 tracking-tight">{post.userName}</h3>
              {post.hasRead && <CheckCircle2 size={10} className="text-[#0369a1]" />}
            </button>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">{post.scripture}</p>
          </div>
        </div>
        <button className="text-slate-200"><MoreHorizontal size={14} /></button>
      </div>

      {/* Content Area */}
      <div className="px-4 pb-4 space-y-3">
        {post.photo || post.video ? (
          <div className="rounded-lg overflow-hidden bg-slate-50 aspect-square relative ring-1 ring-slate-50">
            {post.video ? (
              <video src={post.video} className="w-full h-full object-cover" controls playsInline />
            ) : (
              <img src={post.photo} alt="Devocional" className="w-full h-full object-cover" />
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-5 border border-slate-100">
             <p className="text-[13px] text-slate-700 leading-relaxed font-medium text-center italic">
              "{post.lesson}"
            </p>
          </div>
        )}

        {(post.photo || post.video) && (
           <p className="text-[12px] text-slate-700 leading-snug font-medium">
            <span className="font-extrabold mr-1 text-slate-900 uppercase text-[10px]">{post.userName}</span>
            {post.lesson}
          </p>
        )}

        {/* Action Row */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setLiked(!liked); setAmens(prev => liked ? prev - 1 : prev + 1); }}
              className={`flex items-center gap-1 transition-all ${liked ? 'text-amber-500' : 'text-slate-300'}`}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} strokeWidth={2} />
              <span className="text-[10px] font-bold">{amens} améns</span>
            </button>
            <button className="flex items-center gap-1 text-slate-300">
              <MessageCircle size={16} />
              <span className="text-[10px] font-bold">Feedback</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCard;

