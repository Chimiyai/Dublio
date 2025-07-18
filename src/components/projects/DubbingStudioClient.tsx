// src/components/projects/DubbingStudioClient.tsx

'use client';

import { useState, useRef, useMemo, FC } from 'react';
import { toast } from 'react-hot-toast';
import { LineForDubbingWithDetails } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page'; 
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import CommentModal from './CommentModal'; // Yorum modalını import et

// === BİLEŞEN PROPS TİPLERİ ===
interface RecordingLineProps {
    line: LineForDubbingWithDetails;
    onUploadSuccess: (lineId: number, newUrl: string) => void;
    onOpenComments: (line: LineForDubbingWithDetails) => void;
}

interface DubbingStudioProps {
  lines: LineForDubbingWithDetails[]; 
}


// === KAYIT SATIRI COMPONENT'İ (YENİLENDİ) ===
function RecordingLine({ line, onUploadSuccess, onOpenComments }: RecordingLineProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState(line.voiceRecordingUrl || '');
    const [isUploading, setIsUploading] = useState(false);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const audioChunks = useRef<Blob[]>([]);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder.current = new MediaRecorder(stream);
            
            mediaRecorder.current.ondataavailable = (event) => {
                audioChunks.current.push(event.data);
            };

            mediaRecorder.current.onstop = () => {
                const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(audioBlob);
                setAudioURL(url);
                audioChunks.current = []; // Bir sonraki kayıt için temizle
            };

            mediaRecorder.current.start();
            setIsRecording(true);
            toast("Kayıt başladı!");
        } catch (err) {
            toast.error("Mikrofon erişimi reddedildi veya bulunamadı.");
        }
    };

    const stopRecording = () => {
        if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
            mediaRecorder.current.stop();
            setIsRecording(false);
            toast.success("Kayıt durduruldu.");
        }
    };

    const handleUpload = async () => { 
      if (!audioURL || audioURL.startsWith('/uploads/')) {
          toast.error("Yüklenecek yeni bir kayıt yok.");
          return;
      }
      
      setIsUploading(true);
      // DÜZELTME: Toast ID'sini alıyoruz.
      const toastId = toast.loading("Kayıt yükleniyor...");

      const audioBlob = await fetch(audioURL).then(r => r.blob());
      const audioFile = new File([audioBlob], `line_${line.id}.webm`, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('audioBlob', audioFile);
      formData.append('lineId', line.id.toString());
      
      try {
          const response = await fetch('/api/voice-recordings', {
              method: 'POST',
              body: formData,
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Yükleme başarısız.");

          setAudioURL(data.url); 
          onUploadSuccess(line.id, data.url); // Ana state'i güncellemek için sinyal gönder
          // DÜZELTME: ID ile doğru toast'u güncelliyoruz.
          toast.success("Kayıt başarıyla yüklendi!", { id: toastId });
      } catch (error: any) {
          // DÜZELTME: ID ile doğru toast'u güncelliyoruz.
          toast.error(error.message, { id: toastId });
      } finally {
          setIsUploading(false);
      }
    };

    return (
        <div style={{ background: '#2a2a2a', padding: '15px', borderLeft: `4px solid ${line.voiceRecordingUrl ? '#22c55e' : '#f97316'}`, borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                {line.character && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={line.character.profileImage || `https://ui-avatars.com/api/?name=${line.character.name}`} alt={line.character.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                        <span style={{ fontWeight: 'bold' }}>{line.character.name}</span>
                    </div>
                )}
                {/* YORUM BUTONU */}
                <button onClick={() => onOpenComments(line)} title="Yorumlar" style={{ position: 'relative', background: 'transparent', border: '1px solid #555' }}>
                    <ChatBubbleBottomCenterTextIcon style={{width: 20}} />
                    {line.commentCount > 0 && (
                        <span style={{ position: 'absolute', top: '-5px', right: '-5px', background: 'red', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {line.commentCount}
                        </span>
                    )}
                </button>
            </div>
            
            <p style={{ fontFamily: 'monospace', color: '#aaa' }}>{line.key}</p>
            {line.isNonDialogue ? ( 
                <p style={{ fontStyle: 'italic', color: 'gray' }}>[Diyalog Metni Yok - Sadece Ses]</p>
            ) : (
                <blockquote style={{ fontStyle: 'italic', fontSize: '1.2rem', margin: '10px 0' }}>
                    "{line.translatedText || 'Çeviri bekleniyor...'}"
                </blockquote>
            )}
            
            {line.originalVoiceReferenceAsset && ( 
                <div style={{ margin: '15px 0' }}>
                    <strong>Orijinal Referans Ses:</strong>
                    <audio src={line.originalVoiceReferenceAsset.path} controls style={{ width: '100%', marginTop: '5px' }} />
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
                <button onClick={isRecording ? stopRecording : startRecording} disabled={isUploading}>
                    {isRecording ? 'Durdur' : '🎙️ Kayıt Başlat'}
                </button>
                {audioURL && <audio key={audioURL} src={audioURL} controls />}
                <button onClick={handleUpload} disabled={isUploading || !audioURL || audioURL.startsWith('/uploads/')}>
                    {isUploading ? 'Yükleniyor...' : '☁️ Sunucuya Gönder'}
                </button>
            </div>
        </div>
    );
}

// === ANA DUBLAJ STÜDYOSU COMPONENT'İ (YENİLENDİ) ===
export default function DubbingStudioClient({ lines: initialLines }: DubbingStudioProps) {
    const [lines, setLines] = useState(initialLines);
    const [activeTab, setActiveTab] = useState<'TODO' | 'DONE' | 'ALL'>('TODO');
    const [commentingLine, setCommentingLine] = useState<LineForDubbingWithDetails | null>(null);

    const handleOpenComments = (line: LineForDubbingWithDetails) => setCommentingLine(line);
    const handleCloseComments = () => setCommentingLine(null);

    const handleUploadSuccess = (lineId: number, newUrl: string) => {
        setLines(prevLines =>
            prevLines.map(line =>
                line.id === lineId ? { ...line, voiceRecordingUrl: newUrl } : line
            )
        );
    };

    const filteredLines = useMemo(() => {
        switch (activeTab) {
            case 'TODO': return lines.filter(line => !line.voiceRecordingUrl);
            case 'DONE': return lines.filter(line => !!line.voiceRecordingUrl);
            case 'ALL':
            default: return lines;
        }
    }, [lines, activeTab]);

    const tabCounts = {
        TODO: lines.filter(line => !line.voiceRecordingUrl).length,
        DONE: lines.filter(line => !!line.voiceRecordingUrl).length,
        ALL: lines.length
    }

    return (
    <div>
        {/* Filtreleme Sekmeleri */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
            <button onClick={() => setActiveTab('TODO')} style={{ background: activeTab === 'TODO' ? 'purple' : '#3f3f46' }}>
                Dublajlanacak ({tabCounts.TODO})
            </button>
            <button onClick={() => setActiveTab('DONE')} style={{ background: activeTab === 'DONE' ? 'purple' : '#3f3f46' }}>
                Dublajlanan ({tabCounts.DONE})
            </button>
            <button onClick={() => setActiveTab('ALL')} style={{ background: activeTab === 'ALL' ? 'purple' : '#3f3f46' }}>
                Tümü ({tabCounts.ALL})
            </button>
        </div>

        {/* Kayıt Satırları Listesi */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {filteredLines.length > 0 ? filteredLines.map(line => (
                <RecordingLine 
                    key={line.id} 
                    line={line} 
                    onUploadSuccess={handleUploadSuccess}
                    onOpenComments={handleOpenComments}
                />
            )) : <p>Bu sekmede gösterilecek replik bulunmuyor.</p>}
        </div>

        {/* Yorum Modalı */}
        {commentingLine && (
            <CommentModal 
                lineId={commentingLine.id}
                lineKey={commentingLine.key}
                onClose={handleCloseComments}
            />
        )}
    </div>
  );
}
