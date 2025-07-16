//src/components/projects/TaskDetailModal.tsx
'use client';

import { useState, useEffect, FC, FormEvent } from 'react';
import { Task, User, TeamMember, TaskAssignee, Comment } from '@prisma/client';
import { toast } from 'react-hot-toast';

// Gelen ve işlenen veriler için daha zengin tipler tanımlayalım
type FullTaskDetails = Task & {
    assignees: (TaskAssignee & { user: Pick<User, 'id' | 'username' | 'profileImage'> })[];
    comments: (Comment & { author: Pick<User, 'username' | 'profileImage'> })[];
};
type MemberForSelect = TeamMember & { user: Pick<User, 'id' | 'username'> };

interface Props {
    taskId: number;
    teamMembers: MemberForSelect[];
    onClose: () => void;
}

export default function TaskDetailModal({ taskId, teamMembers, onClose }: Props) {
    const [task, setTask] = useState<FullTaskDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [title, setTitle] = useState('');
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const handleCommentSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const res = await fetch(`/api/tasks/${taskId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: newComment }),
            });
            const createdComment = await res.json();
            if (!res.ok) throw new Error("Yorum gönderilemedi.");

            // State'i anında güncelle
            setTask(prev => prev ? { ...prev, comments: [...prev.comments, createdComment] } : null);
            setNewComment(''); // Input'u temizle
            toast.success("Yorum gönderildi.");
            
        } catch (error) {
            toast.error("Yorum gönderilirken hata oluştu.");
        } finally {
            setIsSubmittingComment(false);
        }
    };

    // Modal açıldığında, verilen ID'ye göre görevin tüm detaylarını API'den çek
    useEffect(() => {
        const fetchTaskDetails = async () => {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/tasks/${taskId}`);
                if (!res.ok) throw new Error('Görev detayları yüklenemedi.');
                const data = await res.json();
                setTask(data);
                setTitle(data.title);
            } catch (error: any) {
                toast.error(error.message);
                onClose(); // Hata olursa modal'ı kapat
            } finally {
                setIsLoading(false);
            }
        };
        fetchTaskDetails();
    }, [taskId, onClose]);

    // Başlığı güncelleme fonksiyonu
    const handleUpdateTitle = async () => {
        if (task && title !== task.title) {
            try {
                const res = await fetch(`/api/tasks/${taskId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title }),
                });
                const updatedTask = await res.json();
                if (!res.ok) throw new Error("Başlık güncellenemedi.");
                setTask(updatedTask); // State'i güncel veriyle yenile
                toast.success("Başlık güncellendi.");
            } catch (error) { toast.error("Hata!"); }
        }
        setIsEditingTitle(false);
    };
    
    // Atananları güncelleme fonksiyonu
    const handleAssigneesUpdate = async (newAssigneeIds: number[]) => {
        try {
            const res = await fetch(`/api/tasks/${taskId}/assignees`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ assigneeIds: newAssigneeIds }),
            });
            const updatedAssignees = await res.json();
            if (!res.ok) throw new Error("Atananlar güncellenemedi.");
            // Sadece atananlar listesini güncelle
            setTask(prev => prev ? { ...prev, assignees: updatedAssignees } : null);
            toast.success("Atananlar güncellendi.");
        } catch(error) { toast.error("Hata!"); }
    };


    if (isLoading) {
        return <div style={modalOverlayStyle}><div style={modalContentStyle}>Yükleniyor...</div></div>;
    }
    if (!task) return null;

    return (
        // Modal Overlay
        <div onClick={onClose} style={modalOverlayStyle}>
            {/* Modal Content (tıklamaların overlay'e gitmesini engelle) */}
            <div onClick={(e) => e.stopPropagation()} style={modalContentStyle}>
                {/* Başlık Bölümü */}
                {isEditingTitle ? (
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        onBlur={handleUpdateTitle}
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTitle()}
                        autoFocus
                        style={{ fontSize: '1.5rem', width: '100%' }}
                    />
                ) : (
                    <h2 onClick={() => setIsEditingTitle(true)} style={{ cursor: 'pointer' }}>{task.title}</h2>
                )}

                {/* Detaylar (Atananlar, Statü vb.) */}
                <div style={{ display: 'flex', gap: '20px', margin: '20px 0' }}>
                    <div>
                        <strong>Statü:</strong> {task.status}
                    </div>
                    <div>
                        <strong>Atananlar:</strong>
                        {task.assignees.map(a => (
                            <span key={a.userId} title={a.user.username} style={{ marginLeft: '5px' }}>
                                <img src={a.user.profileImage || `https://ui-avatars.com/api/?name=${a.user.username}`} style={{ width: '30px', height: '30px', borderRadius: '50%', display: 'inline-block' }} />
                            </span>
                        ))}
                         {/* TODO: Atananları değiştirmek için bir dropdown/buton eklenecek */}
                    </div>
                </div>

                {/* Açıklama */}
                <div>
                    <strong>Açıklama:</strong>
                    <p>{task.description || "Açıklama eklenmemiş."}</p>
                     {/* TODO: Açıklama düzenleme formu eklenecek */}
                </div>
                
                <hr style={{ margin: '20px 0' }} />

                {/* === YORUMLAR BÖLÜMÜ (GÜNCELLENDİ) === */}
                <div>
                    <strong>Tartışma / Yorumlar ({task.comments.length})</strong>
                    <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #444', padding: '10px', margin: '10px 0', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {task.comments.length > 0 ? (
                            task.comments.map(comment => (
                                <div key={comment.id} style={{ display: 'flex', gap: '10px' }}>
                                    <img src={comment.author.profileImage || `https://ui-avatars.com/api/?name=${comment.author.username}`} alt={comment.author.username} style={{ width: '32px', height: '32px', borderRadius: '50%' }} />
                                    <div>
                                        <p style={{ margin: 0 }}><strong>{comment.author.username}</strong> <small style={{ color: 'gray' }}>{new Date(comment.createdAt).toLocaleString()}</small></p>
                                        <p style={{ margin: '5px 0 0' }}>{comment.content}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p style={{ color: 'gray' }}>Henüz hiç yorum yapılmamış.</p>
                        )}
                    </div>

                    {/* Yeni Yorum Formu */}
                    <form onSubmit={handleCommentSubmit} style={{ marginTop: '15px' }}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Bir yorum yaz..."
                            rows={3}
                            style={{ width: '100%', background: '#1c1c1c', border: '1px solid #555', color: 'white', padding: '10px' }}
                            disabled={isSubmittingComment}
                        />
                        <button type="submit" disabled={isSubmittingComment} style={{ marginTop: '10px', float: 'right' }}>
                            {isSubmittingComment ? 'Gönderiliyor...' : 'Gönder'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}


// Basit CSS-in-JS stilleri
const modalOverlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
};

const modalContentStyle: React.CSSProperties = {
    background: '#2a2a2a',
    padding: '30px',
    borderRadius: '8px',
    color: 'white',
    width: '90%',
    maxWidth: '700px',
    maxHeight: '90vh',
    overflowY: 'auto'
};