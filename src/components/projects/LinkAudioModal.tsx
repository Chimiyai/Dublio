//src/components/projects/LinkAudioModal.tsx
'use client';

import { useState, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import Select, { SingleValue } from 'react-select';
import { TranslationLine, Character, Asset } from '@prisma/client';

// === TİPLER ===
interface CharacterOption { value: number; label: string; }
interface ModalProps {
  asset: Asset;
  allLines: TranslationLine[];
  allCharacters: Character[];
  onClose: () => void;
  onSuccess: () => void;
}

export const LinkAudioModal = ({ asset, allLines, allCharacters, onClose, onSuccess }: ModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredLines = useMemo(() => {
    if (!searchTerm) return [];
    return allLines
      .filter(line => !line.originalVoiceReferenceAssetId) // Henüz eşleşmemiş olanları göster
      .filter(line => line.originalText?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice(0, 10);
  }, [searchTerm, allLines]);
  
  const characterOptions: CharacterOption[] = useMemo(() => 
    allCharacters.map(c => ({ value: c.id, label: c.name })),
  [allCharacters]);
  
  const handleLink = async (line: TranslationLine) => {
    if (!selectedCharacterId) {
      return toast.error("Lütfen bir karakter seçin.");
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/translation-lines/${line.id}/link-audio`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ assetId: asset.id, characterId: selectedCharacterId }),
      });
      if (!res.ok) throw new Error("Eşleştirme başarısız.");
      toast.success("Başarıyla eşleştirildi.");
      onSuccess(); // Çalışma alanına başarılı olduğunu bildir
    } catch (error: any) {
      toast.error(error.message);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={modalOverlayStyle}>
      <div style={modalContentStyle}>
        <button onClick={onClose} style={{ position: 'absolute', top: 10, right: 10 }}>X</button>
        <h3>"{asset.name}" için Metin Eşleştir</h3>
        <p>Aşağıdan ilgili metni ve karakteri seçin.</p>
        
        <div style={{ marginBottom: '15px' }}>
          <label>Metin Ara:</label>
          <input 
            type="text" 
            autoFocus // Modal açılır açılmaz buraya odaklansın
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Duyduğunuz metni yazın..."
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label>Karakter Seç:</label>
          <Select
            options={characterOptions}
            onChange={(opt: SingleValue<CharacterOption>) => setSelectedCharacterId(opt ? opt.value : null)}
            placeholder="Atanacak karakteri seçin..."
          />
        </div>
        
        <hr />
        <h4>Arama Sonuçları:</h4>
        <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {filteredLines.map(line => (
            <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', background: '#333' }}>
              <span>"{line.originalText}"</span>
              <button onClick={() => handleLink(line)} disabled={isLoading || !selectedCharacterId}>
                Bağla
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Basit stil objeleri
const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)', display: 'flex',
  alignItems: 'center', justifyContent: 'center', zIndex: 1000,
};
const modalContentStyle: React.CSSProperties = {
  background: '#1e1e1e', padding: '20px', borderRadius: '8px',
  width: '90%', maxWidth: '600px', position: 'relative',
};