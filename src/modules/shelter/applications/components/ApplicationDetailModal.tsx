'use client';

import React from 'react';
import { X, Download, Calendar, Clock, Check } from 'lucide-react';
import { AdoptionApplication } from '@/types/application';

// --- Helpers ---
const formatAppDate = (iso?: string) => {
  if (!iso) return 'N/A';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// --- Sub-components ---
// Chuyển background header thành màu trắng (chỉ giữ border) để trông phẳng và gọn hơn
const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[8px] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100">
      <h3 className="font-bold text-[13px] text-gray-900">{title}</h3>
    </div>
    <div className="px-4 py-3">
      {children}
    </div>
  </div>
);

// Bỏ flex-row cũ, chỉ giữ layout dọc cơ bản để đưa vào Grid 2 cột
const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="font-['Be Vietnam Pro',_sans-serif] text-[11px] text-gray-400 mb-0.5 leading-none">
      {label}
    </span>
    <span className="font-['Be Vietnam Pro',_sans-serif] text-[13px] text-gray-900 font-medium leading-snug">
      {value || '-'}
    </span>
  </div>
);

const CommitmentCheck = ({ label }: { label: string }) => (
  <div className="flex items-center gap-2">
    <Check size={14} className="text-[#34C759] shrink-0" strokeWidth={3} />
    <span className="font-['Be Vietnam Pro',_sans-serif] text-[12px] text-gray-900 font-medium">
      {label}
    </span>
  </div>
);

interface ApplicationDetailModalProps {
  application: AdoptionApplication;
  onClose: () => void;
}

export const ApplicationDetailModal: React.FC<ApplicationDetailModalProps> = ({
  application,
  onClose,
}) => {
  const submitDate = formatAppDate(application.createdAt);
  const updateDate = formatAppDate(application.updatedAt || application.createdAt);

  return (
    <div className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        // Tăng max-w lên 680px để nội dung có không gian dàn ngang, giảm max-h để Form không dài thoòng
        className="bg-white w-full max-w-[680px] max-h-[85vh] rounded-[16px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white flex justify-between items-start px-6 pt-5 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h2 className="font-['Be Vietnam Pro',_sans-serif] text-[20px] font-bold text-gray-900 leading-none">
                Application Details
              </h2>
              <button className="text-gray-400 hover:text-gray-700 transition-colors">
                <Download size={15} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex items-center gap-4 text-[12px] text-gray-500 font-medium mt-1.5">
              <span className="flex items-center gap-1.5">
                <Calendar size={13} /> Submitted on {submitDate}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock size={13} /> Updated {updateDate}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors p-1 bg-gray-50 hover:bg-gray-100 rounded-full">
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Scrollable Body - Sử dụng Grid 2 cột tuyệt đối để ép chiều cao */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-white">
          
          <SectionCard title="A - Contact Information">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Full Name" value={application.fullName || application.user?.name || "Maria Garcia"} />
              <Field label="Phone Number" value={application.phone} />
              <Field label="Email Address" value={application.zalo || 'mariagarcia@email.com'} />
              <Field label="Adopting For" value={application.adoptFor === 'Someone else' ? 'Someone else' : 'Myself'} />
            </div>
          </SectionCard>

          <SectionCard title="B - Living Conditions">
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              <Field label="Location" value={application.location || 'Cầu Giấy, Hà Nội'} />
              <Field label="Housing Type" value={application.housing || 'Apartment (allows pet ownership)'} />
              <Field label="Children" value={application.children || 'Yes, 3 children'} />
              <Field label="Cage Plan For" value={application.cage || 'No'} />
            </div>
          </SectionCard>

          <SectionCard title="C - Pet Experience">
            <div className="flex flex-col gap-3">
              <Field label="Previous Pet" value={application.petExperience || 'Yes, 3 cats & 2 dogs'} />
              {/* Giữ nguyên Label Housing Type như trong ảnh design */}
              <Field label="Housing Type" value={application.prevPetHistory || 'My previous dogs passed away due to old age after 12 years together.'} />
            </div>
          </SectionCard>

          <SectionCard title="D - Employment & Personal">
            <Field label="Employment" value={application.employmentStatus || 'Currently employed'} />
          </SectionCard>

          <SectionCard title="E - Adoption Commitment">
            <div className="mb-3">
              <Field label="Reason for Adoption" value={application.adoptionReason || 'Because I want to give them a forever home'} />
            </div>
            
            <div className="w-full h-px bg-gray-100 mb-3" />
            
            <div className="grid grid-cols-2 gap-y-2.5 gap-x-4">
              <CommitmentCheck label="Yearly vaccinations" />
              <CommitmentCheck label="Provide status updates" />
              <CommitmentCheck label="Hospital treatment when needed" />
              <CommitmentCheck label="Allow home visits" />
              <CommitmentCheck label="Cover pre-adoption expenses" />
              <CommitmentCheck label="Willing to provide needed personal info" />
            </div>
          </SectionCard>

        </div>
      </div>
    </div>
  );
};