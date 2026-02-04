
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Lightbulb, HeartHandshake, MessageCircle } from 'lucide-react';
import { DevotionalPost, User } from '../types';
import { formatTimeAgo } from '../utils/formatTime';

interface FeedPostDetailModalProps {
  post: DevotionalPost;
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onReactionClick: (post: DevotionalPost, type: 'pray' | 'people' | 'fire', e: any) => void;
  onCommentClick: (postId: string) => void;
  reactionsCount: Record<string, { pray: number; people: number; fire: number }>;
  userReactions: Record<string, ('pray' | 'people' | 'fire')[]>;
  primaryReaction: Record<string, 'pray' | 'people' | 'fire' | null>;
  commentsCount: Record<string, number>;
}

const FeedPostDetailModal: React.FC<FeedPostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onReactionClick,
  onCommentClick,
  reactionsCount,
  userReactions,
  primaryReaction,
  commentsCount
}) => {
  const [showReactions, setShowReactions] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [wasLongPress, setWasLongPress] = useState(false);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/90 z-[200] flex flex-col animate-in fade-in duration-300 overflow-y-auto">
      {/* Header */}
      <div className="bg-[#12192b] flex items-center justify-between px-4 py-4 sticky top-0 z-50">
        <h3 className="text-[18px] font-black text-white">Feed da Comunidade</h3>
        <button
          onClick={onClose}
          className="p-2"
        >
          <X size={20} className="text-white" />
        </button>
      </div>

      {/* Conteúdo do Post Detalhado */}
      <div className="flex-1 bg-white pt-6 pb-8">
        {/* Foto em Destaque */}
        {post.photo && (
          <div className="w-full px-4 mb-6">
            <div className="relative">
              <img 
                src={post.photo} 
                alt="Devocional" 
                className="w-full h-auto object-cover rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Informações do Post */}
        <div className="px-4">
          {/* Header do Post */}
          <div className="flex items-start gap-3 mb-4">
            {post.userAvatar ? (
              <img 
                src={post.userAvatar} 
                alt={post.userName}
                className="w-11 h-11 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-11 h-11 bg-orange-500 rounded-full flex items-center justify-center text-white font-black text-lg shrink-0">
                {post.userName
                  .split(' ')
                  .map(n => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 text-[14px]">{post.userName}</h3>
              <p className="text-[12px] text-slate-500 font-normal mt-0.5">
                {formatTimeAgo(post.date)}
              </p>
            </div>
          </div>

          {/* VERSÍCULO */}
          {post.scripture && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                <span className="text-[13px] font-bold text-orange-500 uppercase tracking-wider">VERSÍCULO</span>
              </div>
              <p className="text-[17px] font-bold text-slate-800">{post.scripture}</p>
            </div>
          )}

          {/* LIÇÃO APRENDIDA */}
          {post.lesson && (
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <Lightbulb size={15} className="text-orange-500" />
                <span className="text-[12px] font-bold text-orange-500 uppercase tracking-wider">LIÇÃO APRENDIDA</span>
              </div>
              <p className="text-[15px] font-normal text-slate-700 leading-relaxed">
                {post.lesson}
              </p>
            </div>
          )}

          {/* PEDIDO DE ORAÇÃO */}
          {post.prayerRequest && (
            <div className="border-t border-slate-200 pt-2 mt-3">
              <div className="flex items-center gap-1.5 mb-1">
                <HeartHandshake size={24} className="text-slate-800" />
                <span className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">PEDIDO DE ORAÇÃO</span>
              </div>
              <p className="text-[13px] font-normal text-slate-700">{post.prayerRequest}</p>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="px-4 mt-6 pt-4 border-t border-slate-200 flex items-center justify-between gap-4 relative">
          {/* Reações flutuantes no modal */}
          {showReactions && (
            <div>
              {/* Overlay para fechar o menu ao clicar fora */}
              <div 
                className="fixed inset-0 z-40"
                onClick={() => setShowReactions(false)}
              />
              <div className="absolute bottom-full left-0 mb-2 animate-in zoom-in-95 duration-200 z-50">
                <div className="bg-white rounded-full p-2 shadow-2xl border border-slate-200 flex items-center gap-2">
                  <button 
                    className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactionClick(post, 'pray', e);
                      setShowReactions(false);
                    }}
                  >
                    <span className="text-xl">🙏</span>
                  </button>
                  <button 
                    className="w-10 h-10 rounded-full border-2 border-yellow-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactionClick(post, 'people', e);
                      setShowReactions(false);
                    }}
                  >
                    <span className="text-xl">🙌</span>
                  </button>
                  <button 
                    className="w-10 h-10 rounded-full border-2 border-orange-500 flex items-center justify-center bg-white hover:scale-110 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReactionClick(post, 'fire', e);
                      setShowReactions(false);
                    }}
                  >
                    <span className="text-xl">🔥</span>
                  </button>
                </div>
              </div>
            </div>
          )}
          <button 
            onClick={(e) => {
              e.preventDefault();
              if (showReactions) return;
              if (!currentUser || wasLongPress) return;
              
              // Se não tem reação primária definida, abre o menu
              if (!primaryReaction[post.id]) {
                 setShowReactions(true);
                 return;
              }

              // Se já tem reação, usa a primária (comportamento toggle já é tratado no pai)
              onReactionClick(post, primaryReaction[post.id]!, e);
            }}
            onMouseDown={(e) => {
              e.preventDefault();
              setWasLongPress(false);
              const timer = setTimeout(() => {
                setWasLongPress(true);
                setShowReactions(true);
              }, 500);
              setLongPressTimer(timer);
            }}
            onMouseUp={() => {
              if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
              }
            }}
            onMouseLeave={() => {
              if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
              }
            }}
            onTouchStart={(e) => {
              // e.preventDefault(); // Comentado para permitir scroll se necessário, mas testar
              setWasLongPress(false);
              const timer = setTimeout(() => {
                setWasLongPress(true);
                setShowReactions(true);
              }, 500);
              setLongPressTimer(timer);
            }}
            onTouchEnd={(e) => {
              // e.preventDefault();
              if (longPressTimer) {
                clearTimeout(longPressTimer);
                setLongPressTimer(null);
              }
              if (showReactions) {
                setWasLongPress(false);
                return;
              }
              // Comportamento duplicado do onClick, deixar apenas um ou ajustar
              setWasLongPress(false);
            }}
            className={`flex items-center gap-2 transition-colors flex-1 justify-center rounded-full px-3 py-1.5 ${
              userReactions[post.id]?.length > 0
                ? 'bg-orange-100 text-orange-500'
                : 'text-slate-600 hover:text-orange-500'
            }`}
          >
            {(() => {
              const activeReactions = userReactions[post.id] || [];
              let reactionType = 'pray';
              
              if (activeReactions.length > 0) {
                reactionType = (primaryReaction[post.id] && activeReactions.includes(primaryReaction[post.id]!))
                  ? primaryReaction[post.id]!
                  : activeReactions[0];
              }

              const counts = reactionsCount[post.id] || { pray: 0, people: 0, fire: 0 };
              const total = (counts.pray || 0) + (counts.people || 0) + (counts.fire || 0);
              const countDisplay = total > 0 ? ` (${total})` : '';

              if (reactionType === 'people') {
                 return (
                   <>
                     <span className="text-[16px]">🙌</span>
                     <span className="text-[13px] font-normal">Glória{countDisplay}</span>
                   </>
                 );
              } else if (reactionType === 'fire') {
                 return (
                   <>
                     <span className="text-[16px]">🔥</span>
                     <span className="text-[13px] font-normal">Aleluia{countDisplay}</span>
                   </>
                 );
              } else {
                 return (
                   <>
                     <span className="text-[16px]">🙏</span>
                     <span className="text-[13px] font-normal">Amém{countDisplay}</span>
                   </>
                 );
              }
            })()}
          </button>
          
          <button 
            onClick={() => onCommentClick(post.id)}
            className="flex items-center gap-2 text-slate-600 hover:text-orange-500 transition-colors flex-1 justify-center"
          >
            <MessageCircle size={16} />
            <span className="text-[13px] font-normal">
              Comentar{commentsCount[post.id] > 0 && ` (${commentsCount[post.id]})`}
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FeedPostDetailModal;
