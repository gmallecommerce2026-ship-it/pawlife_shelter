// src/types/application.ts

// Các trạng thái đơn nhận nuôi. Đồng bộ với app mobile (adoption-form.tsx):
// mobile check `status !== 'CLOSED' && status !== 'ADOPTION_COMPLETED'` để tính đơn "đang hoạt động"
// => CLOSED (người dùng tự rút đơn) không cần hiển thị trên Kanban của shelter, các trạng thái
//    còn lại là các bước xử lý mà shelter chủ động thao tác.
export type ApplicationStatus =
  | 'SUBMITTED'
  | 'PENDING'
  | 'NEED_MORE_INFO'
  | 'INTERVIEW_SCHEDULED'
  | 'APPROVED'
  | 'ADOPTION_COMPLETED'
  | 'CLOSED';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Đã nộp',
  PENDING: 'Đang xem xét',
  NEED_MORE_INFO: 'Cần bổ sung hồ sơ',
  INTERVIEW_SCHEDULED: 'Đã hẹn phỏng vấn',
  APPROVED: 'Đã duyệt',
  ADOPTION_COMPLETED: 'Đã bàn giao',
  CLOSED: 'Đã đóng / Từ chối',
};

export const KANBAN_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Đơn mới' },
  { status: 'PENDING', label: 'Đang xem xét' },
  { status: 'NEED_MORE_INFO', label: 'Cần bổ sung' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Hẹn phỏng vấn' },
  { status: 'APPROVED', label: 'Đã duyệt' },
];


export type YesNo = 'Yes' | 'No';
export type YesNoSometimes = 'Yes' | 'No' | 'Sometimes';
export type AdoptFor = 'Myself' | 'Someone else';

// Đồng bộ 1-1 với payload gửi lên từ app/adoption-form.tsx (mobile)
export interface AdoptionCommitments {
  vaccine: YesNo;       // sẵn sàng tiêm phòng & chăm sóc y tế hàng năm
  medical: YesNo;       // sẵn sàng đưa đi bệnh viện & chi trả điều trị
  expenses: YesNo;      // sẵn sàng chi trả chi phí sức khoẻ/vệ sinh trước khi bàn giao
  updateStatus: YesNo;  // sẵn sàng cập nhật tình trạng pet 6 tháng đầu
  homeVisit: YesNo;     // đồng ý cho shelter đến thăm nhà
  provideID: YesNo;     // đồng ý cung cấp CCCD & địa chỉ chính xác
}

export interface AdoptionApplicantPetSummary {
  id: string;
  name: string;
  avatarUrl?: string | null;
  breed?: string;
  species?: 'DOG' | 'CAT';
}

export interface AdoptionApplication {
  id: string;
  status: ApplicationStatus;
  reviewNote?: string;
  fullName: string; phone: string; zalo: string; adoptFor: string;
  location: string; housing: string; children: string; cage: string;
  petExperience: string; prevPetHistory: string; employmentStatus: string;
  adoptionReason: string;
  commitments: {
    vaccine?: string; medical?: string; expenses?: string;
    updateStatus?: string; homeVisit?: string; provideID?: string;
  };
  pet?: { id: string; name: string; avatarUrl?: string | null };
  createdAt: string; updatedAt: string;
}

export interface ApplicationFilter {
  search: string; // tìm theo tên người nộp đơn hoặc tên pet
}

export const defaultApplicationFilter: ApplicationFilter = {
  search: '',
};
