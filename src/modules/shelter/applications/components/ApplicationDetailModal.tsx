'use client';

import React, { useState } from 'react';
import { X, Download, Calendar, Clock, Check, XCircle } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AdoptionApplication } from '@/types/application';
import { useApplicationActions } from '@/stores/useApplicationStore';

// --- Helpers ---
const formatAppDate = (iso?: string) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  // Định dạng "Feb 13, 2026"
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- Sub-components ---
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-4 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
    <div className="bg-[#F8F9FA] px-5 py-3 border-b border-gray-200">
      <h3 className="font-bold text-[14px] text-gray-900">{title}</h3>
    </div>
    <div className="p-5 flex flex-col gap-4">
      {children}
    </div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col flex-1 min-w-[50%]">
    <span className="font-['Urbanist',_sans-serif] text-[12px] text-gray-400 mb-1">{label}</span>
    <span className="font-['Urbanist',_sans-serif] text-[13px] text-gray-900 font-medium leading-relaxed">
      {value || '-'}
    </span>
  </div>
);

const CommitmentCheck = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2 flex-1 min-w-[50%] py-1">
    <Check size={16} className="text-[#34C759] shrink-0" strokeWidth={2.5} />
    <span className="font-['Urbanist',_sans-serif] text-[13px] text-gray-900 font-medium">
      {label}
    </span>
  </div>
);

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

  const submitDate = formatAppDate(application.createdAt);
  const updateDate = formatAppDate(application.updatedAt || application.createdAt);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#F8F9FA] w-full max-w-[640px] max-h-[90vh] rounded-[20px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white flex justify-between items-start px-6 pt-6 pb-4 border-b border-gray-200 shrink-0">
          <div>
            <div className="flex items-center gap-3 mb-2.5">
              <h2 className="font-['Urbanist',_sans-serif] text-[24px] font-bold text-gray-900 leading-none">
                Application Details
              </h2>
              <button className="text-gray-400 hover:text-gray-700 transition-colors">
                <Download size={20} strokeWidth={2} />
              </button>
            </div>
            <div className="flex items-center gap-5 text-[13px] text-gray-500 font-medium">
              <span className="flex items-center gap-1.5">
                <Calendar size={15} /> Submitted on {submitDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={15} /> Updated {updateDate}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors bg-gray-50 hover:bg-gray-100 p-1.5 rounded-full">
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          
          <SectionCard title="A - Contact Information">
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <Field label="Full Name" value={application.fullName} />
              <Field label="Phone Number" value={application.phone} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Field label="Email Address" value={application.zalo || 'mariagarcia@email.com'} />
              <Field label="Adopting For" value={application.adoptFor === 'Someone else' ? 'Someone else' : 'Myself'} />
            </div>
          </SectionCard>

          <SectionCard title="B - Living Conditions">
            <div className="flex flex-col sm:flex-row gap-4 mb-2">
              <Field label="Location" value={application.location || 'Cầu Giấy, Hà Nội'} />
              <Field label="Housing Type" value={application.housing || 'Apartment (allows pet ownership)'} />
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Field label="Children" value={application.children || 'Yes, 3 children'} />
              <Field label="Cage Plan For" value={application.cage || 'No'} />
            </div>
          </SectionCard>

          <SectionCard title="C - Pet Experience">
            <Field label="Previous Pet" value={application.petExperience || 'Yes, 3 cats & 2 dogs'} />
            <Field label="Previous Pet History" value={application.prevPetHistory || 'My previous dogs passed away due to old age after 12 years together.'} />
          </SectionCard>

          <SectionCard title="D - Employment & Personal">
            <Field label="Employment" value={application.employmentStatus || 'Currently employed'} />
          </SectionCard>

          <SectionCard title="E - Adoption Commitment">
            <Field label="Reason for Adoption" value={application.adoptionReason || 'Because I want to give them a forever home'} />
            
            <div className="w-full h-px bg-gray-100 my-1" />
            
            <div className="flex flex-col sm:flex-row gap-x-4 gap-y-2 flex-wrap">
              <CommitmentCheck label="Yearly vaccinations" />
              <CommitmentCheck label="Provide status updates" />
              <CommitmentCheck label="Hospital treatment when needed" />
              <CommitmentCheck label="Allow home visits" />
              <CommitmentCheck label="Cover pre-adoption expenses" />
              <CommitmentCheck label="Willing to provide needed personal info" />
            </div>
          </SectionCard>

          {/* Form Từ Chối (Nếu có) */}
          {showRejectForm && (
            <div className="mt-2 p-5 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-bottom-2">
              <p className="text-[13px] font-bold text-red-800 uppercase tracking-wider mb-2">Lý do từ chối (gửi cho người nhận)</p>
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={3}
                placeholder="Ví dụ: Điều kiện nhà ở chưa phù hợp với kích thước của thú cưng..."
                className="w-full border border-red-200 rounded-lg px-3 py-2.5 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};