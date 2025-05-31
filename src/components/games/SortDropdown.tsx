// src/components/games/SortDropdown.tsx
'use client';
import { SortByType, SortOrderType } from './GamesPageClient'; // Tipleri import et
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils';

interface SortDropdownProps {
  sortBy: SortByType;
  sortOrder: SortOrderType;
  onSortChange: (newSortBy: SortByType, newSortOrder: SortOrderType) => void;
}

interface SortOption {
  label: string;          // Dropdown'da görünecek etiket
  value: SortByType;      // API'ye gönderilecek sortBy değeri
  order: SortOrderType;   // API'ye gönderilecek sortOrder değeri
  group?: string;         // Gruplama için (opsiyonel)
}

// Daha anlamlı ve kullanıcı dostu sıralama seçenekleri
const sortOptions: SortOption[] = [
  { label: 'Yayın Tarihi (En Yeni)', value: 'releaseDate', order: 'desc', group: 'Tarihe Göre' },
  { label: 'Yayın Tarihi (En Eski)', value: 'releaseDate', order: 'asc', group: 'Tarihe Göre' },
  { label: 'Eklenme Tarihi (En Yeni)', value: 'createdAt', order: 'desc', group: 'Tarihe Göre' },
  { label: 'Eklenme Tarihi (En Eski)', value: 'createdAt', order: 'asc', group: 'Tarihe Göre' },
  { label: 'İsim (A-Z)', value: 'title', order: 'asc', group: 'Alfabetik' },
  { label: 'İsim (Z-A)', value: 'title', order: 'desc', group: 'Alfabetik' },
  { label: 'En Çok Beğenilenler', value: 'likeCount', order: 'desc', group: 'Popülerlik' },
  { label: 'En Çok Favorilenenler', value: 'favoriteCount', order: 'desc', group: 'Popülerlik' },
];

export default function SortDropdown({ sortBy, sortOrder, onSortChange }: SortDropdownProps) {
  const currentActiveOption = sortOptions.find(opt => opt.value === sortBy && opt.order === sortOrder);
  const buttonLabel = currentActiveOption?.label || "Sıralama Seçin";

  // Gruplara ayırma
  const groupedOptions: { [key: string]: SortOption[] } = {};
  sortOptions.forEach(option => {
    const group = option.group || 'Diğer';
    if (!groupedOptions[group]) {
      groupedOptions[group] = [];
    }
    groupedOptions[group].push(option);
  });
  // İstenirse gruplar da sıralanabilir
  const groupOrder = ['Tarihe Göre', 'Alfabetik', 'Popülerlik', 'Diğer'];


  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="inline-flex w-full min-w-[220px] sm:min-w-[240px] justify-between items-center gap-x-1.5 rounded-md bg-prestij-input-bg px-3 py-2 text-xs sm:text-sm font-medium text-prestij-text-secondary hover:bg-prestij-input-bg/80 shadow-sm ring-1 ring-inset ring-prestij-border-dark focus:outline-none focus:ring-2 focus:ring-prestij-500">
          <span className="truncate">{buttonLabel}</span>
          <ChevronDownIcon className="-mr-1 h-5 w-5 text-prestij-text-muted" aria-hidden="true" />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-prestij-sidebar-bg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="py-1">
            {groupOrder.map(groupName => {
              if (!groupedOptions[groupName]) return null;
              return (
                <div key={groupName} className="px-1 py-1">
                  {groupOrder.length > 1 && groupName !== 'Diğer' && ( // "Diğer" için başlık gösterme veya her zaman göster
                    <div className="px-3 pt-1 pb-2 text-xs font-semibold text-prestij-text-muted uppercase tracking-wider">
                      {groupName}
                    </div>
                  )}
                  {groupedOptions[groupName].map((option) => (
                    <Menu.Item key={`${option.value}-${option.order}`}>
                      {({ active }) => (
                        <button
                          onClick={() => onSortChange(option.value, option.order)}
                          className={cn(
                            'group flex w-full items-center rounded-md px-3 py-2 text-sm',
                            active ? 'bg-prestij-input-bg text-prestij-text-primary' : 'text-prestij-text-secondary',
                            currentActiveOption?.value === option.value && currentActiveOption?.order === option.order 
                              ? 'font-semibold text-prestij-400' 
                              : ''
                          )}
                        >
                          {currentActiveOption?.value === option.value && currentActiveOption?.order === option.order && (
                            <CheckIcon className="mr-2 h-4 w-4 text-prestij-500" aria-hidden="true" />
                          )}
                          <span className={cn(currentActiveOption?.value === option.value && currentActiveOption?.order === option.order ? '' : 'ml-6')}> {/* Aktif değilse sola boşluk */}
                            {option.label}
                          </span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                  {/* Gruplar arası ayırıcı (son grup hariç) */}
                  {groupOrder.indexOf(groupName) < groupOrder.length - 1 && groupedOptions[groupOrder[groupOrder.indexOf(groupName) + 1]] && (
                     <div className="my-1 h-px bg-prestij-border-dark/50 mx-3"></div>
                  )}
                </div>
              );
            })}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}