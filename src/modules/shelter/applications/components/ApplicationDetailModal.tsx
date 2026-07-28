'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { FiX, FiCheck, FiXCircle } from 'react-icons/fi';
import { GiPawPrint } from 'react-icons/gi';
import Button from '@/components/ui/Button';
import { AdoptionApplication, APPLICATION_STATUS_LABEL } from '@/types/application';
import { useApplicationActions } from '@/stores/useApplicationStore';

interface DetailRowProps {
  label: string;
  value?: string | number | null;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="py-2.5 border-b border-gray-50 last:border-0">
    <p className="text-xs text-gray-400 mb-0.5">{label}</p>
    <p className="text-sm text-gray-800 font-medium whitespace-pre-line">{value || '—'}</p>
  </div>
);

const yesNoLabel = (v?: string) => (v === 'Yes' ? 'Đồng ý' : v === 'No' ? 'Không đồng ý' : v === 'Sometimes' ? 'Thỉnh thoảng' : '—');

interface ApplicationDetailModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  initialShowRejectForm?: boolean;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
  initialShowRejectForm = false,
}) => {
  const { moveApplication } = useApplicationActions();
  const [reviewNote, setReviewNote] = useState(application.reviewNote ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(initialShowRejectForm);

  const runAction = async (status: AdoptionApplication['status'], note?: string) => {
    setIsSubmitting(true);
    const ok = await moveApplication(application.id, status, note);
    setIsSubmitting(false);
    if (ok) onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-white w-full max-w-2xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden #ffefe1 flex items-center justify-center shrink-0">
              {application.pet?.avatarUrl ? (
                <Image src={application.pet.avatarUrl} alt={application.pet.name} fill className="object-cover" />
              ) : (
                <GiPawPrint className="text-[#E89B5A]" size={20} />
              )}
            </div>
            <div>
              <h2 className="font-bold text-[#123832] text-lg leading-tight">Đơn nhận nuôi — {application.pet?.name ?? 'Pet'}</h2>
              <span className="text-xs text-gray-500">{APPLICATION_STATUS_LABEL[application.status]}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors">
            <FiX size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Mục A — Thông tin liên lạc</p>
          <DetailRow label="Họ và tên" value={application.fullName} />
          <DetailRow label="Số điện thoại" value={application.phone} />
          <DetailRow label="Zalo / WhatsApp" value={application.zalo} />
          <DetailRow label="Nhận nuôi cho" value={application.adoptFor === 'Myself' ? 'Bản thân' : 'Người khác'} />

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">Mục B — Điều kiện sinh sống</p>
          <DetailRow label="Địa chỉ nuôi giữ" value={application.location} />
          <DetailRow label="Loại nhà ở" value={application.housing} />
          <DetailRow label="Có trẻ nhỏ trong nhà" value={yesNoLabel(application.children)} />
          <DetailRow label="Dự định nhốt trong chuồng" value={yesNoLabel(application.cage)} />

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">Mục C — Kinh nghiệm nuôi thú cưng</p>
          <DetailRow label="Đã từng nuôi thú cưng" value={application.petExperience} />
          <DetailRow label="Thú cưng trước đó" value={application.prevPetHistory} />

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">Mục D — Việc làm & cá nhân</p>
          <DetailRow label="Tình trạng việc làm" value={application.employmentStatus} />

          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-4 mb-1">Mục E — Cam kết nhận nuôi</p>
          <DetailRow label="Lý do nhận nuôi" value={application.adoptionReason} />
          <DetailRow label="Tiêm phòng & chăm sóc y tế hàng năm" value={yesNoLabel(application.commitments?.vaccine)} />
          <DetailRow label="Chi trả viện phí khi ốm" value={yesNoLabel(application.commitments?.medical)} />
          <DetailRow label="Chi trả chi phí sức khoẻ/vệ sinh trước bàn giao" value={yesNoLabel(application.commitments?.expenses)} />
          <DetailRow label="Cập nhật tình trạng pet 6 tháng đầu" value={yesNoLabel(application.commitments?.updateStatus)} />
          <DetailRow label="Cho phép thăm nhà theo dõi" value={yesNoLabel(application.commitments?.homeVisit)} />
          <DetailRow label="Cung cấp CCCD & địa chỉ chính xác" value={yesNoLabel(application.commitments?.provideID)} />

          {showRejectForm && (
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Lý do từ chối (gửi cho người nộp đơn)</p>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Điều kiện nhà ở hiện tại chưa phù hợp với nhu cầu vận động của pet..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
              />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 shrink-0 bg-gray-50/50">
          {application.status === 'SUBMITTED' && !showRejectForm && (
            <Button variant="secondary" disabled={isSubmitting} onClick={() => runAction('PENDING')}>
              Chuyển sang xem xét
            </Button>
          )}

          {showRejectForm ? (
            <>
              <Button variant="secondary" disabled={isSubmitting} onClick={() => setShowRejectForm(false)}>
                Huỷ
              </Button>
              <Button
                variant="primary"
                disabled={isSubmitting}
                onClick={() => runAction('CLOSED', reviewNote)}
                className="!bg-red-500 hover:!bg-red-600 !text-white flex items-center gap-1.5"
              >
                <FiXCircle size={16} /> Xác nhận từ chối
              </Button>
            </>
          ) : (
            application.status !== 'CLOSED' && application.status !== 'ADOPTION_COMPLETED' && (
              <Button
                variant="secondary"
                disabled={isSubmitting}
                onClick={() => setShowRejectForm(true)}
                className="!text-red-600 !border-red-200 hover:!bg-red-50"
              >
                Từ chối
              </Button>
            )
          )}

          {(application.status === 'PENDING' || application.status === 'SUBMITTED' || application.status === 'INTERVIEW_SCHEDULED') && !showRejectForm && (
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={() => runAction('APPROVED')}
              className="!bg-[#E89B5A] hover:!bg-[#D68B4E] !text-white flex items-center gap-1.5"
            >
              <FiCheck size={16} /> Duyệt đơn
            </Button>
          )}

          {application.status === 'APPROVED' && !showRejectForm && (
            <Button
              variant="primary"
              disabled={isSubmitting}
              onClick={() => runAction('ADOPTION_COMPLETED')}
              className="!bg-[#E89B5A] hover:!bg-[#D68B4E] !text-white flex items-center gap-1.5"
            >
              <FiCheck size={16} /> Xác nhận đã bàn giao
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
