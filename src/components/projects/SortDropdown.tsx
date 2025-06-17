// src/components/projects/SortDropdown.tsx
'use client';

import { ChevronDownIcon, CheckIcon } from '@heroicons/react/20/solid';
import { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { cn } from '@/lib/utils'; // cn utility fonksiyonunuzun doğru yolda olduğundan emin olun

export interface SortOptionItem {
  value: string; // Örn: "releaseDate-desc"
  label: string;
  group?: string; // Opsiyonel gruplama için
}

interface SortDropdownProps {
  value: string; // Aktif sıralama değeri, örn: "releaseDate-desc"
  onChange: (newValue: string) => void;
  options: SortOptionItem[];
}

export default function SortDropdown({ value, onChange, options }: SortDropdownProps) {
  const currentActiveOption = options.find(opt => opt.value === value);
  const buttonLabel = currentActiveOption?.label || "Sıralama Seçin";

  // Gruplara ayırma (options prop'unda group varsa)
  const groupedOptions: { [key: string]: SortOptionItem[] } = {};
  const groupOrder: string[] = [];

  options.forEach(option => {
    const group = option.group || 'Diğer Seçenekler'; // Grubu olmayanları 'Diğer' altına topla
    if (!groupedOptions[group]) {
      groupedOptions[group] = [];
      if (!groupOrder.includes(group)) { // Grup sırasını koru
        groupOrder.push(group);
      }
    }
    groupedOptions[group].push(option);
  });

  // Eğer 'Diğer Seçenekler' grubu varsa ve tek grup değilse en sona al
  if (groupOrder.includes('Diğer Seçenekler') && groupOrder.length > 1) {
    const otherIndex = groupOrder.indexOf('Diğer Seçenekler');
    groupOrder.splice(otherIndex, 1);
    groupOrder.push('Diğer Seçenekler');
  }


  return (
    <Menu as="div" className="relative inline-block text-left z-10"> {/* z-index eklendi */}
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
        <Menu.Items className="absolute right-0 z-20 mt-2 w-64 origin-top-right rounded-md bg-prestij-sidebar-bg shadow-xl ring-1 ring-black ring-opacity-5 focus:outline-none max-h-72 overflow-y-auto scrollbar-thin scrollbar-thumb-prestij-border-dark scrollbar-track-prestij-input-bg">
          <div className="py-1">
            {groupOrder.map((groupName, groupIndex) => {
              if (!groupedOptions[groupName]) return null;
              return (
                <div key={groupName} className="px-1 py-1">
                  {groupOrder.length > 1 && ( // Her zaman grup başlığını göster
                    <div className="px-3 pt-1 pb-2 text-xs font-semibold text-prestij-text-muted uppercase tracking-wider">
                      {groupName}
                    </div>
                  )}
                  {groupedOptions[groupName].map((option) => (
                    <Menu.Item key={option.value}>
                      {({ active }) => (
                        <button
                          onClick={() => onChange(option.value)}
                          className={cn(
                            'group flex w-full items-center rounded-md px-3 py-2 text-sm text-left', // text-left eklendi
                            active ? 'bg-prestij-input-bg text-prestij-text-primary' : 'text-prestij-text-secondary',
                            value === option.value
                              ? 'font-semibold text-prestij-400'
                              : ''
                          )}
                        >
                          {value === option.value && (
                            <CheckIcon className="mr-2 h-4 w-4 text-prestij-500 flex-shrink-0" aria-hidden="true" />
                          )}
                          <span className={cn(value === option.value ? '' : 'ml-6')}>
                            {option.label}
                          </span>
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                  {/* Gruplar arası ayırıcı (son grup hariç) */}
                  {groupIndex < groupOrder.length - 1 && (
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