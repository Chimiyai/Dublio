// src/components/admin/ProjectPricingFields.tsx
'use client';

interface ProjectPricingFieldsProps {
  price: string; // Input string olarak alır
  onPriceChange: (value: string) => void;
  currency: string;
  onCurrencyChange: (value: string) => void;
  errors: { price?: string[], currency?: string[] };
}

export default function ProjectPricingFields({
  price, onPriceChange, currency, onCurrencyChange, errors
}: ProjectPricingFieldsProps) {
  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Fiyatlandırma</h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
        Bu oyun için bir fiyat belirleyin.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="price" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Fiyat</label>
          <div className="mt-2">
            <input type="number" name="price" id="price" step="0.01" value={price} onChange={(e) => onPriceChange(e.target.value)}
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800"
                   placeholder="0.00"/>
          </div>
          {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.join(', ')}</p>}
        </div>
        <div className="sm:col-span-3">
          <label htmlFor="currency" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Para Birimi</label>
          <div className="mt-2">
            <input type="text" name="currency" id="currency" maxLength={3} value={currency} onChange={(e) => onCurrencyChange(e.target.value.toUpperCase())}
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800"
                   placeholder="TRY"/>
          </div>
          {errors.currency && <p className="mt-1 text-xs text-red-500">{errors.currency.join(', ')}</p>}
        </div>
      </div>
    </div>
  );
}