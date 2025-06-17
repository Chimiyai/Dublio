// src/components/admin/CategoryManager.tsx
'use client';

import { useState, useEffect, FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Category, Prisma } from '@prisma/client';
import { PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

// API'den gelen kategori tipini genişletelim (proje sayısını da içersin)
type CategoryWithCount = Category & {
  _count: {
    projects: number;
  };
};

export default function CategoryManager() {
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state'leri
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Düzenleme state'leri
  const [editingCategory, setEditingCategory] = useState<CategoryWithCount | null>(null);
  const [editingName, setEditingName] = useState('');

  // Veri çekme fonksiyonu
  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/categories');
      if (!response.ok) throw new Error('Kategoriler yüklenemedi.');
      const data: CategoryWithCount[] = await response.json();
      setCategories(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  // Component ilk yüklendiğinde kategorileri çek
  useEffect(() => {
    fetchCategories();
  }, []);

  // Yeni kategori ekleme
  const handleAddCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setIsSubmitting(true);
    
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Kategori eklenemedi.');

      toast.success(`"${data.name}" kategorisi başarıyla eklendi.`);
      setNewCategoryName('');
      fetchCategories(); // Listeyi yenile
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Kategori silme
  const handleDeleteCategory = async (id: number, name: string) => {
    if (!confirm(`'${name}' kategorisini silmek istediğinizden emin misiniz?`)) return;

    try {
      const response = await fetch(`/api/admin/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.status === 204) {
        toast.success(`'${name}' kategorisi silindi.`);
        fetchCategories(); // Listeyi yenile
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Kategori silinemedi.');
      }
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Düzenleme modunu başlat
  const startEditing = (category: CategoryWithCount) => {
    setEditingCategory(category);
    setEditingName(category.name);
  };
  
  // Düzenlemeyi kaydet
  const handleUpdateCategory = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingName.trim() || editingName === editingCategory.name) {
      setEditingCategory(null); // Değişiklik yoksa veya boşsa kapat
      return;
    }
    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/admin/categories/${editingCategory.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingName }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Kategori güncellenemedi.');

      toast.success(`Kategori "${editingCategory.name}" -> "${data.name}" olarak güncellendi.`);
      setEditingCategory(null);
      fetchCategories(); // Listeyi yenile
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Yeni Kategori Ekleme Formu */}
      <div className="bg-gray-800/50 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Yeni Kategori Ekle</h3>
        <form onSubmit={handleAddCategory} className="flex items-end gap-4">
          <div className="flex-grow">
            <label htmlFor="newCategoryName" className="sr-only">Kategori Adı</label>
            <input
              id="newCategoryName"
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Yeni kategori adı..."
              className="w-full bg-gray-900 border border-gray-700 rounded-md py-2 px-3 text-white focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              disabled={isSubmitting}
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting || !newCategoryName.trim()}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusIcon className="w-5 h-5" />
            {isSubmitting ? 'Ekleniyor...' : 'Ekle'}
          </button>
        </form>
      </div>

      {/* Mevcut Kategoriler Listesi */}
      <div className="overflow-x-auto bg-gray-900 shadow-xl rounded-lg border border-gray-800">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Kategori Adı</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">URL Metni (Slug)</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Proje Sayısı</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={4} className="text-center py-10 text-gray-400">Yükleniyor...</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-gray-800/50">
                <td className="px-4 py-4 whitespace-nowrap">
                  {editingCategory?.id === cat.id ? (
                    <form onSubmit={handleUpdateCategory}>
                      <input 
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-md py-1 px-2 text-white w-full"
                        autoFocus
                        onBlur={() => setEditingCategory(null)} // Odak kaybedince düzenlemeyi iptal et
                      />
                    </form>
                  ) : (
                    <span className="text-sm font-medium text-gray-200">{cat.name}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">{cat.slug}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400">{cat._count.projects}</td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center gap-4">
                    <button onClick={() => startEditing(cat)} title="Düzenle" className="text-blue-400 hover:text-blue-300">
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      title="Sil"
                      disabled={cat._count.projects > 0} // Eğer kategori kullanılıyorsa silme butonunu pasif yap
                      className="text-red-500 hover:text-red-400 disabled:text-gray-600 disabled:cursor-not-allowed"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}