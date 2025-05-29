// src/components/project/CommentsSection.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import { getCloudinaryImageUrlOptimized } from '@/lib/cloudinary'; // Eğer kullanıcı avatarı için kullanacaksak
import Image from 'next/image';
import { UserCircleIcon, TrashIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline'; // Veya solid
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

// Tipleri merkezi bir yerden almak daha iyi olurdu ama şimdilik burada tanımlayalım
interface CommentUser {
  id: number;
  username: string;
  profileImagePublicId: string | null;
  role: string;
}

interface Comment {
  id: number;
  content: string;
  createdAt: string; // Veya Date
  user: CommentUser;
  // projectId: number; // Gerekirse
}

interface CommentsSectionProps {
  projectId: number;
  initialTotalComments?: number; // Sayfada gösterilecek toplam yorum sayısı
}

interface FetchCommentsResponse {
  comments: Comment[];
  totalPages: number;
  currentPage: number;
  totalComments: number;
}

// Tek bir yorumu gösteren component
function CommentItem({ comment, onDelete, currentUserId, currentUserRole }: {
  comment: Comment;
  onDelete: (commentId: number) => void;
  currentUserId: number | undefined;
  currentUserRole: string | undefined;
}) {
  const canDelete = currentUserId === comment.user.id || currentUserRole === 'admin';
  const avatarUrl = comment.user.profileImagePublicId
    ? getCloudinaryImageUrlOptimized(comment.user.profileImagePublicId, { width: 40, height: 40, crop: 'fill', gravity: 'face' }, 'avatar')
    : null;

  return (
    <div className="flex space-x-3 py-4 border-b border-gray-700 last:border-b-0">
      <div className="flex-shrink-0">
        {avatarUrl ? (
          <Image src={avatarUrl} alt={comment.user.username} width={40} height={40} className="rounded-full object-cover" />
        ) : (
          <UserCircleIcon className="w-10 h-10 text-gray-500" />
        )}
      </div>
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <span className="font-semibold text-white mr-2">{comment.user.username}</span>
            <span className="text-gray-400 text-xs">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true, locale: tr })}
            </span>
          </div>
          {canDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              title="Yorumu Sil"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
        <p className="text-gray-300 mt-1 text-sm leading-relaxed whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

// Yorum yapma formu
function CommentForm({ projectId, onCommentAdded }: {
  projectId: number;
  onCommentAdded: (newComment: Comment) => void;
}) {
  const { data: session } = useSession();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !session?.user) {
      toast.error("Yorum boş olamaz veya giriş yapmalısınız.");
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      const newComment = await response.json();
      if (!response.ok) {
        throw new Error(newComment.message || 'Yorum eklenemedi.');
      }
      toast.success('Yorumunuz eklendi!');
      onCommentAdded(newComment);
      setContent('');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session?.user) {
    return <p className="text-sm text-gray-400 my-4">Yorum yapmak için <a href="/giris" className="text-purple-400 hover:underline">giriş yapın</a>.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 mb-8">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Yorumunuzu yazın..."
        rows={3}
        className="w-full p-3 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-500"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !content.trim()}
        className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-md disabled:opacity-50 flex items-center gap-2"
      >
        {isLoading ? 'Gönderiliyor...' : 'Yorum Yap'}
        {!isLoading && <PaperAirplaneIcon className="w-4 h-4 transform rotate-45" />}
      </button>
    </form>
  );
}


export default function CommentsSection({ projectId, initialTotalComments = 0 }: CommentsSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(initialTotalComments); // Toplam yorum sayısı

  const fetchComments = useCallback(async (page = 1) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/comments?page=${page}&limit=5`); // Her sayfada 5 yorum
      if (!response.ok) throw new Error('Yorumlar yüklenemedi.');
      const data: FetchCommentsResponse = await response.json();
      setComments(prev => page === 1 ? data.comments : [...prev, ...data.comments]);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setTotalComments(data.totalComments); // API'den gelen toplam yorum sayısını güncelle
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    fetchComments(1); // İlk yüklemede 1. sayfayı çek
  }, [fetchComments]);

  const handleCommentAdded = (newComment: Comment) => {
    setComments(prevComments => [newComment, ...prevComments]); // Yeni yorumu listenin başına ekle
    setTotalComments(prev => prev + 1); // Toplam yorum sayısını artır
    // Eğer çok fazla yorum varsa ve yeni yorum ilk sayfada görünmeyecekse,
    // fetchComments(1) çağrılabilir ama optimistic update için bu daha iyi.
  };

const handleDeleteComment = async (commentId: number) => {
  if (!confirm("Bu yorumu silmek istediğinizden emin misiniz?")) return;
  try {
    const response = await fetch(`/api/comments/${commentId}`, { method: 'DELETE' });

    if (!response.ok) {
      // response.ok false ise, sunucudan bir hata geldi demektir.
      // response.json() çağrısı burada hata verebilir, bu yüzden önce metin olarak almaya çalışalım
      // veya sadece status koduna göre bir mesaj üretelim.
      let errorMessage = `Yorum silinemedi. Hata Kodu: ${response.status}`;
      try {
        // Sunucu bir JSON hata mesajı döndürmüş olabilir
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch (e) {
        // JSON parse edilemediyse veya body boşsa, statusText'i kullanmayı dene (her zaman dolu olmayabilir)
        if (response.statusText) {
          errorMessage = `${errorMessage} (${response.statusText})`;
        }
      }
      throw new Error(errorMessage);
    }

    // Sadece response.ok true ise response.json() çağırılmalı
    const data = await response.json(); // API'niz { message: "..." } gibi bir JSON döndürmeli
    
    toast.success(data.message || 'Yorum başarıyla silindi.'); // API'den gelen mesajı kullan veya varsayılanı göster
    
    setComments(prevComments => prevComments.filter(c => c.id !== commentId));
    setTotalComments(prev => prev - 1);
  } catch (error: any) {
    toast.error(error.message);
  }
};

  return (
    <div>
      <h3 className="text-lg font-medium text-white mb-1">
        Yorumlar ({totalComments.toLocaleString('tr-TR')})
      </h3>
      <CommentForm projectId={projectId} onCommentAdded={handleCommentAdded} />
      {isLoading && comments.length === 0 && <p className="text-gray-400">Yorumlar yükleniyor...</p>}
      {!isLoading && comments.length === 0 && <p className="text-gray-400">Henüz yorum yapılmamış. İlk yorumu sen yap!</p>}
      
      <div className="space-y-0"> {/* Yorumlar arası boşluğu CommentItem border'ı hallediyor */}
        {comments.map(comment => (
          <CommentItem
            key={comment.id}
            comment={comment}
            onDelete={handleDeleteComment}
            currentUserId={session?.user?.id ? parseInt(session.user.id) : undefined}
            currentUserRole={session?.user?.role}
          />
        ))}
      </div>

      {currentPage < totalPages && !isLoading && (
        <div className="mt-6 text-center">
          <button
            onClick={() => fetchComments(currentPage + 1)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-md"
          >
            Daha Fazla Yorum Yükle
          </button>
        </div>
      )}
       {isLoading && comments.length > 0 && <p className="text-gray-400 mt-4 text-center">Daha fazla yorum yükleniyor...</p>}
    </div>
  );
}