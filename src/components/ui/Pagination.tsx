// src/components/ui/Pagination.tsx
'use client';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Sayfa numaralarını oluşturma mantığı (basit hali)
  // Daha karmaşık bir "..." gösterimi eklenebilir
  let pageNumbers: (number | string)[] = [];
  const pageRange = 2; // Mevcut sayfanın etrafında kaç sayfa gösterilsin

  if (totalPages <= 5) { // Veya daha küçük bir sayı
    pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);
  } else {
    pageNumbers.push(1);
    if (currentPage > pageRange + 2) pageNumbers.push('...');
    
    for (let i = Math.max(2, currentPage - pageRange); i <= Math.min(totalPages - 1, currentPage + pageRange); i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - pageRange - 1) pageNumbers.push('...');
    pageNumbers.push(totalPages);
  }
  pageNumbers = [...new Set(pageNumbers)]; // Duplicates from "..."


  return (
    <nav className="flex items-center justify-between border-t border-prestij-border-dark px-4 py-3 sm:px-6" aria-label="Pagination">
      <div className="flex flex-1 justify-between sm:justify-end">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="relative inline-flex items-center rounded-md bg-prestij-input-bg px-3 py-2 text-sm font-medium text-prestij-text-secondary hover:bg-prestij-input-bg/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-1" aria-hidden="true" />
          Önceki
        </button>
        
        {/* Sayfa Numaraları (Orta - sadece desktop için) */}
        <div className="hidden sm:flex sm:items-center sm:mx-4">
            {pageNumbers.map((page, index) =>
                typeof page === 'number' ? (
                <button
                    key={page}
                    onClick={() => onPageChange(page)}
                    aria-current={currentPage === page ? 'page' : undefined}
                    className={`relative inline-flex items-center px-3 py-1.5 mx-0.5 text-xs font-medium rounded-md transition-colors
                    ${ currentPage === page 
                        ? 'z-10 bg-prestij-500 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-prestij-500' 
                        : 'text-prestij-text-secondary hover:bg-prestij-input-bg/70'
                    }`}
                >
                    {page}
                </button>
                ) : (
                <span key={`ellipsis-${index}`} className="relative inline-flex items-center px-3 py-1.5 text-xs font-medium text-prestij-text-muted">
                    ...
                </span>
                )
            )}
        </div>


        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="relative ml-3 inline-flex items-center rounded-md bg-prestij-input-bg px-3 py-2 text-sm font-medium text-prestij-text-secondary hover:bg-prestij-input-bg/80 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Sonraki
          <ChevronRightIcon className="h-5 w-5 ml-1" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}