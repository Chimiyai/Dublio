// src/components/home/MainShowcasePlaceholder.tsx (Yeni dosya)
const MainShowcasePlaceholder = () => {
  return (
    <div className="w-full h-full relative flex bg-prestij-bg-dark-2/50 aspect-[16/7.5] overflow-hidden rounded-xl animate-pulse">
      {/* Büyük banner alanı */}
      <div className="absolute inset-0 bg-gray-700/40"></div>
      {/* Sol üst kapak placeholder'ı */}
      <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-[3] 
                      w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] lg:w-[80px] lg:h-[80px] xl:w-[100px] xl:h-[100px] 
                      bg-gray-600/40 rounded-md">
      </div>
      {/* Alt yazı alanı placeholder'ı */}
      <div className="absolute bottom-0 left-0 w-full p-4 sm:p-6 lg:p-8 z-[2] space-y-3">
        <div className="h-4 bg-gray-600/40 rounded w-1/4"></div> {/* Kategori */}
        <div className="h-8 bg-gray-600/40 rounded w-3/4"></div> {/* Başlık */}
        <div className="h-4 bg-gray-600/40 rounded w-full"></div> {/* Açıklama satır 1 */}
        <div className="h-4 bg-gray-600/40 rounded w-5/6"></div> {/* Açıklama satır 2 */}
        <div className="flex gap-3 mt-2">
            <div className="h-8 bg-gray-600/40 rounded-md w-24"></div> {/* Buton 1 */}
            <div className="h-8 bg-gray-600/40 rounded-md w-24"></div> {/* Buton 2 */}
        </div>
      </div>
    </div>
  );
};
export default MainShowcasePlaceholder;