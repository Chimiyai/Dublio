//src/components/projects/DubbingStudioClient.tsx
'use client';

import { useState, useRef, FC } from 'react';
// @prisma/client'tan gelen tipi siliyoruz
// import { TranslationLine } from '@prisma/client'; 
import { toast } from 'react-hot-toast';
// Yeni, ortak tipimizi import ediyoruz
import { LineForDubbing } from '@/types/dubbing';

// Props arayüzünü yeni tipimizle güncelliyoruz
interface Props {
  lines: LineForDubbing[]; 
}

// RecordingLine bileşeninin prop'unu da güncelliyoruz
function RecordingLine({ line }: { line: LineForDubbing }) {
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
        if (!audioURL || audioURL.startsWith('/')) return; // Eğer zaten yüklenmişse veya kayıt yoksa gönderme
        
        setIsUploading(true);
        toast.loading("Kayıt yükleniyor...");

        // Blob URL'ini fetch ile alıp File objesine dönüştür
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
        <div style={{ background: '#2a2a2a', padding: '15px', border: '1px solid #444' }}>
            <p><strong>Repliğin Anahtarı:</strong> {line.key}</p>
            <blockquote style={{ fontStyle: 'italic', fontSize: '1.2rem', margin: '10px 0' }}>
                "{line.translatedText || 'Çeviri bekleniyor...'}"
            </blockquote>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginTop: '15px' }}>
                <button onClick={isRecording ? stopRecording : startRecording} disabled={!line.translatedText}>
                    {isRecording ? 'Durdur' : 'Kayıt Başlat'}
                </button>
                {audioURL && <audio src={audioURL} controls />}
                <button onClick={handleUpload} disabled={isUploading || !audioURL || audioURL.startsWith('/')}>
                    {isUploading ? '...' : 'Sunucuya Gönder'}
                </button>
            </div>
        </div>
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
