'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, Loader2, FileDown, X } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';

const txt = (v: any): string => {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number') return String(v);
  if (typeof v === 'object') return v.vi ?? v.en ?? '';
  return String(v);
};

interface DownloadPdfButtonProps {
  application: AdoptionApplication;
  /** class của nút, mặc định giống các icon-button khác */
  className?: string;
  iconSize?: number;
}

export const DownloadPdfButton: React.FC<DownloadPdfButtonProps> = ({
  application,
  className = 'p-1.5 rounded-lg text-gray-400 hover:text-[#E89B5A] hover:bg-orange-50 transition-colors disabled:opacity-50',
  iconSize = 16,
}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applicantName =
    txt(application.fullName) || txt((application as any).user?.name) || 'người đăng ký';
  const petName = txt(application.pet?.name) || 'bé';

  const openConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isDownloading) return;
    setError(null);
    setIsConfirmOpen(true);
  };

  const closeConfirm = () => {
    if (isDownloading) return;
    setIsConfirmOpen(false);
  };

  const handleConfirm = async () => {
    try {
      setIsDownloading(true);
      setError(null);
      await downloadApplicationPdf(application);
      setIsConfirmOpen(false);
    } catch (err) {
      console.error('Lỗi xuất PDF:', err);
      setError('Không thể xuất PDF. Vui lòng thử lại.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openConfirm}
        disabled={isDownloading}
        title="Tải đơn nhận nuôi (PDF)"
        className={className}
      >
        {isDownloading ? (
          <Loader2 size={iconSize} className="animate-spin" />
        ) : (
          <Download size={iconSize} />
        )}
      </button>

      {isConfirmOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4"
            onClick={(e) => {
              e.stopPropagation();
              closeConfirm();
            }}
          >
            <div
              className="relative bg-white w-full max-w-[380px] rounded-[20px] shadow-2xl p-5 animate-in fade-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={closeConfirm}
                disabled={isDownloading}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>

              <div className="w-11 h-11 rounded-full bg-[#FDEBDD] flex items-center justify-center mb-3">
                <FileDown size={20} className="text-[#E89B5A]" />
              </div>

              <h3 className="text-[16px] font-bold text-gray-900 mb-1.5">Tải đơn nhận nuôi?</h3>
              <p className="text-[13px] text-gray-600 leading-relaxed mb-4">
                Đơn của <strong className="text-gray-900">{applicantName}</strong> cho bé{' '}
                <strong className="text-gray-900">{petName}</strong> sẽ được xuất thành file PDF.
                Quá trình này có thể mất vài giây.
              </p>

              {error && (
                <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                  {error}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={closeConfirm}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[13px] font-semibold rounded-[10px] disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={isDownloading}
                  className="px-4 py-2 bg-[#E89B5A] hover:bg-[#D68B4E] text-white text-[13px] font-bold rounded-[10px] flex items-center gap-1.5 disabled:opacity-70"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Đang tạo PDF...
                    </>
                  ) : (
                    'Tải xuống'
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};

export default DownloadPdfButton;