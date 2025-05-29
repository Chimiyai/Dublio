// src/components/admin/ProjectPublishSettings.tsx
'use client';

interface ProjectPublishSettingsProps {
  isPublished: boolean;
  onIsPublishedChange: (value: boolean) => void;
  errors: { isPublished?: string[] };
}

export default function ProjectPublishSettings({
  isPublished, onIsPublishedChange, errors
}: ProjectPublishSettingsProps) {
  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">Yayın Ayarları</h2>
      <div className="mt-4 relative flex items-start gap-x-3"> {/* items-start eklendi */}
        <div className="flex h-6 items-center"> {/* Input için sarmalayıcı */}
          <input
            id="isPublished"
            name="isPublished"
            type="checkbox"
            checked={isPublished}
            onChange={(e) => onIsPublishedChange(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-600 dark:bg-gray-700 dark:ring-offset-gray-800"
          />
        </div>
        <div className="text-sm leading-6">
          <label htmlFor="isPublished" className="font-medium text-gray-900 dark:text-gray-100">
            Yayında
          </label>
          <p className="text-gray-500 dark:text-gray-400">Proje sitede herkes tarafından görülebilir mi?</p>
        </div>
      </div>
      {errors.isPublished && <p className="mt-1 text-xs text-red-500">{typeof errors.isPublished === 'string' ? errors.isPublished : errors.isPublished.join(', ')}</p>}
    </div>
  );
}