// src/components/admin/ReportManager.tsx
'use client';

import { Dialog, Transition } from '@headlessui/react';
import { useState, useEffect, Fragment } from 'react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { formatDistanceToNowStrict } from 'date-fns';
import { tr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { EyeIcon, CheckCircleIcon, ArchiveBoxXMarkIcon } from '@heroicons/react/24/outline';
import { formatReportStatus } from '@/lib/utils';

// API'den gelen rapor tipini tanımlayalım
type ReportWithUsers = {
  id: number;
  reason: string;
  description: string | null;
  status: string; // 'pending', 'reviewed', 'resolved'
  createdAt: string;
  reporter: { id: number; username: string; };
  reported: { id: number; username: string; };
};

export default function ReportManager() {
  const [reports, setReports] = useState<ReportWithUsers[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'resolved' | 'all'>('pending');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<ReportWithUsers | null>(null);
  const openReportModal = (report: ReportWithUsers) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };
  const closeReportModal = () => {
    setIsModalOpen(false);
    // Gecikmeli olarak null yapmak, kapanış animasyonu sırasında içeriğin kaybolmasını önler
    setTimeout(() => setSelectedReport(null), 300); 
  };

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/reports');
      if (!response.ok) throw new Error('Raporlar yüklenemedi.');
      const data: ReportWithUsers[] = await response.json();
      setReports(data);
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);
// --- YENİ: Rapor Durumunu Güncelleme Fonksiyonu ---
  const handleUpdateStatus = async (reportId: number, newStatus: 'pending' | 'reviewed' | 'resolved') => {
    setIsProcessing(reportId); // İşlem başladığında butonu pasif yap
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Durum güncellenemedi.');
      }
      
      toast.success('Rapor durumu güncellendi.');
      // Listeyi anında güncelle
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: newStatus } : r));

    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(null); // İşlem bitince butonu aktif et
    }
  };

  // --- YENİ: Rapor Silme Fonksiyonu ---
  const handleDeleteReport = async (reportId: number, reportedUsername: string) => {
    if (!confirm(`'${reportedUsername}' hakkındaki bu raporu kalıcı olarak silmek istediğinizden emin misiniz?`)) return;
    
    setIsProcessing(reportId);
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'DELETE',
      });

      if (response.status !== 204) {
        const data = await response.json();
        throw new Error(data.message || 'Rapor silinemedi.');
      }
      
      toast.success('Rapor başarıyla silindi.');
      // Listeyi anında güncelle
      setReports(prev => prev.filter(r => r.id !== reportId));

    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setIsProcessing(null);
    }
  };

  const filteredReports = reports.filter(report => {
    if (filter === 'all') return true;
    return report.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Filtre Butonları */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700 pb-3">
        <button onClick={() => setFilter('pending')} className={cn("px-3 py-1 text-sm rounded-md", filter === 'pending' ? 'bg-yellow-600 text-white' : 'text-gray-300 hover:bg-gray-800')}>
          Bekleyenler
        </button>
        <button onClick={() => setFilter('reviewed')} className={cn("px-3 py-1 text-sm rounded-md", filter === 'reviewed' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800')}>
          İnceleniyor
        </button>
        <button onClick={() => setFilter('resolved')} className={cn("px-3 py-1 text-sm rounded-md", filter === 'resolved' ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-800')}>
          Çözüldü
        </button>
        <button onClick={() => setFilter('all')} className={cn("px-3 py-1 text-sm rounded-md", filter === 'all' ? 'bg-purple-600 text-white' : 'text-gray-300 hover:bg-gray-800')}>
          Tümü
        </button>
      </div>

      {/* Raporlar Tablosu */}
      <div className="overflow-x-auto bg-gray-900 shadow-lg rounded-lg border border-gray-800">
        <table className="min-w-full table-auto">
          <thead className="bg-gray-800 text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Raporlanan</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Raporlayan</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Sebep</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Tarih</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">Durum</th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">İşlemler</th>
            </tr>
          </thead>
          <tbody className="bg-gray-900 divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={6} className="text-center py-10 text-gray-400">Raporlar yükleniyor...</td></tr>
            ) : filteredReports.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-10 text-gray-400">Bu filtrede gösterilecek rapor bulunamadı.</td></tr>
            ) : filteredReports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-800/50">
                
                {/* === EKSİK OLAN SÜTUNLAR BURAYA EKLENECEK === */}

                {/* Raporlanan Sütunu */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-white">
                  <Link href={`/profil/${report.reported.username}`} className="hover:underline" target="_blank">
                    {report.reported.username}
                  </Link>
                </td>

                {/* Raporlayan Sütunu */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-300">
                  <Link href={`/profil/${report.reporter.username}`} className="hover:underline" target="_blank">
                    {report.reporter.username}
                  </Link>
                </td>

                {/* Sebep Sütunu */}
                <td className="px-4 py-4 text-sm text-gray-300 max-w-xs truncate" title={report.reason}>
                  {report.reason}
                  {/* Opsiyonel: Detaylı açıklama varsa bir ikonla belirtilebilir */}
                </td>

                {/* Tarih Sütunu */}
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-400" title={new Date(report.createdAt).toLocaleString('tr-TR')}>
                  {formatDistanceToNowStrict(new Date(report.createdAt), { locale: tr, addSuffix: true })}
                </td>

                {/* Durum Sütunu */}
                <td className="px-4 py-4 whitespace-nowrap text-sm">
                  <span className={cn('px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full', {
                      'bg-yellow-900 text-yellow-200': report.status === 'pending',
                      'bg-blue-900 text-blue-200': report.status === 'reviewed',
                      'bg-green-900 text-green-200': report.status === 'resolved',
                  })}>
                    {formatReportStatus(report.status)}
                  </span>
                </td>

                {/* İşlemler Sütunu */}
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-3">
                    {/* Göz ikonu artık modalı açacak */}
                    <button 
                      onClick={() => openReportModal(report)} 
                      title="Rapor Detayını Görüntüle" 
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <EyeIcon className="w-5 h-5"/>
                    </button>
                    {/* Diğer butonlar modal içine taşınabilir veya burada kalabilir. Şimdilik burada kalsın. */}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* --- YENİ: Rapor Detay Modalı --- */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={closeReportModal}>
          {/* Arka plan karartması için overlay */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 border border-gray-700 p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-bold leading-6 text-white border-b border-gray-700 pb-3 mb-4"
                  >
                    Rapor Detayları
                  </Dialog.Title>
                  
                  {selectedReport && (
                    <div className="mt-2 space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="font-semibold text-gray-400">Raporlayan Kullanıcı</p>
                          <Link href={`/profil/${selectedReport.reporter.username}`} className="text-blue-400 hover:underline">{selectedReport.reporter.username}</Link>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-400">Raporlanan Kullanıcı</p>
                          <Link href={`/profil/${selectedReport.reported.username}`} className="text-red-400 hover:underline">{selectedReport.reported.username}</Link>
                        </div>
                      </div>

                      <div>
                        <p className="font-semibold text-gray-400">Rapor Sebebi</p>
                        <p className="text-white bg-gray-800 p-2 rounded-md">{selectedReport.reason}</p>
                      </div>

                      {selectedReport.description && (
                     <div>
                      <p className="font-semibold text-gray-400">Detaylı Açıklama</p>
                      <p 
                        className={cn(
                          "text-gray-300 bg-gray-800 p-3 rounded-md whitespace-pre-wrap",
                          // --- YENİ EKLENEN CLASS'LAR ---
                          "break-words",    // Kelimeleri uygun yerlerden kır
                          "overflow-wrap-break-word" // Taşmayı önlemek için ek güvence
                        )}
                      >
                        {selectedReport.description}
                      </p>
                    </div>
                  )}
                      
                      <div className="border-t border-gray-700 pt-4 mt-6">
                        <p className="font-semibold text-gray-400 mb-2">İşlemler</p>
                        <div className="flex items-center space-x-3">
                          <button onClick={() => handleUpdateStatus(selectedReport.id, 'reviewed')} disabled={isProcessing === selectedReport.id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/40 disabled:opacity-50">
                            <EyeIcon className="w-4 h-4"/> İnceleniyor
                          </button>
                          <button onClick={() => handleUpdateStatus(selectedReport.id, 'resolved')} disabled={isProcessing === selectedReport.id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-green-600/20 text-green-300 rounded-md hover:bg-green-600/40 disabled:opacity-50">
                            <CheckCircleIcon className="w-4 h-4"/> Çözüldü
                          </button>
                          <button onClick={() => handleDeleteReport(selectedReport.id, selectedReport.reported.username)} disabled={isProcessing === selectedReport.id} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-600/20 text-red-300 rounded-md hover:bg-red-600/40 disabled:opacity-50">
                             <ArchiveBoxXMarkIcon className="w-4 h-4"/> Raporu Sil
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 text-right">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-700 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={closeReportModal}
                    >
                      Kapat
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
      {/* ------------------------------- */}

    </div>
  );
}