// src/components/admin/ProjectCategoriesSelect.tsx
'use client';
import Select, { MultiValue } from 'react-select'; // MultiValue tipini import et

interface CategoryOption { value: number; label: string; }

interface ProjectCategoriesSelectProps {
  allCategoriesForSelect: CategoryOption[];
  selectedCategoryIds: number[];
  onSelectedCategoriesChange: (ids: number[]) => void;
  errors: { categoryIds?: string[] };
}

export default function ProjectCategoriesSelect({
  allCategoriesForSelect, selectedCategoryIds, onSelectedCategoriesChange, errors
}: ProjectCategoriesSelectProps) {
  
  const handleChange = (selectedOptions: MultiValue<CategoryOption>) => {
    onSelectedCategoriesChange(selectedOptions ? selectedOptions.map(option => option.value) : []);
  };

  const selectedValue = allCategoriesForSelect.filter(option => selectedCategoryIds.includes(option.value));

  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Kategoriler</h2>
      <div className="mt-4">
        <Select
          instanceId="select-project-categories"
          isMulti
          options={allCategoriesForSelect || []}
          value={selectedValue}
          onChange={handleChange}
          placeholder="Kategori seçin veya arayın..."
          className="react-select-container dark:text-gray-100"
          classNamePrefix="react-select"
          styles={{ // Basit dark mode stilleri (daha da özelleştirilebilir)
                control: (base, state) => ({ ...base, backgroundColor: 'var(--input-bg-dark)', borderColor: state.isFocused ? 'var(--indigo-500)' : 'var(--border-dark)', '&:hover': { borderColor: 'var(--border-dark-hover)'}, boxShadow: state.isFocused ? '0 0 0 1px var(--indigo-500)' : 'none' }),
                menu: base => ({ ...base, backgroundColor: 'var(--menu-bg-dark)' }),
                option: (base, { isFocused, isSelected }) => ({ ...base, backgroundColor: isSelected ? 'var(--indigo-600)' : isFocused ? 'var(--menu-item-hover-bg-dark)' : 'var(--menu-bg-dark)', color: isSelected ? 'white' : 'var(--text-light)', '&:active': { backgroundColor: 'var(--indigo-700)'} }),
                multiValue: base => ({ ...base, backgroundColor: 'var(--indigo-500)'}),
                multiValueLabel: base => ({ ...base, color: 'white'}),
                multiValueRemove: base => ({ ...base, color: 'white', '&:hover': { backgroundColor: 'var(--indigo-700)', color: 'white'}})
            }}
        />
      </div>
      {errors.categoryIds && <p className="mt-1 text-xs text-red-600">{errors.categoryIds.join(', ')}</p>}
    </div>
  );
}