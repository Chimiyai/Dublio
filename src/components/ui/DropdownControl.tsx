// src/components/ui/DropdownControl.tsx
"use client";

import { useState, useEffect, useRef } from 'react';

interface DropdownItem {
  label: string;
  value: string; // Sıralama veya filtreleme için kullanılacak değer
  icon?: React.ReactNode; // Opsiyonel ikon
}

interface DropdownControlProps {
  buttonId: string;
  buttonLabel: string; // Başlangıçtaki buton etiketi (örn: "Sırala")
  buttonIcon?: React.ReactNode; // Buton için genel ikon (örn: ChevronDown)
  items: DropdownItem[];
  onItemSelected: (value: string) => void; // Seçilen öğenin değerini döndürür
  menuId: string;
  defaultOpen?: boolean;
}

const DropdownControl: React.FC<DropdownControlProps> = ({
  buttonId,
  buttonLabel,
  buttonIcon,
  items,
  onItemSelected,
  menuId,
  defaultOpen = false
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [selectedLabel, setSelectedLabel] = useState(buttonLabel);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleItemClick = (item: DropdownItem) => {
    setSelectedLabel(item.label); // Buton etiketini güncelle
    onItemSelected(item.value);   // Parent component'e değeri gönder
    setIsOpen(false);             // Dropdown'ı kapat
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="dropdown-control relative" ref={dropdownRef}>
      <button
        id={buttonId}
        onClick={toggleDropdown}
        className={`dropdown-control-toggle flex items-center gap-1.5 bg-dropdown-ctrl-bg text-dropdown-ctrl-text border border-dropdown-ctrl-border 
                    py-1.5 px-3 text-xs font-medium rounded-md transition-colors
                    hover:bg-dropdown-ctrl-hover-bg hover:border-dropdown-ctrl-hover-border hover:text-dropdown-ctrl-hover-text
                    ${isOpen ? 'bg-dropdown-ctrl-hover-bg border-dropdown-ctrl-hover-border text-dropdown-ctrl-hover-text' : ''}`}
      >
        <span>{selectedLabel}</span>
        {buttonIcon && <span className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>{buttonIcon}</span>}
      </button>
      {isOpen && (
        <div
          id={menuId}
          className="dropdown-control-menu absolute top-full right-0 mt-1 w-48 bg-dropdown-menu-bg border border-dropdown-menu-border 
                     rounded-md shadow-dropdown-menu z-50 py-1
                     opacity-100 transform translate-y-0 transition-all duration-150 ease-out" // Animasyon için
        >
          {items.map((item) => (
            <a
              key={item.value}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleItemClick(item);
              }}
              className="block px-3 py-1.5 text-xs text-dropdown-menu-item-text hover:bg-dropdown-menu-item-hover-bg hover:text-dropdown-menu-item-hover-text transition-colors"
            >
              {item.icon && <span className="mr-2">{item.icon}</span>}
              {item.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

export default DropdownControl;