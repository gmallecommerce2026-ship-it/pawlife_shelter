'use client';
import React from 'react';
import { AdoptionApplication, YesNoSometimes } from '@/types/application';

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[8px] overflow-hidden">
    <div className="px-4 py-2.5 border-b border-gray-100 bg-[#FAFAFA]"><h3 className="font-bold text-[12px] text-gray-900">{title}</h3></div>
    <div className="px-4 py-3">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="font-sans text-[11px] text-gray-400 mb-0.5 leading-none">{label}</span>
    <span className="font-sans text-[12px] text-gray-900 font-medium leading-snug">{value || 'Chưa cập nhật'}</span>
  </div>
);

const YES_NO_LABEL: Record<string, string> = { Yes: 'Có', No: 'Không', Sometimes: 'Thỉnh thoảng' };

const CommitmentCheck = ({ label, value }: { label: string; value?: YesNoSometimes }) => {
  const isYes = value === 'Yes';
  return (
    <div className="flex items-center gap-2">
      <span className={`w-[14px] h-[14px] rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 ${
        isYes ? 'bg-[#E7F8ED] text-[#16A34A]' : value ? 'bg-[#FFF8E6] text-[#E89B5A]' : 'bg-gray-100 text-gray-400'
      }`}>{isYes ? '✓' : value ? '~' : '–'}</span>
      <span className={`font-sans text-[12px] font-medium ${isYes ? 'text-gray-900' : 'text-gray-400'}`}>
        {label}{value && !isYes ? ` (${YES_NO_LABEL[value] ?? value})` : ''}
      </span>
    </div>
  );
};

export const ApplicationDetailsSection: React.FC<{ application: AdoptionApplication }> = ({ application }) => {
  const c = application.commitments;
  return (
    <div className="flex flex-col">
      <SectionCard title="B - Điều kiện sống">
        <div className="grid grid-cols-2 gap-y-4 gap-x-4">
          <Field label="Địa chỉ" value={application.location} />
          <Field label="Loại nhà ở" value={application.housing} />
          <Field label="Trẻ nhỏ trong nhà" value={application.children} />
          <Field label="Kế hoạch chuồng/cũi" value={application.cage} />
        </div>
      </SectionCard>
      <SectionCard title="C - Kinh nghiệm nuôi thú cưng">
        <div className="flex flex-col gap-4">
          <Field label="Đã từng nuôi thú cưng" value={application.petExperience} />
          <Field label="Lịch sử nuôi trước đây" value={application.prevPetHistory} />
        </div>
      </SectionCard>
      <SectionCard title="D - Công việc & cá nhân">
        <Field label="Tình trạng việc làm" value={application.employmentStatus} />
      </SectionCard>
      <SectionCard title="E - Cam kết nhận nuôi">
        <div className="mb-4"><Field label="Lý do nhận nuôi" value={application.adoptionReason} /></div>
        <div className="w-full h-px bg-gray-100 mb-4" />
        <div className="grid grid-cols-2 gap-y-3 gap-x-4">
          <CommitmentCheck label="Tiêm phòng hàng năm" value={c?.vaccine} />
          <CommitmentCheck label="Cập nhật tình trạng nuôi" value={c?.updateStatus} />
          <CommitmentCheck label="Đưa đi khám khi cần" value={c?.medical} />
          <CommitmentCheck label="Đồng ý cho thăm nhà" value={c?.homeVisit} />
          <CommitmentCheck label="Chi trả chi phí trước bàn giao" value={c?.expenses} />
          <CommitmentCheck label="Cung cấp CCCD & địa chỉ chính xác" value={c?.provideID} />
        </div>
      </SectionCard>
    </div>
  );
};