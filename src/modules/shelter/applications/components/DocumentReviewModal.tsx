'use client';

import React, { useState } from 'react';
import { X, FileText, X as RejectIcon, Check } from 'lucide-react';
import { RequiredDocument } from '@/constants/adoptionDocuments';

const formatShortDate = (iso?: string) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return 'N/A';
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

export interface DocumentReviewData extends RequiredDocument {
  submittedAt?: string; // ISO — ngày người nộp đơn gửi tài liệu này lên
  fileSizeLabel?: string; // vd "2.4 MB" — chưa có backend lưu, để optional
  reviewStatus?: 'accepted' | 'rejected'; // NEW: dùng cho chế độ readOnly
  rejectionReason?: string; // NEW: hiển thị lại lý do từ chối khi readOnly
}

interface DocumentReviewModalProps {
  document: DocumentReviewData;
  onClose: () => void;
  onAccept: () => void;
  onReject: (reason: string) => void;
  /** true = tài liệu đã được duyệt rồi (accepted/rejected), chỉ cho Xem lại, ẩn nút Accept/Reject */
  readOnly?: boolean;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  document,
  onClose,
  onAccept,
  onReject,
  readOnly = false,
}) => {
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = () => {
    onReject(rejectionReason.trim());
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-[110] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[20px] shadow-2xl w-full max-w-[420px] p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[19px] font-bold text-[#0D062D]">{document.label}</h2>
            <p className="text-[12.5px] text-gray-400 mt-1">
              Submitted {formatShortDate(document.submittedAt)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview box */}
        <div className="border border-gray-200 rounded-[16px] bg-[#FAFAFA] flex flex-col items-center justify-center py-8 gap-2">
          <div className="w-12 h-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center shadow-sm">
            <FileText size={22} className="text-gray-400" strokeWidth={1.6} />
          </div>
          <span className="text-[14px] font-semibold text-gray-900 mt-1">{document.label}</span>
          <span className="text-[12px] text-gray-400">Submitted {formatShortDate(document.submittedAt)}</span>
          {document.fileSizeLabel && (
            <span className="text-[12px] text-gray-400">Size: {document.fileSizeLabel}</span>
          )}
        </div>

        {readOnly ? (
          <>
            {/* Kết quả duyệt trước đó — chỉ hiển thị lại, không cho đổi quyết định */}
            {document.reviewStatus === 'accepted' && (
              <div className="flex items-center gap-2 bg-[#E7F8ED] text-[#16A34A] text-[13px] font-semibold px-4 py-3 rounded-xl">
                <Check size={16} /> Tài liệu đã được chấp nhận
              </div>
            )}
            {document.reviewStatus === 'rejected' && (
              <div className="flex flex-col gap-1 bg-red-50 text-red-600 text-[13px] font-semibold px-4 py-3 rounded-xl">
                <span className="flex items-center gap-2">
                  <RejectIcon size={16} /> Tài liệu đã bị từ chối
                </span>
                {document.rejectionReason && (
                  <span className="text-[12px] font-normal text-red-500">
                    Lý do: {document.rejectionReason}
                  </span>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 h-[46px] rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
              >
                Đóng
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Rejection reason */}
            <div>
              <label className="text-[13px] font-semibold text-gray-800">
                Rejection Reason <span className="font-normal text-gray-400">(optional, but recommended)</span>
              </label>
              <input
                type="text"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g., Image is blurry, document is expired, wrong document type..."
                className="w-full mt-2 border border-gray-200 rounded-[10px] px-3.5 py-2.5 text-[13px] text-gray-800 outline-none focus:border-[#E89B5A] transition-colors placeholder:text-gray-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleReject}
                className="flex-1 h-[46px] rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <RejectIcon size={15} /> Reject
              </button>
              <button
                type="button"
                onClick={onAccept}
                className="flex-1 h-[46px] rounded-xl bg-[#F3A571] hover:bg-[#E89B5A] text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <Check size={15} /> Accept
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};