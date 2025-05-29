// src/components/admin/ProjectDetailsFields.tsx
'use client';
import { ProjectTypeEnum } from './EditProjectForm'; // Bu tipi EditProjectForm'dan alacağız veya merkezi bir yere taşıyacağız

interface ProjectDetailsFieldsProps {
  title: string;
  onTitleChange: (value: string) => void;
  slug: string;
  onSlugChange: (value: string) => void;
  projectType: ProjectTypeEnum;
  onProjectTypeChange: (value: ProjectTypeEnum) => void;
  description: string | null;
  onDescriptionChange: (value: string) => void;
  releaseDate: string;
  onReleaseDateChange: (value: string) => void;
  errors: { title?: string[], slug?: string[], type?: string[], description?: string[], releaseDate?: string[] };
}

export default function ProjectDetailsFields({
  title, onTitleChange, slug, onSlugChange, projectType, onProjectTypeChange,
  description, onDescriptionChange, releaseDate, onReleaseDateChange, errors
}: ProjectDetailsFieldsProps) {
  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-7 text-gray-900 dark:text-gray-100">
        Proje Detayları
      </h2>
      <p className="mt-1 text-sm leading-6 text-gray-600 dark:text-gray-400">
        Projenin başlığı, slug'ı, türü gibi temel bilgiler.
      </p>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
        <div className="sm:col-span-3">
          <label htmlFor="title" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Başlık <span className="text-red-500">*</span></label>
          <div className="mt-2">
            <input type="text" name="title" id="title" value={title} onChange={(e) => onTitleChange(e.target.value)} required
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
          </div>
          {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.join(', ')}</p>}
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="slug" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Slug <span className="text-red-500">*</span></label>
          <div className="mt-2">
            <input type="text" name="slug" id="slug" value={slug} onChange={(e) => onSlugChange(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))} required
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
          </div>
          {errors.slug && <p className="mt-1 text-xs text-red-500">{errors.slug.join(', ')}</p>}
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="type" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Tür <span className="text-red-500">*</span></label>
          <div className="mt-2">
            <select id="type" name="type" value={projectType} onChange={(e) => onProjectTypeChange(e.target.value as ProjectTypeEnum)} required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800">
              <option value="oyun">Oyun</option>
              <option value="anime">Anime</option>
            </select>
          </div>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.join(', ')}</p>}
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="releaseDate" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Yayın Tarihi <span className="text-red-500">*</span></label>
          <div className="mt-2">
            <input type="date" name="releaseDate" id="releaseDate" value={releaseDate} onChange={(e) => onReleaseDateChange(e.target.value)} required
                   className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800" />
          </div>
          {errors.releaseDate && <p className="mt-1 text-xs text-red-500">{errors.releaseDate.join(', ')}</p>}
        </div>

        <div className="col-span-full">
          <label htmlFor="description" className="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Açıklama</label>
          <div className="mt-2">
            <textarea id="description" name="description" rows={4} value={description || ''} onChange={(e) => onDescriptionChange(e.target.value)}
                      className="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 dark:bg-gray-800"></textarea>
          </div>
          {errors.description && <p className="mt-1 text-xs text-red-500">{errors.description.join(', ')}</p>}
        </div>
      </div>
    </div>
  );
}