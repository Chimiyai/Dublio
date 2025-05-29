// src/components/admin/AdminPageLayout.tsx
import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

interface AdminPageLayoutProps {
  pageTitle: string; // Sayfa ana başlığı
  breadcrumbs?: { label: string; href: string }[]; // Opsiyonel breadcrumbs
  children: React.ReactNode;
  backLink?: { href: string; label: string }; // Geri dön linki için
  // topRightContent?: React.ReactNode; // Sağ üstte buton vb. için
}

const AdminPageLayout: React.FC<AdminPageLayoutProps> = ({ 
  pageTitle, 
  breadcrumbs, 
  children, 
  backLink,
  // topRightContent 
}) => {
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto">
        {/* Breadcrumbs ve Geri Linki */}
        {(breadcrumbs || backLink) && (
          <nav className="mb-5 text-sm" aria-label="Breadcrumb">
            <ol className="list-none p-0 inline-flex items-center">
              {backLink && (
                <li>
                  <Link href={backLink.href} className="inline-flex items-center text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                    <ArrowLeftIcon className="h-4 w-4 mr-1.5" />
                    {backLink.label}
                  </Link>
                </li>
              )}
              {breadcrumbs && backLink && <span className="mx-2 text-gray-400">/</span>}
              {breadcrumbs?.map((crumb, index) => (
                <li key={crumb.href} className="flex items-center">
                  {index > 0 && <span className="mx-2 text-gray-400">/</span>}
                  {index === breadcrumbs.length - 1 ? (
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{crumb.label}</span>
                  ) : (
                    <Link href={crumb.href} className="text-gray-600 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 transition-colors">
                      {crumb.label}
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Sayfa Başlığı ve Sağ Üst İçerik */}
        <div className="mb-6 md:mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-gray-100">
            {pageTitle}
          </h1>
          {/* {topRightContent && <div className="mt-3 sm:mt-0">{topRightContent}</div>} */}
        </div>

        {/* Ana İçerik Alanı */}
        <div className="bg-white dark:bg-gray-900 shadow-2xl rounded-xl">
          {/* Formlar veya tablolar için padding'i formun/tablonun kendisine verebiliriz */}
          {/* Veya burada genel bir padding: p-6 sm:p-8 */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminPageLayout;