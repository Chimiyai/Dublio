'use client';

import { useState, FormEvent, FC } from 'react';
import { User } from '@prisma/client'; // Temel User tipini kullanabiliriz
import { toast } from 'react-hot-toast';

interface UpdateProfileFormProps {
  // Başlangıç verilerini almak için user prop'u
  user: Pick<User, 'username' | 'bio'>; 
  // Güncelleme başarılı olduğunda ana bileşenin state'ini güncellemek için bir callback
  onProfileUpdate: (updatedUser: Partial<User>) => void;
}

const UpdateProfileForm: FC<UpdateProfileFormProps> = ({ user, onProfileUpdate }) => {
  // Formun state'lerini tutuyoruz
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio || '');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ username?: string[], bio?: string[] }>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({}); // Önceki hataları temizle
    toast.loading('Profil güncelleniyor...');

    try {
      const response = await fetch('/api/profile/update-details', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, bio }),
      });

      const data = await response.json();
      toast.dismiss();

      if (!response.ok) {
        // API'den gelen Zod hatalarını state'e aktar
        if (data.errors) {
          setErrors(data.errors);
        }
        throw new Error(data.message || 'Bir hata oluştu.');
      }

      toast.success('Profil başarıyla güncellendi!');
      // Ana bileşene güncellenmiş kullanıcı verisini gönder
      onProfileUpdate(data);

    } catch (error: any) {
      toast.dismiss();
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
      <div>
        <label htmlFor="username" style={{ display: 'block', marginBottom: '5px' }}>
          Kullanıcı Adı
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        />
        {errors.username && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.username[0]}</p>}
      </div>
      
      <div>
        <label htmlFor="bio" style={{ display: 'block', marginBottom: '5px' }}>
          Biyografi (en fazla 300 karakter)
        </label>
        <textarea
          id="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          maxLength={300}
          style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: 'white' }}
        />
         {errors.bio && <p style={{ color: 'red', fontSize: '12px', marginTop: '5px' }}>{errors.bio[0]}</p>}
      </div>

      <button type="submit" disabled={isLoading} style={{ padding: '10px', background: isLoading ? '#555' : 'purple', color: 'white', border: 'none', cursor: 'pointer' }}>
        {isLoading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
      </button>
    </form>
  );
};

export default UpdateProfileForm;