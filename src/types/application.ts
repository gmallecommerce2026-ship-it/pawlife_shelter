export type ApplicationStatus =
  | 'SUBMITTED' | 'PENDING' | 'NEED_MORE_INFO'
  | 'INTERVIEW_SCHEDULED' | 'APPROVED' | 'ADOPTION_COMPLETED' | 'CLOSED';

export const APPLICATION_STATUS_LABEL: Record<ApplicationStatus, string> = {
  SUBMITTED: 'Đã nộp',
  PENDING: 'Đang xem xét',
  NEED_MORE_INFO: 'Cần bổ sung hồ sơ',
  INTERVIEW_SCHEDULED: 'Đã hẹn phỏng vấn',
  APPROVED: 'Đã duyệt',
  ADOPTION_COMPLETED: 'Đã bàn giao',
  CLOSED: 'Từ chối',
};

export const KANBAN_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: 'SUBMITTED', label: 'Đơn mới' },
  { status: 'PENDING', label: 'Đang xem xét' },
  { status: 'NEED_MORE_INFO', label: 'Cần bổ sung' },
  { status: 'INTERVIEW_SCHEDULED', label: 'Hẹn phỏng vấn' },
  { status: 'APPROVED', label: 'Đã duyệt' },
  { status: 'CLOSED', label: 'Từ chối' },
];

export type YesNo = 'Yes' | 'No';
export type YesNoSometimes = 'Yes' | 'No' | 'Sometimes';

export interface AdoptionCommitments {
  vaccine?: YesNoSometimes;
  medical?: YesNoSometimes;
  expenses?: YesNoSometimes;
  updateStatus?: YesNoSometimes;
  homeVisit?: YesNoSometimes;
  provideID?: YesNoSometimes;
}

// Pet.species/breed/description/color lưu dạng song ngữ {vi,en} ở DB (xem toBilingual() trong shelter-dashboard.service.ts)
export type LocalizedText = { vi?: string; en?: string } | string | null | undefined;

export interface AdoptionApplicantUser {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
}

export interface AdoptionApplicantPetSummary {
  id: string;
  name: string;
  breed?: LocalizedText;
  species?: LocalizedText;
  gender?: string | null;
  dob?: string | null; // ISO date
  images?: { url: string }[]; // include { take: 1 } từ shelter-dashboard.service#getMyApplications
}
export interface ApplicationTag {
  id: string;
  name: string;
  color?: string | null;
}

export interface ApplicationNote {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  createdAt: string | Date;
}
export interface ApplicationDocumentSummary {
  id: string;
  key: string;
  status: 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
}

export interface AdoptionApplication {
  id: string;
  status: ApplicationStatus;
  reviewNote?: string | null;

  // Do người nộp đơn khai lúc submit (CreateApplicationDto, mobile) — có thể khác hồ sơ user
  fullName: string;
  phone: string;
  zalo?: string;
  adoptFor?: string;
  location?: string;
  housing?: string;
  children?: string;
  cage?: string;
  petExperience?: string;
  prevPetHistory?: string;
  employmentStatus?: string;
  adoptionReason?: string;
  commitments?: AdoptionCommitments;
  tags?: ApplicationTag[];
  notes?: ApplicationNote[];
  pet?: AdoptionApplicantPetSummary;
  user?: AdoptionApplicantUser; // include user{id,name,avatarUrl,email,phone} từ getMyApplications
  documents?: ApplicationDocumentSummary[];
  createdAt: string;
  updatedAt?: string;
}

export interface ApplicationFilter {
  search: string;
}

export const defaultApplicationFilter: ApplicationFilter = { search: '' };

// ---- Helpers dùng chung ----
export function localizedText(value: LocalizedText, locale: 'vi' | 'en' = 'vi'): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return (locale === 'vi' ? value.vi : value.en) || value.vi || value.en || '';
}

export function getPetAgeLabel(dob?: string | null): string {
  if (!dob) return 'Chưa rõ tuổi';
  const birth = new Date(dob);
  if (Number.isNaN(birth.getTime())) return 'Chưa rõ tuổi';
  const now = new Date();
  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  if (now.getDate() < birth.getDate()) months -= 1;
  if (months < 1) return 'Dưới 1 tháng tuổi';
  if (months < 12) return `${months} tháng tuổi`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest > 0 ? `${years} tuổi ${rest} tháng` : `${years} tuổi`;
}

export function getInitials(name?: string | null): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || '?';
}