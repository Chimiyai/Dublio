// src/components/profile/LibraryContent.tsx
"use client";

interface LibraryContentProps {
  userId: number; // Veya string
}

const LibraryContent: React.FC<LibraryContentProps> = ({ userId }) => {
  const libraryItemsCount = 0;
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-baseline mb-6">
        <h2 className="text-xl lg:text-2xl font-semibold text-white">Oyun Kütüphanesi</h2>
        <span className="text-sm text-gray-400 mt-1 sm:mt-0">Toplam {libraryItemsCount} Oyun</span>
      </div>
       {libraryItemsCount === 0 ? (
        <p className="text-center text-gray-400 py-10">Henüz kütüphanenizde oyun bulunmuyor.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-5">
          {/* PopularContentCard'lar map edilecek */}
        </div>
      )}
    </div>
  );
};
export default LibraryContent;