// src/components/projects/DubbingStudioClient.tsx

'use client';

import { useState, useRef, FC } from 'react';
import { toast } from 'react-hot-toast';
// === ÇÖZÜM BURADA: Tipi SADECE İMPORT EDİYORUZ, YENİDEN TANIMLAMIYORUZ ===
import { LineForDubbingWithDetails } from '@/app/ekipler/[slug]/studyosu/projeler/[projectId]/dublaj/page'; 
// =======================================================================

interface Props {
  lines: LineForDubbingWithDetails[]; 
}

// RecordingLine bileşeninin prop'u ve içeriği aynı kalacak
function RecordingLine({ line }: { line: LineForDubbingWithDetails }) {
    const [isRecording, setIsRecording] = useState(false);
    // voiceRecordingUrl artık doğrudan line objesinde (string veya null)
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
      // audioURL'in string olduğundan emin olalım, null veya undefined olma ihtimaline karşı
      if (!audioURL || (typeof audioURL === 'string' && audioURL.startsWith('/'))) {
          toast.error("Yüklenecek bir kayıt yok veya zaten sunucuda.");
          return;
      }
      
      setIsUploading(true);
      toast.loading("Kayıt yükleniyor...");

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
          if (!response.ok) throw new Error("Yükleme başarısız.");

          setAudioURL(data.url); // Lokal URL'i sunucu URL'i ile değiştir
          toast.success("Kayıt başarıyla sunucuya yüklendi!");
      } catch (error) {
          toast.error("Yükleme sırasında hata oluştu.");
      } finally {
          setIsUploading(false);
      }
    };


    return (
        // === ÇÖZÜM BURADA: JSX'i tek bir kök Fragment'a (veya div'e) sarıyoruz ===
        <>
            <div style={{ background: '#2a2a2a', padding: '15px', border: '1px solid #444', borderRadius: '8px' }}>
                {/* Karakter Bilgisi */}
                {line.character && (
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                        <img 
                            src={line.character.profileImage || `https://ui-avatars.com/api/?name=${line.character.name}&background=random`} 
                            alt={line.character.name} 
                            style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '10px' }} 
                        />
                        <p style={{ margin: 0, fontWeight: 'bold' }}>{line.character.name}</p>
                    </div>
                )}

                <p><strong>Repliğin Anahtarı:</strong> {line.key}</p>

                {/* Orijinal Metin / Diyalog Dışı Kontrolü */}
                {/* line.isNonDialogue artık TranslationLine'ın direkt alanı */}
                {line.isNonDialogue ? ( 
                    <p style={{ fontStyle: 'italic', color: 'gray', margin: '10px 0' }}>
                        [Diyalog Metni Yok - Sadece Ses]
                    </p>
                ) : (
                    <blockquote style={{ fontStyle: 'italic', fontSize: '1.2rem', margin: '10px 0' }}>
                        "{line.translatedText || 'Çeviri bekleniyor...'}"
                    </blockquote>
                )}
                
                {/* Orijinal Ses Oynatıcısı */}
                {/* originalVoiceReferenceAsset ilişkisine bakıyoruz */}
                {line.originalVoiceReferenceAsset && ( 
                    <div style={{ marginBottom: '15px' }}>
                        <strong>Orijinal Ses:</strong> <small style={{color: '#aaa'}}>{line.originalVoiceReferenceAsset.name}</small>
                        <audio src={line.originalVoiceReferenceAsset.path} controls style={{ width: '100%', marginTop: '5px' }} />
                    </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                    <button onClick={isRecording ? stopRecording : startRecording} 
                            // Kayıt butonu disabled koşulu:
                            // Eğer çevrilmiş metin yoksa VE diyalog dışı değilse disabled olacak
                            disabled={!line.translatedText && !line.isNonDialogue}>
                        {isRecording ? 'Durdur' : 'Kayıt Başlat'}
                    </button>
                    {/* Kaydedilen Türkçe sesin oynatıcısı */}
                    {audioURL && <audio src={audioURL} controls />}
                    <button onClick={handleUpload} 
                            disabled={isUploading || !audioURL || (typeof audioURL === 'string' && audioURL.startsWith('/'))}>
                        {isUploading ? '...' : 'Sunucuya Gönder'}
                    </button>
                </div>
            </div>
        </>
        // =========================================================================
    );
}


export default function DubbingStudioClient({ lines }: Props) {
  return (
    <div>
        <h2>Dublaj Atölyesi</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {lines.map(line => (
                <RecordingLine key={line.id} line={line} />
            ))}
        </div>
    </div>
  );
}
