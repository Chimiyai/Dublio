// src/components/projects/DubbingStudioClient.tsx
'use client';

import { useState, useRef, useMemo, FC } from 'react';
import { toast } from 'react-hot-toast';
import { LineForDubbingWithDetails } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page'; 
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/solid';
import CommentModal from './CommentModal';
import { VoiceRecordingStatus } from '@prisma/client';

// === BİLEŞEN PROPS TİPLERİ ===
interface RecordingLineProps {
    line: LineForDubbingWithDetails;
    onUploadSuccess: (lineId: number, newRawRecording: { url: string }) => void;
    onOpenComments: (line: LineForDubbingWithDetails) => void;
    onUndo: (lineId: number) => Promise<void>;
}

interface DubbingStudioProps {
  lines: LineForDubbingWithDetails[]; 
}

// === KAYIT SATIRI COMPONENT'İ (SON HALİ) ===
function RecordingLine({ line, onUploadSuccess, onOpenComments, onUndo }: RecordingLineProps) {
    // DÜZELTME: useState hook'u en üstte, koşulsuz çağrılıyor.
    // Başlangıç değeri, duruma göre doğru URL'i seçiyor.
    const [audioURL, setAudioURL] = useState(line.rawRecording?.url || line.voiceRecordingUrl || '');
    const [isRecording, setIsRecording] = useState(false);
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
      const toastId = toast.loading("Kayıt yükleniyor...");

      const audioBlob = await fetch(audioURL).then(r => r.blob());
      const audioFile = new File([audioBlob], `line_${line.id}.webm`, { type: 'audio/webm' });

      const formData = new FormData();
      formData.append('audioBlob', audioFile);
      formData.append('lineId', line.id.toString());
      
      try {
          const response = await fetch('/api/voice-recordings', { method: 'POST', body: formData });
          const data = await response.json();
          if (!response.ok) throw new Error(data.message || "Yükleme başarısız.");

          // DÜZELTME: Ana component'e hem URL'i hem de yeni durumu bildiriyoruz.
          onUploadSuccess(line.id, { url: data.recordingUrl }); // data.recordingUrl API'den gelen gerçek URL olmalı.
          setAudioURL(data.recordingUrl); // Bu satırın URL'ini de güncelle
          toast.success("Kayıt başarıyla yüklendi!", { id: toastId });
      } catch (error: any) {
          toast.error(error.message, { id: toastId });
      } finally {
          setIsUploading(false);
      }
    };

    return (
        <div style={{ background: '#2a2a2a', padding: '15px', borderLeft: `4px solid ${line.recordingStatus === 'COMPLETED' ? '#22c55e' : (line.recordingStatus === 'PENDING_MIX' ? 'orange' : '#ef4444')}`, borderRadius: '8px' }}>
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
    {/* DÜZELTME: Artık doğru property'i kullanıyoruz */}
    {line.commentCount > 0 && (
        <span style={{
            position: 'absolute', top: '-5px', right: '-5px',
            background: 'red', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '11px', display: 'flex',
            alignItems: 'center', justifyContent: 'center'
        }}>
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
            
            {/* DÜZELTME: Ham ve Nihai ses oynatıcıları */}
            {line.recordingStatus === 'PENDING_MIX' && line.rawRecording?.url && (
                <div>
                    <p style={{marginTop: '10px', fontSize: '0.9em'}}><strong>Gönderilen Ham Kayıt:</strong></p>
                    <audio key={line.rawRecording.url} src={line.rawRecording.url} controls style={{width: '100%'}} />
                </div>
            )}
            {line.recordingStatus === 'COMPLETED' && line.voiceRecordingUrl && (
                <div>
                    <p style={{marginTop: '10px', fontSize: '0.9em'}}><strong>Tamamlanan Nihai Kayıt:</strong></p>
                    <audio key={line.voiceRecordingUrl} src={line.voiceRecordingUrl} controls style={{width: '100%'}} />
                </div>
            )}

            {/* Kontrol Butonları */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '20px', borderTop: '1px solid #444', paddingTop: '15px' }}>
                {/* Kayıt ve Gönder butonları SADECE kayıt bekliyorsa görünür */}
                {line.recordingStatus === 'PENDING_RECORDING' && (
                    <>
                        <button onClick={isRecording ? stopRecording : startRecording} disabled={isUploading}>
                            {isRecording ? 'Durdur' : '🎙️ Kayıt Başlat'}
                        </button>
                        {/* Yeni, lokalde kaydedilen sesin oynatıcısı */}
                        {audioURL && !audioURL.startsWith('/uploads/') && <audio key={audioURL} src={audioURL} controls />}
                        <button onClick={handleUpload} disabled={isUploading || !audioURL || audioURL.startsWith('/uploads/')}>
                            {isUploading ? 'Yükleniyor...' : '☁️ Sunucuya Gönder'}
                        </button>
                    </>
                )}
                
                {/* Geri Al butonu SADECE miksaj bekliyorsa görünür */}
                {line.recordingStatus === 'PENDING_MIX' && (
                    <button onClick={() => onUndo(line.id)} style={{ background: '#b91c1c' }}>
                        Geri Al
                    </button>
                )}
                
                {line.recordingStatus === 'COMPLETED' && (
                    <p style={{color: '#22c55e'}}>✓ Bu kayıt tamamlandı.</p>
                )}
            </div>
        </div>
    );
}

// === ANA DUBLAJ STÜDYOSU COMPONENT'İ (SON HALİ) ===
export default function DubbingStudioClient({ lines: initialLines }: DubbingStudioProps) {
    const [lines, setLines] = useState(initialLines);
    const [activeTab, setActiveTab] = useState<'TODO' | 'PENDING_MIX' | 'DONE' | 'ALL'>('TODO');
    const [commentingLine, setCommentingLine] = useState<LineForDubbingWithDetails | null>(null);

    const handleOpenComments = (line: LineForDubbingWithDetails) => setCommentingLine(line);
    const handleCloseComments = () => setCommentingLine(null);
    
    const onUploadSuccess = (lineId: number, newRawRecording: { url: string }) => {
        setLines(prevLines =>
            prevLines.map(line =>
                line.id === lineId ? { 
                    ...line, 
                    rawRecording: newRawRecording, // Yeni ham kaydı ekle
                    recordingStatus: VoiceRecordingStatus.PENDING_MIX // Durumu güncelle
                } : line
            )
        );
    };

    const handleUndo = async (lineId: number) => {
        if (!confirm("Bu kaydı miksajdan geri çekmek istediğinizden emin misiniz? Yüklediğiniz ham ses dosyası silinecektir.")) return;
        const toastId = toast.loading("İşlem geri alınıyor...");
        try {
            const response = await fetch(`/api/raw-recordings/${lineId}`, { method: 'DELETE' });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Geri alma başarısız oldu.");
            }
            // DÜZELTME: Geri alındığında rawRecording'i null yap ve durumu PENDING_RECORDING'e çevir.
            setLines(prevLines =>
                prevLines.map(line =>
                    line.id === lineId ? { ...line, rawRecording: null, recordingStatus: VoiceRecordingStatus.PENDING_RECORDING } : line
                )
            );
            toast.success("Kayıt geri alındı, tekrar kayıt yapabilirsiniz.", { id: toastId });
        } catch (error: any) {
            toast.error(error.message, { id: toastId });
        }
    };

    const filteredLines = useMemo(() => {
    switch (activeTab) {
        case 'TODO': return lines.filter(line => line.recordingStatus === 'PENDING_RECORDING');
        case 'PENDING_MIX': return lines.filter(line => line.recordingStatus === 'PENDING_MIX');
        case 'DONE': return lines.filter(line => line.recordingStatus === 'COMPLETED');
        case 'ALL':
        default: return lines;
    }
}, [lines, activeTab]);

const tabCounts = {
    TODO: lines.filter(line => line.recordingStatus === 'PENDING_RECORDING').length,
    PENDING_MIX: lines.filter(line => line.recordingStatus === 'PENDING_MIX').length,
    DONE: lines.filter(line => line.recordingStatus === 'COMPLETED').length,
    ALL: lines.length
};

    return (
    <div>
        {/* DÜZELTME: Yeni sekme eklendi */}
        <div style={{ marginBottom: '20px', display: 'flex', gap: '5px' }}>
            <button onClick={() => setActiveTab('TODO')} style={{ background: activeTab === 'TODO' ? 'purple' : '#3f3f46' }}>
                Kaydedilecek ({tabCounts.TODO})
            </button>
            <button onClick={() => setActiveTab('PENDING_MIX')} style={{ background: activeTab === 'PENDING_MIX' ? 'purple' : '#3f3f46' }}>
                Miksaj Bekliyor ({tabCounts.PENDING_MIX})
            </button>
            <button onClick={() => setActiveTab('DONE')} style={{ background: activeTab === 'DONE' ? 'purple' : '#3f3f46' }}>
                Tamamlanan ({tabCounts.DONE})
            </button>
            <button onClick={() => setActiveTab('ALL')} style={{ background: activeTab === 'ALL' ? 'purple' : '#3f3f46' }}>
                Tümü ({tabCounts.ALL})
            </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {filteredLines.map(line => (
                    <RecordingLine 
                        key={line.id} 
                        line={line} 
                        onUploadSuccess={onUploadSuccess}
                        onOpenComments={handleOpenComments}
                        onUndo={handleUndo}
                    />
                ))}
                {filteredLines.length === 0 && <p>Bu sekmede gösterilecek replik bulunmuyor.</p>}
            </div>
            {commentingLine && ( <CommentModal
                lineId={commentingLine.id}
                lineKey={commentingLine.key}
                onClose={handleCloseComments}
            />
        )}
    </div>
  );
}
