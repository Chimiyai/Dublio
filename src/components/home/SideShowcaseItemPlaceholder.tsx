// src/components/home/SideShowcaseItemPlaceholder.tsx (Yeni dosya)
const SideShowcaseItemPlaceholder = () => {
  return (
    <div className="w-full h-[65px] bg-prestij-bg-card-2/50 rounded-lg flex items-center p-[8px] animate-pulse">
      <div className="w-[50px] h-[50px] bg-gray-700/40 rounded-md mr-[10px] flex-shrink-0"></div>
      <div className="flex-grow space-y-1.5">
        <div className="h-3 bg-gray-700/40 rounded w-1/4"></div> {/* Tür */}
        <div className="h-4 bg-gray-700/40 rounded w-3/4"></div> {/* Başlık */}
      </div>
    </div>
  );
};
export default SideShowcaseItemPlaceholder;