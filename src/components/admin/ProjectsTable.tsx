// src/components/admin/ProjectsTable.tsx
"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import DeleteProjectButton from '@/components/admin/DeleteProjectButton'; // Mevcutsa
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Prisma'dan gelen proje tipine benzer bir tip (sadece tabloda gösterilecek alanlar)
// Bu tipi page.tsx'den import etmek veya ortak bir yerde tanımlamak daha iyi olur.
interface ProjectForTable {
  id: number;
  title: string;
  slug: string;
  type: string;
  releaseDate: Date | null;
  isPublished: boolean;
  createdAt: Date;
}

interface ProjectsTableProps {
  initialProjects: ProjectForTable[];
}

const ProjectsTable: React.FC<ProjectsTableProps> = ({ initialProjects }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) {
      return initialProjects;
    }
    const lowercasedFilter = searchTerm.toLowerCase();
    return initialProjects.filter(project =>
      project.title.toLowerCase().includes(lowercasedFilter) ||
      project.slug.toLowerCase().includes(lowercasedFilter) ||
      project.type.toLowerCase().includes(lowercasedFilter)
    );
  }, [initialProjects, searchTerm]);

  return (
    <div>
      {/* Arama Çubuğu */}
      <div className="p-4 sm:p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            placeholder="Proje ara (başlık, slug, tür)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full sm:w-80 md:w-96 pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {filteredProjects.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400 text-center py-10">
          {searchTerm ? "Aramayla eşleşen proje bulunamadı." : "Henüz hiç proje eklenmemiş."}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full leading-normal">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Başlık / Slug
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tür
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Yayın Tarihi
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-left text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-5 py-3 border-b-2 border-gray-200 dark:border-gray-700 text-right text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider pr-6">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="text-gray-700 dark:text-gray-200">
              {filteredProjects.map((proje) => (
                <tr key={proje.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition duration-150 ease-in-out">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{proje.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{proje.slug}</p>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        proje.type.toLowerCase() === 'oyun' 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100' // Örnek renkler
                    }`}>
                    {proje.type.charAt(0).toUpperCase() + proje.type.slice(1)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm">
                    {proje.releaseDate
                      ? new Date(proje.releaseDate).toLocaleDateString('tr-TR', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })
                      : <span className="text-gray-400 italic">Belirtilmemiş</span>}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        proje.isPublished 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-800 dark:text-emerald-100'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100' // Taslak için sarı
                    }`}>
                    {proje.isPublished ? 'Yayında' : 'Taslak'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right text-sm font-medium pr-6">
                    <Link href={`/admin/projeler/duzenle/${proje.slug}`} className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 mr-3">
                      Düzenle
                    </Link>
                    <DeleteProjectButton projectSlug={proje.slug} projectTitle={proje.title} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* TODO: Sayfalama component'i buraya eklenebilir */}
    </div>
  );
};

export default ProjectsTable;