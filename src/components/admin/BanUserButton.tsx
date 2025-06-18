// src/components/admin/BanUserButton.tsx
'use client';

import { useSession } from 'next-auth/react';
import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { NoSymbolIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

interface BanUserButtonProps {
  userId: number;
  username: string;
  isBanned: boolean;
  // Kendi kendini banlamayı önlemek için
  isCurrentUserAdmin: boolean;
}

export default function BanUserButton({ userId, username, isBanned, isCurrentUserAdmin }: BanUserButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [duration, setDuration] = useState<number>(7); // Varsayılan 7 gün
  const [isPermanent, setIsPermanent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { data: session, update: updateSession } = useSession();

  // Eğer banlı ise, ban kaldırma işlemi
  const handleUnban = async () => {
    if (!confirm(`'${username}' kullanıcısının banını kaldırmak istediğinizden emin misiniz?`)) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch(`/api/admin/users/${userId}/ban`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      
      if (session?.user.id === userId.toString()) {
        // Eğer kendi banın kaldırıldıysa session'ı güncelle
        await updateSession();
        window.location.reload();
      } else {
        await updateSession();
        window.location.reload();
      }
      toast.success(data.message);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Banlama işlemi
  const handleBan = async () => {
    if (!reason.trim()) {
      toast.error('Lütfen bir ban sebebi girin.');
      return;
    }
    
    setIsProcessing(true);
    try {
      const requestBody = {
        reason: reason,
        durationInDays: isPermanent ? null : duration,
      };
      const response = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });
      
      const data = await response.json();
      if (!response.ok) {
        if (data.errors) {
            const errorMessages = Object.values(data.errors).flat().join('\n');
            throw new Error(errorMessages);
        }
        throw new Error(data.message || 'Banlama işlemi başarısız oldu.');
      }
      toast.success(data.message);
      closeModal();
      if (session?.user.id === userId.toString()) {
        // Kendi hesabını banladıysan çıkış yap
        if (typeof window !== 'undefined') {
          const { signOut } = await import('next-auth/react');
          signOut();
        }
      } else {
        window.location.reload();
      }
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  if (isCurrentUserAdmin) {
    return <span className="text-xs text-gray-500">Kendin</span>;
  }
  
  if (isBanned) {
    return (
      <button onClick={handleUnban} disabled={isProcessing} className="text-green-400 hover:text-green-300 disabled:opacity-50">
        Banı Kaldır
      </button>
    );
  }

  return (
    <>
      <button onClick={openModal} className="text-red-400 hover:text-red-300">
        Banla
      </button>

      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeModal}>
          <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
            <div className="fixed inset-0 bg-black/60" />
          </Transition.Child>
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left align-middle shadow-xl transition-all border border-gray-700">
                  <Dialog.Title as="h3" className="text-lg font-bold leading-6 text-white flex items-center gap-2">
                    <ShieldExclamationIcon className="w-6 h-6 text-red-400"/>
                    "{username}" Kullanıcısını Banla
                  </Dialog.Title>
                  <div className="mt-4 space-y-4">
                    <div>
                      <label htmlFor="reason" className="block text-sm font-medium text-gray-300">Ban Sebebi</label>
                      <input type="text" id="reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1 w-full bg-gray-800 border-gray-600 rounded-md p-2 text-white" />
                    </div>
                    
                    <div className={cn(isPermanent && "opacity-50")}>
                      <label htmlFor="duration" className="block text-sm font-medium text-gray-300">Süre (Gün)</label>
                      <input type="number" id="duration" value={duration} onChange={(e) => setDuration(Number(e.target.value))} disabled={isPermanent} className="mt-1 w-full bg-gray-800 border-gray-600 rounded-md p-2 text-white disabled:cursor-not-allowed" />
                    </div>

                    <div className="flex items-center">
                      <input id="permanent" type="checkbox" checked={isPermanent} onChange={(e) => setIsPermanent(e.target.checked)} className="h-4 w-4 rounded border-gray-600 bg-gray-800 text-red-600 focus:ring-red-500" />
                      <label htmlFor="permanent" className="ml-2 block text-sm text-gray-300">Kalıcı Ban</label>
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-4">
                    <button type="button" onClick={closeModal} className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-md hover:bg-gray-600">İptal</button>
                    <button type="button" onClick={handleBan} disabled={isProcessing || !reason.trim()} className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50">
                      {isProcessing ? 'İşleniyor...' : 'Banla'}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}