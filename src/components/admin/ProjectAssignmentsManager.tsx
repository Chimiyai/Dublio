// src/components/admin/ProjectAssignmentsManager.tsx
'use client';

import React, { useState, useEffect } from 'react'; // React importu eklendi
import { RoleInProject } from '@prisma/client';
import Select, { MultiValue } from 'react-select'; // MultiValue eklendi
import toast from 'react-hot-toast';
import { formatProjectRole } from '@/lib/utils';

// Tipler
export interface CharacterOption { value: number; label: string; }
export interface ArtistOption { value: number; label: string; } // Bu da react-select için
export interface AssignmentFormData {
  tempId: string;
  artistId: number;
  role: RoleInProject;
  artistName?: string;
  characterIds?: number[];
}

interface ProjectAssignmentsManagerProps {
  allArtists: ArtistOption[];
  availableRoles: RoleInProject[];
  projectCharactersForSelect: CharacterOption[];
  // isLoadingProjectCharacters: boolean; // Kaldırılmıştı, gerekirse geri eklenir
  initialAssignments: AssignmentFormData[];
  onAssignmentsChange: (assignments: AssignmentFormData[]) => void;
  isFormPending: boolean;
  isEditing: boolean; // Yeni proje / düzenleme modu için
}

export default function ProjectAssignmentsManager({
  allArtists,
  availableRoles,
  projectCharactersForSelect,
  // isLoadingProjectCharacters,
  initialAssignments,
  onAssignmentsChange,
  isFormPending,
  isEditing,
}: ProjectAssignmentsManagerProps): React.ReactNode {
  const [currentAssignments, setCurrentAssignments] = useState<AssignmentFormData[]>(initialAssignments);
  const [selectedArtistToAdd, setSelectedArtistToAdd] = useState<ArtistOption | null>(null);
  const [selectedRoleToAdd, setSelectedRoleToAdd] = useState<RoleInProject | ''>('');
  const [selectedCharactersForAssignment, setSelectedCharactersForAssignment] = useState<CharacterOption[]>([]);
  const [editingAssignment, setEditingAssignment] = useState<AssignmentFormData | null>(null);
  const [errors, setErrors] = useState<{ assignments?: string[] }>({});

  useEffect(() => {
    setCurrentAssignments(initialAssignments);
  }, [initialAssignments]);

  useEffect(() => {
    onAssignmentsChange(currentAssignments);
  }, [currentAssignments, onAssignmentsChange]);

  const roleOptionsForSelect = availableRoles.map(role => ({
    value: role,
    label: formatProjectRole(role),
  }));

  // --- YARDIMCI FONKSİYONLAR ---
  const addAssignment = () => {
    if (!selectedArtistToAdd || !selectedRoleToAdd) {
      setErrors({ assignments: ["Lütfen bir sanatçı ve rol seçin."] });
      return;
    }
    const exists = currentAssignments.some(
      a => a.artistId === selectedArtistToAdd.value && a.role === selectedRoleToAdd
    );
    if (exists) {
      toast.error("Bu sanatçı bu rolle zaten atanmış. Farklı bir rol seçin veya mevcut atamayı düzenleyin.");
      return;
    }
    const newAssignment: AssignmentFormData = {
      tempId: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      artistId: selectedArtistToAdd.value,
      role: selectedRoleToAdd,
      artistName: selectedArtistToAdd.label,
      characterIds: selectedRoleToAdd === RoleInProject.VOICE_ACTOR && selectedCharactersForAssignment.length > 0
        ? selectedCharactersForAssignment.map(charOpt => charOpt.value)
        : undefined,
    };
    setCurrentAssignments(prev => [...prev, newAssignment]);
    setErrors({}); // Hataları temizle
    setSelectedArtistToAdd(null);
    setSelectedRoleToAdd('');
    setSelectedCharactersForAssignment([]);
  };

  const removeAssignment = (tempIdToRemove: string) => {
    if (!confirm("Bu atamayı kaldırmak istediğinizden emin misiniz?")) return;
    setCurrentAssignments(prev => prev.filter(a => a.tempId !== tempIdToRemove));
    toast.success("Atama listeden kaldırıldı (henüz kaydedilmedi).");
    // Eğer silinen atama düzenlenmekte olan atama ise, düzenleme modunu da sıfırla
    if (editingAssignment && editingAssignment.tempId === tempIdToRemove) {
        setEditingAssignment(null);
        setSelectedArtistToAdd(null);
        setSelectedRoleToAdd('');
        setSelectedCharactersForAssignment([]);
    }
  };

  const handleStartEditAssignment = (assignmentToEdit: AssignmentFormData) => {
    setEditingAssignment(assignmentToEdit);
    const artistOption = allArtists.find(a => a.value === assignmentToEdit.artistId);
    setSelectedArtistToAdd(artistOption || null);
    setSelectedRoleToAdd(assignmentToEdit.role);

    if (assignmentToEdit.role === RoleInProject.VOICE_ACTOR && assignmentToEdit.characterIds) {
      const charsForSelect = projectCharactersForSelect.filter(pc_option =>
        assignmentToEdit.characterIds?.includes(pc_option.value)
      );
      setSelectedCharactersForAssignment(charsForSelect);
    } else {
      setSelectedCharactersForAssignment([]);
    }
    toast(`"${assignmentToEdit.artistName}" için "${formatProjectRole(assignmentToEdit.role)}" rolü düzenleniyor.`, { icon: '✏️' });
  };

  const handleUpdateAssignment = () => {
    if (!selectedArtistToAdd || !selectedRoleToAdd || !editingAssignment) {
      toast.error("Güncellenecek atama veya gerekli bilgiler eksik.");
      return;
    }
    const conflictingAssignment = currentAssignments.find(asn =>
      asn.artistId === selectedArtistToAdd.value &&
      asn.role === selectedRoleToAdd &&
      asn.tempId !== editingAssignment.tempId
    );
    if (conflictingAssignment) {
      toast.error("Bu sanatçı bu rolle zaten başka bir atamada mevcut.");
      return;
    }
    const updatedDataFields = {
      artistId: selectedArtistToAdd.value,
      role: selectedRoleToAdd,
      artistName: selectedArtistToAdd.label,
      characterIds: selectedRoleToAdd === RoleInProject.VOICE_ACTOR && selectedCharactersForAssignment.length > 0
        ? selectedCharactersForAssignment.map(charOpt => charOpt.value)
        : undefined,
    };
    const hasChanged =
      editingAssignment.artistId !== updatedDataFields.artistId ||
      editingAssignment.role !== updatedDataFields.role ||
      JSON.stringify(editingAssignment.characterIds?.sort() || []) !== JSON.stringify(updatedDataFields.characterIds?.sort() || []);

    if (!hasChanged) {
      toast("Atamada herhangi bir değişiklik yapılmadı.", { icon: 'ℹ️' });
      setEditingAssignment(null); setSelectedArtistToAdd(null); setSelectedRoleToAdd(''); setSelectedCharactersForAssignment([]);
      return;
    }
    setCurrentAssignments(prev =>
      prev.map(asn =>
        asn.tempId === editingAssignment.tempId
          ? { ...asn, ...updatedDataFields }
          : asn
      )
    );
    toast.success("Atama güncellendi (henüz kaydedilmedi).");
    setEditingAssignment(null); setSelectedArtistToAdd(null); setSelectedRoleToAdd(''); setSelectedCharactersForAssignment([]);
  };


  return (
    <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10">
      <h2 className="text-lg font-semibold leading-6 text-gray-900 dark:text-gray-100">
        Proje Katılımcıları ve Rolleri
      </h2>
      {errors.assignments && <p className="mt-2 text-sm text-red-600">{errors.assignments.join(', ')}</p>}
      
      {!isEditing && ( // Yeni proje modunda mesaj göster
        <p className="mt-4 text-sm text-orange-500 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 p-3 rounded-md">
          Sanatçı atamalarını yapabilmek için lütfen önce projeyi kaydedin.
        </p>
      )}

      {isEditing && ( // Sadece düzenleme modunda listeyi ve formu göster
        <>
          {/* Mevcut Atamalar Listesi */}
          <div className="mt-4 mb-6 space-y-2">
            {currentAssignments.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">Henüz bu projeye atanmış kimse yok.</p>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                {currentAssignments.map((assignment) => {
                  const assignedCharacterNames = assignment.role === RoleInProject.VOICE_ACTOR && assignment.characterIds && assignment.characterIds.length > 0
                    ? assignment.characterIds.map(charId => {
                        const foundChar = projectCharactersForSelect.find(pc_option => pc_option.value === charId);
                        return foundChar ? foundChar.label : `ID:${charId}`;
                      }).join(', ')
                    : null;

                  return (
                    <li key={assignment.tempId} className="px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <div className="flex-grow">
                        <span className="font-medium text-gray-900 dark:text-gray-100">{assignment.artistName || `Sanatçı ID: ${assignment.artistId}`}</span>
                        <span className="ml-2 px-2 py-0.5 inline-flex text-xs leading-4 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                          {formatProjectRole(assignment.role)}
                        </span>
                        {assignedCharacterNames && (
                          <p className="mt-1 text-xs text-purple-500 dark:text-purple-400 sm:ml-2">
                            Karakter(ler): {assignedCharacterNames}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-x-3 mt-2 sm:mt-0 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEditAssignment(assignment)}
                          className="font-medium text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                          disabled={isFormPending || !!editingAssignment}
                          title="Bu atamayı düzenle"
                        >
                          Düzenle
                        </button>
                        <button
                          type="button"
                          onClick={() => removeAssignment(assignment.tempId)}
                          className="font-medium text-red-600 hover:text-red-500 disabled:opacity-50"
                          disabled={isFormPending || (!!editingAssignment && editingAssignment.tempId === assignment.tempId)}
                          title="Bu atamayı kaldır"
                        >
                          Kaldır
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Yeni Atama / Atama Düzenleme Formu */}
          <div className="flex flex-col sm:flex-row items-end gap-3 pt-4 border-t border-gray-300 dark:border-gray-600">
            <div className='flex-grow'>
              <label htmlFor='select-artist-to-add-assignments' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editingAssignment ? 'Sanatçıyı Güncelle' : 'Sanatçı Seç'}
              </label>
              <Select
                instanceId="select-artist-to-add-assignments"
                inputId='select-artist-to-add-assignments'
                options={allArtists}
                value={selectedArtistToAdd}
                onChange={(option) => setSelectedArtistToAdd(option as ArtistOption | null)} // Tip cast veya option null kontrolü
                placeholder="Sanatçı ara veya seç..."
                isClearable
                isDisabled={isFormPending}
                className="react-select-container text-sm"
                classNamePrefix="react-select"
            styles={{
  control: (base, state) => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    borderColor: state.isFocused ? '#6366f1' /* indigo-500 */ : '#4b5563', // border-gray-600
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    '&:hover': {
      borderColor: '#6b7280', // border-gray-500
    },
    minHeight: '38px',
  }),
  menu: base => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    zIndex: 20,
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? '#4f46e5' // bg-indigo-600
      : isFocused
      ? '#374151' // bg-gray-700
      : '#1f2937', // bg-gray-800
    color: isSelected ? 'white' : '#f3f4f6', // text-gray-100
    '&:active': {
      backgroundColor: '#4338ca', // bg-indigo-700
    },
  }),
  multiValue: base => ({
    ...base,
    backgroundColor: '#4f46e5', // bg-indigo-600
  }),
  multiValueLabel: base => ({
    ...base,
    color: 'white',
  }),
  multiValueRemove: base => ({
    ...base,
    color: 'white',
    '&:hover': {
      backgroundColor: '#4338ca', // bg-indigo-700
      color: 'white',
    },
  }),
  placeholder: base => ({
    ...base,
    color: '#9ca3af', // text-gray-400
  }),
  singleValue: base => ({
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
  input: base => ({ // input içindeki metin rengi
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
}}
          />
        </div>
        <div className='w-full sm:w-auto sm:min-w-[200px]'>
              <label htmlFor="select-role-to-add-assignments" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {editingAssignment ? 'Rolü Güncelle' : 'Rol Seç'}
              </label>
              <Select
                instanceId="select-role-to-add-assignments"
                inputId="select-role-to-add-assignments"
                options={roleOptionsForSelect}
                value={roleOptionsForSelect.find(opt => opt.value === selectedRoleToAdd) || null}
                onChange={(option) => setSelectedRoleToAdd(option ? option.value : '')}
                isDisabled={isFormPending}
                placeholder="Rol seçin..."
                className="react-select-container text-sm"
                classNamePrefix="react-select"
            styles={{
  control: (base, state) => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    borderColor: state.isFocused ? '#6366f1' /* indigo-500 */ : '#4b5563', // border-gray-600
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    '&:hover': {
      borderColor: '#6b7280', // border-gray-500
    },
    minHeight: '38px',
  }),
  menu: base => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    zIndex: 20,
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? '#4f46e5' // bg-indigo-600
      : isFocused
      ? '#374151' // bg-gray-700
      : '#1f2937', // bg-gray-800
    color: isSelected ? 'white' : '#f3f4f6', // text-gray-100
    '&:active': {
      backgroundColor: '#4338ca', // bg-indigo-700
    },
  }),
  multiValue: base => ({
    ...base,
    backgroundColor: '#4f46e5', // bg-indigo-600
  }),
  multiValueLabel: base => ({
    ...base,
    color: 'white',
  }),
  multiValueRemove: base => ({
    ...base,
    color: 'white',
    '&:hover': {
      backgroundColor: '#4338ca', // bg-indigo-700
      color: 'white',
    },
  }),
  placeholder: base => ({
    ...base,
    color: '#9ca3af', // text-gray-400
  }),
  singleValue: base => ({
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
  input: base => ({ // input içindeki metin rengi
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
}}
          />
        </div>
        
        {/* Karakter Seçim Alanı */}
            {selectedRoleToAdd === RoleInProject.VOICE_ACTOR && (
                <div className='flex-grow w-full sm:w-auto mt-3 sm:mt-0'>
                    <label htmlFor='select-characters-for-assignment' className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Seslendirilecek Karakter(ler)
                    </label>
                    <Select
                      instanceId="select-characters-for-assignment"
                      inputId='select-characters-for-assignment'
                      isMulti
                      options={projectCharactersForSelect}
                      value={selectedCharactersForAssignment}
                      onChange={(selectedOptions: MultiValue<CharacterOption>) => { // Tip eklendi
                          setSelectedCharactersForAssignment(selectedOptions ? [...selectedOptions] : []);
                      }}
                      placeholder="Karakter(ler) seçin..."
                      // isLoading={isLoadingProjectCharacters} // Ana formdan gelmeli veya burada yönetilmeli
                      closeMenuOnSelect={false}
                      isDisabled={isFormPending || !projectCharactersForSelect || projectCharactersForSelect.length === 0}
                      className="react-select-container text-sm"
                      classNamePrefix="react-select"
                styles={{
  control: (base, state) => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    borderColor: state.isFocused ? '#6366f1' /* indigo-500 */ : '#4b5563', // border-gray-600
    boxShadow: state.isFocused ? '0 0 0 1px #6366f1' : 'none',
    '&:hover': {
      borderColor: '#6b7280', // border-gray-500
    },
    minHeight: '38px',
  }),
  menu: base => ({
    ...base,
    backgroundColor: '#1f2937', // bg-gray-800
    zIndex: 20,
  }),
  option: (base, { isFocused, isSelected }) => ({
    ...base,
    backgroundColor: isSelected
      ? '#4f46e5' // bg-indigo-600
      : isFocused
      ? '#374151' // bg-gray-700
      : '#1f2937', // bg-gray-800
    color: isSelected ? 'white' : '#f3f4f6', // text-gray-100
    '&:active': {
      backgroundColor: '#4338ca', // bg-indigo-700
    },
  }),
  multiValue: base => ({
    ...base,
    backgroundColor: '#4f46e5', // bg-indigo-600
  }),
  multiValueLabel: base => ({
    ...base,
    color: 'white',
  }),
  multiValueRemove: base => ({
    ...base,
    color: 'white',
    '&:hover': {
      backgroundColor: '#4338ca', // bg-indigo-700
      color: 'white',
    },
  }),
  placeholder: base => ({
    ...base,
    color: '#9ca3af', // text-gray-400
  }),
  singleValue: base => ({
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
  input: base => ({ // input içindeki metin rengi
    ...base,
    color: '#f3f4f6', // text-gray-100
  }),
}}
                />
            </div>
        )}

        <div className="flex sm:flex-col gap-2 w-full sm:w-auto mt-3 sm:mt-0 sm:self-end">
                <button
                  type="button"
                  onClick={editingAssignment ? handleUpdateAssignment : addAssignment}
            disabled={
    isFormPending ||
    !selectedArtistToAdd || 
    !selectedRoleToAdd ||
    (!!editingAssignment && // editingAssignment'ın varlığını boolean'a çevir
      selectedArtistToAdd !== null && // selectedArtistToAdd'ın null olmadığını kontrol et
      editingAssignment.artistId === selectedArtistToAdd.value &&
      editingAssignment.role === selectedRoleToAdd &&
      JSON.stringify(editingAssignment.characterIds?.sort() || []) === 
      JSON.stringify(selectedCharactersForAssignment.map(c => c.value).sort() || [])
    )
}
            className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 disabled:opacity-50 h-[38px] whitespace-nowrap w-full ${
                editingAssignment ? 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
            }`}
            >
            {editingAssignment ? 'Atamayı Güncelle' : 'Ata'}
            </button>
            {editingAssignment && (
            <button
                type="button"
                onClick={() => {
                setEditingAssignment(null);
                setSelectedArtistToAdd(null);
                setSelectedRoleToAdd('');
                setSelectedCharactersForAssignment([]);
                toast.dismiss();
                }}
                className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-300 h-[38px] w-full"
            >
                İptal
                  </button>
                )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}