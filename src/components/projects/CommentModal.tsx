//src/components/projects/CommentModal.tsx
'use client';

import { useState, useEffect, FormEvent, FC } from 'react';
import { Comment, User } from '@prisma/client';
import { toast } from 'react-hot-toast';

type LineComment = Comment & { author: Pick<User, 'username' | 'profileImage'> };

interface Props {
  lineId: number;
  lineKey: string; // Modal başlığında göstermek için
  onClose: () => void;
}

// Bu API rotasını birazdan yazacağız
async function fetchLineComments(lineId: number): Promise<LineComment[]> {
    const res = await fetch(`/api/translation-lines/${lineId}/comments`);
    if (!res.ok) {
        toast.error("Yorumlar yüklenemedi.");
        return [];
    }
    return res.json();
}

export default function CommentModal({ lineId, lineKey, onClose }: Props) {
    const [comments, setComments] = useState<LineComment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchLineComments(lineId).then(data => {
            setComments(data);
            setIsLoading(false);
        });
    }, [lineId]);

    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/translation-lines/${lineId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            const createdComment = await res.json();
            if (!res.ok) {
                // API'dan gelen hata mesajını kullan
                throw new Error(createdComment.message || "Yorum eklenemedi.");
            }
            
            // --- ÇÖZÜM BURADA ---
            // API'dan dönen yeni yorumu, mevcut yorumlar listesinin sonuna ekliyoruz.
            // Bu, React'in arayüzü anında güncellemesini tetikler.
            setComments(prevComments => [...prevComments, createdComment]);
            // --------------------

            setNewComment(''); // Input'u temizle
            toast.success("Yorum eklendi.");

        } catch(error: any) { 
            toast.error(error.message || "Bir hata oluştu.");
        } finally { 
            setIsSubmitting(false); 
        }
    };

    return (
        <div onClick={onClose} style={modalOverlayStyle}>
            <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
                <h3>Yorumlar: <span style={{ fontFamily: 'monospace', color: '#aaa' }}>{lineKey}</span></h3>
                <hr />
                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {isLoading ? <p>Yükleniyor...</p> : (
                        comments.length > 0 ? comments.map(comment => (
                            <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                                <img src={comment.author.profileImage || `https://ui-avatars.com/api/?name=${comment.author.username}`} alt={comment.author.username} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                <div>
                                    <p style={{ margin: 0 }}><strong>{comment.author.username}</strong> <small style={{ color: 'gray' }}>{new Date(comment.createdAt).toLocaleString()}</small></p>
                                    <p style={{ margin: '5px 0 0' }}>{comment.content}</p>
                                </div>
                            </div>
                        )) : <p style={{ color: 'gray' }}>Bu satıra henüz yorum yapılmamış.</p>
                    )}
                </div>
                <form onSubmit={handleCommentSubmit} style={{ marginTop: '15px' }}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Bir yorum yaz..."
                        rows={3}
                        style={{ width: '100%', background: '#1c1c1c', color: 'white', padding: '10px' }}
                    />
                    <button type="submit" disabled={isSubmitting} style={{ marginTop: '10px', float: 'right' }}>
                        {isSubmitting ? 'Gönderiliyor...' : 'Gönder'}
                    </button>
                </form>
            </div>
        </div>
    );
}

// Modal stilleri (aynı)
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
    background: '#2a2a2a',
    borderRadius: '8px',
    padding: '20px',
    width: '400px',
    maxWidth: '90%',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
};