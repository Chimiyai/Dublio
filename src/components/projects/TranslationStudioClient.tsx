// src/components/projects/TranslationStudioClient.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { TranslationLine, Comment, User } from '@prisma/client'; 
import { toast } from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import CommentModal from './CommentModal'; // CommentModal'ın doğru export edildiğini varsayıyoruz.

// Tipi page.tsx'ten import ediyoruz.
import { LineForStudio } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/ceviri/page';

interface Props {
  initialLines: LineForStudio[];
}

// LineItem bileşeni ayrı ve temiz
function LineItem({ line, onCommentClick }: { line: LineForStudio, onCommentClick: () => void }) {
    const [translation, setTranslation] = useState(line.translatedText || '');
    const [isSaving, setIsSaving] = useState(false);
    const [status, setStatus] = useState(line.status);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/translation-lines/${line.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ translatedText: translation })
            });
            const updatedLine = await res.json();
            if(!res.ok) throw new Error("Kaydedilemedi");
            
            toast.success("Kaydedildi!");
            setStatus(updatedLine.status);
        } catch (error) {
            toast.error("Kaydederken hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const statusColors: { [key: string]: string } = {
        NOT_TRANSLATED: 'red',
        TRANSLATED: 'orange',
        REVIEWED: 'yellow',
        APPROVED: 'green',
    };

    return (
        <tr style={{ background: '#2a2a2a' }}>
            <td style={{ padding: '8px', border: '1px solid #444' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColors[status] }} title={status}></div>
            </td>
            <td style={{ padding: '8px', border: '1px solid #444', fontFamily: 'monospace', color: '#aaa' }}>{line.key}</td>
            <td style={{ padding: '8px', border: '1px solid #444' }}>{line.originalText}</td>
            <td style={{ padding: '8px', border: '1px solid #444' }}>
                <input 
                    type="text" 
                    value={translation}
                    onChange={e => setTranslation(e.target.value)}
                    style={{ width: '100%', background: '#1c1c1c', border: '1px solid #555', color: 'white', padding: '5px' }}
                />
            </td>
            <td style={{ padding: '8px', border: '1px solid #444' }}>
                <button onClick={handleSave} disabled={isSaving}>
                    {isSaving ? '...' : 'Kaydet'}
                </button>
            </td>
             <td style={{ padding: '8px', border: '1px solid #444', textAlign: 'center' }}>
                <button 
                    onClick={onCommentClick} 
                    title="Yorumlar" 
                    style={{background: 'none', border: 'none', color: 'white', cursor: 'pointer'}} // Renk mantığını kaldırdık
                >
                    <ChatBubbleLeftRightIcon style={{width: '20px', height: '20px'}} />
                    {/* Yorum sayısı span'ini de kaldırdık */}
                </button>
            </td>
        </tr>
    );
}

// Ana bileşenimiz artık default export
export default function TranslationStudioClient({ initialLines }: { initialLines: LineForStudio[] }) {
  const [lines, setLines] = useState(initialLines);
  const [commentModalLine, setCommentModalLine] = useState<LineForStudio | null>(null);

  // Artık linesWithCommentCount'a gerek yok, doğrudan `lines`'ı kullanabiliriz.
  return (
    <>
      <table style={{ width: '100%', marginTop: '20px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>S</th>
            <th>Anahtar</th>
            <th>Orijinal Metin</th>
            <th>Çeviri</th>
            <th>İşlem</th>
            <th>Yorumlar</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => ( // linesWithCommentCount yerine lines
            <LineItem 
              key={line.id} 
              line={line} 
              onCommentClick={() => setCommentModalLine(line)} 
            />
          ))}
        </tbody>
      </table>

      {commentModalLine && (
        <CommentModal 
            lineId={commentModalLine.id}
            lineKey={commentModalLine.key}
            onClose={() => setCommentModalLine(null)}
        />
      )}
    </>
  );
}