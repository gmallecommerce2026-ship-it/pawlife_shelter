'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronUp,
  ChevronDown,
  Send,
  Mars,
  Venus,
  Calendar,
  Eye,
  ExternalLink,
  Loader2,
  RotateCw,
  MapPin,
} from 'lucide-react';
import { AdoptionApplication, ApplicationNote, COMMITMENTS_CONFIG } from '@/types/application';
import { NoteItem, resolveNoteRole } from './NoteItem';
import { CommitmentItem, isCommitmentAgreed } from './MoveToPendingModal';
import { applicationService } from '@/services/applicationService';
import { apiClient } from '@/lib/api/ApiClient';
import { SelectTagsModal } from './SelectTagsModal';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import { PartyPopper } from 'lucide-react';
import { DocumentReviewModal } from './DocumentReviewModal';
import { RequestedDocument } from './RequestDocumentsModal';
import { DOCUMENT_TYPE_OPTIONS } from '@/constants/adoptionDocuments';
const mapBackendDoc = (doc: any): ApplicationDocumentItem => ({
  id: doc.id,
  key: doc.key,
  label: doc.label,
  description: doc.description,
  category: doc.category ?? DOCUMENT_TYPE_OPTIONS.find((opt) => opt.key === doc.key)?.category ?? 'OTHER',
  status: doc.status,
  fileUrl: doc.fileUrl ?? doc.file?.url ?? null,
  fileName: doc.fileName ?? doc.file?.name ?? null,
  rejectionReason: doc.rejectionReason ?? null,
  submittedAt: doc.submittedAt ?? null,
});

const translateHousing = (val?: string | null): string => {
  if (!val) return 'Chung cư (cho phép nuôi thú cưng)';
  const map: Record<string, string> = {
    'apartment': 'Chung cư',
    'apartment (pets allowed)': 'Chung cư (cho phép nuôi thú cưng)',
    'house': 'Nhà riêng / Nhà đất',
    'townhouse': 'Nhà phố',
    'villa': 'Biệt thự',
    'rented room': 'Phòng trọ',
    'rental house': 'Nhà thuê (cho phép nuôi thú cưng)',
    'dormitory': 'Ký túc xá',
  };
  return map[val.trim().toLowerCase()] || val;
};

const translateChildren = (val?: string | null): string => {
  if (!val) return 'Không có trẻ nhỏ';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'no': 'Không có trẻ nhỏ',
    'no children': 'Không có trẻ nhỏ',
    'none': 'Không có trẻ nhỏ',
    'yes': 'Có trẻ nhỏ trong nhà',
    'under 5': 'Có trẻ dưới 5 tuổi',
    'under 5 years old': 'Có trẻ dưới 5 tuổi',
    '5-12 years old': 'Có trẻ từ 5 - 12 tuổi',
    'above 12': 'Có trẻ trên 12 tuổi',
  };
  return map[clean] || val;
};

const translateCage = (val?: string | null): string => {
  if (!val) return 'Không xích nhốt';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'no': 'Không xích nhốt',
    'no cage': 'Không xích nhốt',
    'free roaming': 'Tự do trong nhà (không xích nhốt)',
    'indoor free': 'Thả tự do trong nhà',
    'caged': 'Nuôi nhốt chuồng',
    'caged at night': 'Nhốt chuồng vào ban đêm',
    'leashed': 'Có xích khi cần thiết',
  };
  return map[clean] || val;
};

const translatePetExperience = (val?: string | null): string => {
  if (!val) return 'Đã có kinh nghiệm';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'experienced': 'Đã có kinh nghiệm nuôi',
    'had pets before': 'Đã từng nuôi trước đây',
    'first time': 'Lần đầu nuôi thú cưng',
    'first time owner': 'Lần đầu nuôi thú cưng',
    'no experience': 'Chưa có kinh nghiệm',
    'currently have pets': 'Hiện đang có thú cưng ở nhà',
  };
  return map[clean] || val;
};

const translateEmploymentStatus = (val?: string | null): string => {
  if (!val) return 'Đang đi làm / Thu nhập ổn định';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'employed': 'Đang đi làm',
    'employed / stable income': 'Đang đi làm / Thu nhập ổn định',
    'full-time': 'Toàn thời gian (Full-time)',
    'part-time': 'Bán thời gian (Part-time)',
    'self-employed': 'Kinh doanh tự do',
    'freelancer': 'Làm việc tự do (Freelancer)',
    'student': 'Học sinh / Sinh viên',
    'unemployed': 'Đang tìm việc',
    'retired': 'Đã nghỉ hưu',
  };
  return map[clean] || val;
};

const translatePetHistory = (val?: string | null): string => {
  if (!val) return 'Đã từng chăm sóc chu đáo trước đây.';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'carefully cared for': 'Đã từng chăm sóc chu đáo trước đây.',
    'good care': 'Chăm sóc tốt, đầy đủ tiêm phòng.',
    'fully vaccinated': 'Được tiêm phòng và chăm sóc định kỳ đầy đủ.',
  };
  return map[clean] || val;
};

const translateAdoptionReason = (val?: string | null): string => {
  if (!val) return 'Mong muốn mang lại cho bé một mái ấm trọn đời';
  const clean = val.trim().toLowerCase();
  const map: Record<string, string> = {
    'because i want to give them a forever home': 'Mong muốn mang lại cho bé một mái ấm trọn đời',
    'love animals': 'Yêu thương động vật và muốn đồng hành cùng bé',
    'looking for a companion': 'Tìm kiếm một người bạn thú cưng đồng hành',
  };
  return map[clean] || val;
};

const checkCommitmentValue = (commitments: any, key: string, label: string): boolean => {
  if (!commitments) return false;
  if (typeof commitments === 'object' && !Array.isArray(commitments)) {
    const raw = commitments[key] ?? commitments[label];
    return isCommitmentAgreed(raw);
  }
  if (Array.isArray(commitments)) {
    return commitments.includes(key) || commitments.includes(label);
  }
  return false;
};

const SectionCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-3 bg-white border border-gray-200 rounded-[10px] overflow-hidden">
    <div className="px-3.5 py-2 border-b border-gray-100 bg-[#FAFAFA]">
      <h4 className="font-bold text-[11.5px] text-gray-800 uppercase tracking-wider">{title}</h4>
    </div>
    <div className="px-3.5 py-2.5">{children}</div>
  </div>
);

const Field = ({ label, value }: { label: string; value?: string | null }) => (
  <div className="flex flex-col">
    <span className="text-[11px] text-gray-400 mb-0.5">{label}</span>
    <span className="text-[12.5px] text-gray-800 font-medium leading-snug">{value || '-'}</span>
  </div>
);
export interface InterviewMember {
  id: string;
  name: string;
  email: string;
  note: string;
}

interface ApplicationDocumentItem {
  id: string;
  key: string;
  label: string;
  description?: string;
  category: string;
  status: 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  fileUrl?: string | null;
  fileName?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
}

interface TagItem {
  id: string;
  name: string;
  color?: string | null;
}

interface ApproveApplicationModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: { applicationId: string; reviewNote?: string; notes?: ApplicationNote[] }) => void;
  onScheduleInterview: (applicationId: string, data: any) => Promise<any>;
  onRefresh?: () => void;
  onCompleteAdoption?: (applicationId: string) => Promise<void>;
}

const createEmptyMember = (): InterviewMember => ({
  id: crypto.randomUUID(),
  name: '',
  email: '',
  note: '',
});

export const pickLocale = (value: any, locale: 'vi' | 'en' = 'vi'): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (typeof value === 'object') {
    return value[locale] ?? value.vi ?? value.en ?? '';
  }
  return String(value);
};

export const getPetInfoLabel = (pet?: AdoptionApplication['pet']) => {
  if (!pet) return 'Chưa rõ thông tin';
  let ageLabel = '';
  if ((pet as any).dob) {
    const birth = new Date((pet as any).dob);
    if (!Number.isNaN(birth.getTime())) {
      const now = new Date();
      let months =
        (now.getFullYear() - birth.getFullYear()) * 12 +
        (now.getMonth() - birth.getMonth());
      if (now.getDate() < birth.getDate()) months -= 1;
      ageLabel =
        months < 12
          ? `${Math.max(months, 0)} tháng tuổi`
          : `${Math.floor(months / 12)} tuổi`;
    }
  }
  return (
    [ageLabel, pickLocale((pet as any).breed)].filter(Boolean).join(' · ') ||
    'Chưa rõ thông tin'
  );
};

const toDatetimeLocalValue = (dateOrIso?: string | Date | null) => {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};


const parseMembersList = (rawMembers: any): InterviewMember[] => {
  if (!rawMembers) return [createEmptyMember()];
  let parsed = rawMembers;
  if (typeof rawMembers === 'string') {
    try { parsed = JSON.parse(rawMembers); } catch { parsed = []; }
  }
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed.map((m: any) => ({
      id: m.id || crypto.randomUUID(),
      name: typeof m === 'string' ? m : m.name || m.fullName || '',
      email: m.email || '',
      note: m.note || m.role || '',
    }));
  }
  return [createEmptyMember()];
};

export const ApproveApplicationModal: React.FC<ApproveApplicationModalProps> = ({
  application,
  onClose,
  onSubmit,
  onScheduleInterview,
  onRefresh,
  onCompleteAdoption,
}) => {
  const existingAppointment = (application as any)?.appointment;

  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const addTagBtnRef = useRef<HTMLButtonElement>(null);

  const [isCompletingAdoption, setIsCompletingAdoption] = useState(false);
  const defaultTitle =
    existingAppointment?.title ||
    `Hẹn phỏng vấn nhận nuôi ${application.pet?.name || ''}`.trim();

  const [title, setTitle] = useState(defaultTitle);
  const [format, setFormat] = useState<'Online' | 'Offline'>(
    existingAppointment ? (existingAppointment.type === 'ONLINE' ? 'Online' : 'Offline') : 'Online'
  );
  const [meetLink, setMeetLink] = useState<string>(existingAppointment?.meetLink || '');
  const [isLoadingMeetLink, setIsLoadingMeetLink] = useState(false);

  const [location, setLocation] = useState(
    existingAppointment?.location ||
    (application.pet as any)?.shelter?.address ||
    ''
  );

  const [dateSlot, setDateSlot] = useState<string>(() => {
    if (existingAppointment?.appointmentDate) {
      return new Date(existingAppointment.appointmentDate).toISOString();
    }
    return '';
  });

  const [members, setMembers] = useState<InterviewMember[]>(() => {
    return parseMembersList(existingAppointment?.members);
  });

  const [tags, setTags] = useState<TagItem[]>(() => {
    const rawTags = (application as any).tags || [];
    return rawTags.map((t: any) => (t.tag ? t.tag : typeof t === 'string' ? { id: t, name: t } : t));
  });

  const [documents, setDocuments] = useState<ApplicationDocumentItem[]>(
    (application as any).documents || []
  );
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');

  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [reviewingDocKey, setReviewingDocKey] = useState<string | null>(null);
  const reviewingDoc = documents.find((d) => d.key === reviewingDocKey) ?? null;
  const handleAddTagWithColor = async (tagData: { name: string; color: string }) => {
    const tagName = tagData.name.trim();
    if (!tagName) return;

    try {
      const res = await applicationService.addTag(application.id, { name: tagName, color: tagData.color });
      const createdTag = res.data?.tag || res?.tag || { id: Date.now().toString(), name: tagName, color: tagData.color };
      setTags((prev) => [...prev, createdTag]);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi thêm thẻ:', err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await applicationService.removeTag(application.id, tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi xoá thẻ:', err);
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const target = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (target) handleRemoveTag(target.id);
  };

  const fetchRealMeetLink = useCallback(async () => {
    try {
      setIsLoadingMeetLink(true);
      const res: any = await apiClient.get('/applications/quick-meet-link');
      const realLink =
        res?.data?.data?.meetLink ||
        res?.data?.meetLink ||
        res?.meetLink;
      if (realLink) {
        setMeetLink(realLink);
      }
    } catch (err) {
      console.error('Lỗi khi tạo link Meet:', err);
    } finally {
      setIsLoadingMeetLink(false);
    }
  }, []);

  const appointmentKey = JSON.stringify((application as any)?.appointment ?? null);

  useEffect(() => {
    console.log('application.documents:', (application as any).documents);
    const appt = (application as any)?.appointment;
    if (appt) {
      setTitle(appt.title || defaultTitle);
      setFormat(appt.type === 'ONLINE' ? 'Online' : 'Offline');
      setMeetLink(appt.meetLink || '');
      setDateSlot(appt.appointmentDate ? new Date(appt.appointmentDate).toISOString() : '');
      setLocation(appt.location || (application.pet as any)?.shelter?.address || '');
      setMembers(parseMembersList(appt.members));
    } else {
      setFormat('Online');
      fetchRealMeetLink();
    }

    setNotes(application.notes || []);
    const rawTags = (application as any).tags || [];
    setTags(rawTags.map((t: any) => (t.tag ? t.tag : typeof t === 'string' ? { id: t, name: t } : t)));

    // 👇 luôn gọi API lấy documents mới nhất, không tin vào field lồng sẵn trong application
    fetchDocuments();
  }, [application.id, appointmentKey]);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await applicationService.getDocuments(application.id);
      console.log('RAW getDocuments response:', res); // 👈 debug tạm thời
      const rawDocs = Array.isArray(res) ? res : (res?.data || []);
      setDocuments((Array.isArray(rawDocs) ? rawDocs : []).map(mapBackendDoc));
    } catch (err) {
      console.error('Lỗi tải tài liệu:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const primaryStaffName = useMemo(() => {
    return members.find((m) => m.name.trim())?.name || (application.pet as any)?.shelter?.name || 'Nhân sự trạm';
  }, [members, application.pet]);

  const primaryStaffPhone = useMemo(() => {
    return (
      (application.pet as any)?.shelter?.phone ||
      (application.pet as any)?.shelter?.contactInfo?.phone ||
      '0912345678'
    );
  }, [application.pet]);

  const primaryStaffAvatar =
    (application.pet as any)?.shelter?.avatarUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=120';

  const handleAddMember = () => setMembers((prev) => [...prev, createEmptyMember()]);

  const handleMemberChange = (id: string, field: 'name' | 'note' | 'email', value: string) => {
    setMembers((prev) => prev.map((m) => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const handleFormatChange = (next: 'Online' | 'Offline') => {
    setFormat(next);
    if (next === 'Offline' && !location.trim()) {
      setLocation((application.pet as any)?.shelter?.address || '');
    }
    if (next === 'Online' && !meetLink.trim()) {
      fetchRealMeetLink();
    }
  };

  const handleScheduleSubmit = async (isCompleted = false) => {
    const filledMembers = members.filter((m) => m.name.trim());
    const finalDate = dateSlot || new Date().toISOString();

    const payload = {
      title,
      format,
      location: format === 'Offline' ? location : null,
      meetingLink: format === 'Online' ? meetLink.trim() : null,
      durationMinutes: 60,
      scheduledAt: finalDate,
      members: filledMembers.map((m) => ({
        id: m.id,
        name: m.name.trim(),
        email: m.email?.trim() || undefined,
        note: m.note?.trim() || undefined,
      })),
      reminderMinutesBefore: 10,
      completed: isCompleted,
      reviewNote: isCompleted
        ? `Đã hoàn thành phỏng vấn nhận nuôi ${application.pet?.name}`
        : `Lịch phỏng vấn (${format}): ${title}`,
    };


    try {
      setIsSubmittingInterview(true);
      await onScheduleInterview(application.id, payload);
      if (onRefresh) onRefresh();
      alert(isCompleted ? 'Đã hoàn thành và lưu thông tin phỏng vấn!' : 'Đã cập nhật lịch hẹn thành công!');
    } catch (error: any) {
      console.error('Lỗi lưu lịch hẹn:', error);
      alert(error?.message || 'Có lỗi xảy ra khi lưu lịch hẹn.');
    } finally {
      setIsSubmittingInterview(false);
    }
  };
  const handleCompleteAdoption = async () => {
    if (!onCompleteAdoption || isCompletingAdoption) return;
    const confirmed = window.confirm(
      `Xác nhận ${application.pet?.name || 'thú cưng'} đã được bàn giao cho ${applicantName}? Hành động này sẽ hoàn tất hồ sơ nhận nuôi.`
    );
    if (!confirmed) return;

    try {
      setIsCompletingAdoption(true);
      await onCompleteAdoption(application.id);
    } catch (error) {
      console.error('Lỗi hoàn tất nhận nuôi:', error);
    } finally {
      setIsCompletingAdoption(false);
    }
  };
  const handleAddNote = async () => {
    if (!noteInput.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      const response = await applicationService.addNote(application.id, noteInput.trim(), 'FOLLOW_UP');
      const addedNote = response?.data || response;

      const newNoteObj: ApplicationNote = {
        id: addedNote?.id || Date.now().toString(),
        authorId: addedNote?.authorId || 'current-user',
        authorName: addedNote?.authorName || addedNote?.author?.name || 'Nhân viên trạm',
        authorAvatar: addedNote?.authorAvatar || addedNote?.author?.avatarUrl || null,
        authorRole: resolveNoteRole(addedNote) ?? null,
        content: addedNote?.content || noteInput.trim(),
        type: addedNote?.type || 'FOLLOW_UP',
        createdAt: addedNote?.createdAt || new Date().toISOString(),
      };

      setNotes((prev) => [newNoteObj, ...prev]);
      setNoteInput('');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Lỗi thêm ghi chú:', error);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleAdvance = () => {
    onSubmit({
      applicationId: application.id,
      reviewNote: 'Đã hoàn thành phỏng vấn và chuyển tiếp hồ sơ.',
      notes,
    });
  };

  const applicantName = application.fullName || application.user?.name || 'Người đăng ký';
  const firstName = applicantName.split(' ')[0] || 'Đơn';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[490px] max-h-[92vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-150 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors z-20"
        >
          <X size={18} strokeWidth={2} />
        </button>

        {/* Thân Modal cuộn */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pt-7 pb-6 space-y-6">

          {/* Header Thông tin Người nhận nuôi & Pet Card */}
          <div className="flex gap-4 items-start">
            <img
              src={application.user?.avatarUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=200'}
              className="w-[102px] h-[102px] rounded-full object-cover border border-gray-100 shrink-0"
              alt={applicantName}
            />

            <div className="flex-1 min-w-0">
              <h2 className="text-[19px] font-bold text-gray-900 leading-tight mb-2">
                {applicantName}
              </h2>

              <div className="flex items-center gap-2 text-gray-500 text-[13px] mb-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{application.phone || (application as any).zalo || '09876543210'}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-500 text-[13px] mb-2">
                <Mail size={13} className="text-gray-400 shrink-0" />
                <span className="truncate">{application.zalo || application.user?.email || 'adopter@pawlife.vn'}</span>
              </div>

              <button
                type="button"
                onClick={() => downloadApplicationPdf(application)}
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#E59858] text-[13px] transition-colors mb-3 cursor-pointer"
              >
                <Download size={13} className="text-gray-500 shrink-0" />
                <span>
                  Tải về <span className="font-bold underline">{firstName} - Đơn nhận nuôi.pdf</span>
                </span>
              </button>

              {/* Target Pet Pill Card */}
              <div className="border border-gray-200 rounded-[14px] p-2 flex items-center gap-3 bg-white shadow-sm w-full">
                <img
                  src={
                    application.pet?.avatarUrl ||
                    application.pet?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=150'
                  }
                  className="w-10 h-10 rounded-lg object-cover shrink-0"
                  alt={application.pet?.name || 'Cún'}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[14px] text-gray-900 truncate">
                      {application.pet?.name || 'Cún'}
                    </span>
                    {isMale ? (
                      <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF]" />
                    ) : (
                      <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93]" />
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 truncate">
                    {getPetInfoLabel(application.pet)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tags Section */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-[16px] font-bold text-gray-900">Gắn thẻ</span>
              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen((v) => !v)}
                  className="text-[#E89B5A] hover:text-[#D68B4E] text-[13px] font-semibold transition-colors cursor-pointer"
                >
                  + Thêm
                </button>

                {isTagModalOpen && (
                  <SelectTagsModal
                    triggerRef={addTagBtnRef}
                    existingTags={tags}
                    onClose={() => setIsTagModalOpen(false)}
                    onAddTag={handleAddTagWithColor}
                    onRemoveTag={handleRemoveTagByName}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => {
                const tagColor = tag.color || '#5982E6';
                return (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-semibold border transition-all"
                    style={{
                      backgroundColor: `${tagColor}15`,
                      borderColor: `${tagColor}40`,
                      color: tagColor,
                    }}
                  >
                    {tag.name}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:opacity-75"
                    >
                      <X size={12} />
                    </button>
                  </span>
                );
              })}
            </div>
          </div>

          {/* 1. Accordion: Chi tiết đơn nhận nuôi */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2"
              onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Chi tiết đơn nhận nuôi</span>
              {isAppDetailsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isAppDetailsOpen && (
              <div className="flex flex-col gap-2.5 mt-3 animate-in fade-in duration-200">
                {/* Section A: Điều kiện sinh sống */}
                <SectionCard title="A - Điều kiện sinh sống">
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                    <Field label="Khu vực / Địa chỉ" value={application.location || 'Chưa cập nhật'} />
                    <Field label="Loại nhà ở" value={translateHousing(application.housing)} />
                    <Field label="Trẻ em trong nhà" value={translateChildren(application.children)} />
                    <Field label="Kế hoạch chuồng / xích" value={translateCage(application.cage)} />
                  </div>
                </SectionCard>

                {/* Section B: Kinh nghiệm & Việc làm */}
                <SectionCard title="B - Kinh nghiệm & Việc làm">
                  <div className="grid grid-cols-2 gap-y-2.5 gap-x-3">
                    <Field label="Từng nuôi thú cưng" value={translatePetExperience(application.petExperience)} />
                    <Field label="Tình trạng việc làm" value={translateEmploymentStatus(application.employmentStatus)} />
                    <div className="col-span-2">
                      <Field label="Lịch sử chăm sóc" value={translatePetHistory(application.prevPetHistory)} />
                    </div>
                  </div>
                </SectionCard>

                {/* Section C: Cam kết nhận nuôi */}
                <SectionCard title="C - Cam kết nhận nuôi">
                  <div className="mb-2.5">
                    <Field label="Lý do nhận nuôi" value={translateAdoptionReason(application.adoptionReason)} />
                  </div>
                  <div className="w-full h-px bg-gray-200 mb-3" />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 items-start">
                    {COMMITMENTS_CONFIG.map((item) => {
                      const isCommitted = checkCommitmentValue(application.commitments, item.key, item.label);
                      return (
                        <CommitmentItem
                          key={item.key}
                          label={item.label}
                          isCommitted={isCommitted}
                        />
                      );
                    })}
                  </div>
                </SectionCard>
              </div>
            )}
          </div>

          {/* 2. Accordion: Bổ sung tài liệu */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2"
              onClick={() => setIsDocsOpen(!isDocsOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Bổ sung tài liệu</span>
              {isDocsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isDocsOpen && (
              <div className="py-3 px-1 space-y-2.5 text-[13px] animate-in fade-in duration-150">
                {isLoadingDocs ? (
                  <p className="text-gray-400 text-center py-2 text-[12px]">Đang tải tài liệu...</p>
                ) : documents.length === 0 ? (
                  <p className="text-gray-400 text-center py-2 text-[12px] italic">Không có yêu cầu tài liệu bổ sung.</p>
                ) : (
                  documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-[#FAFAFA] rounded-xl border border-gray-200/80 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-gray-900 block text-[13px]">{pickLocale(doc.label)}</span>
                        <span className="text-[11px] text-gray-400">{doc.status}</span>
                      </div>
                      {doc.status !== 'PENDING_SUBMISSION' && (
                        <button
                          type="button"
                          onClick={() => setReviewingDocKey(doc.key)}
                          className="text-blue-600 text-[12px] flex items-center gap-1 hover:text-blue-700"
                        >
                          <Eye size={12} /> Xem
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. Accordion: Đặt lịch hẹn phỏng vấn */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2 mb-2"
              onClick={() => setIsInterviewOpen(!isInterviewOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Đặt lịch hẹn phỏng vấn</span>
              {isInterviewOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isInterviewOpen && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <span className="text-[12px] font-bold text-gray-900 block mb-2">
                  Thông tin buổi phỏng vấn
                </span>

                {/* Khung thông tin buổi hẹn */}
                <div className="border border-gray-200 rounded-[18px] p-4 bg-white shadow-sm space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          application.user?.avatarUrl ||
                          'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100'
                        }
                        className="w-8 h-8 rounded-full object-cover"
                        alt={applicantName}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-gray-900">{applicantName}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {application.phone || (application as any).zalo || '09876543210'}
                        </span>
                      </div>
                    </div>

                    <div className="text-gray-300 px-2">
                      <span className="text-[12px]">─────────▶</span>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end">
                      <img
                        src={
                          application.pet?.avatarUrl ||
                          application.pet?.images?.[0]?.url ||
                          'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=150'
                        }
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Thú cưng"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[13px] text-gray-900">{application.pet?.name || 'Cún'}</span>
                          {isMale ? (
                            <Mars size={11} strokeWidth={2.5} className="text-[#3DB2FF]" />
                          ) : (
                            <Venus size={11} strokeWidth={2.5} className="text-[#FF6B93]" />
                          )}
                        </div>
                        <span className="text-[10px] text-gray-400">
                          {getPetInfoLabel(application.pet)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="w-full border-t border-dashed border-gray-200 my-2" />

                  {/* 2 Cột Form input */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Tiêu đề</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="VD: Hẹn phỏng vấn nhận nuôi Cún"
                        className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Hình thức</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleFormatChange('Online')}
                          className={`flex-1 py-2 rounded-[10px] text-[12px] font-medium transition-colors ${format === 'Online'
                            ? 'bg-[#5982E6] text-white shadow-sm'
                            : 'bg-[#F2F2F2] text-gray-600'
                            }`}
                        >
                          Online
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFormatChange('Offline')}
                          className={`flex-1 py-2 rounded-[10px] text-[12px] font-medium transition-colors ${format === 'Offline'
                            ? 'bg-[#5982E6] text-white shadow-sm'
                            : 'bg-[#F2F2F2] text-gray-600'
                            }`}
                        >
                          Offline
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] text-gray-500 block">
                          {format === 'Online' ? 'Đường link phỏng vấn (URL)' : 'Địa điểm gặp mặt'}
                        </label>
                        {format === 'Online' && (
                          <button
                            type="button"
                            disabled={isLoadingMeetLink}
                            onClick={fetchRealMeetLink}
                            className="text-[10px] text-[#5982E6] hover:underline flex items-center gap-0.5"
                            title="Tạo lại link Google Meet thật"
                          >
                            {isLoadingMeetLink ? <Loader2 size={10} className="animate-spin" /> : <RotateCw size={10} />}
                            Tạo link
                          </button>
                        )}
                      </div>
                      <div className="relative flex items-center">
                        {format === 'Online' ? (
                          <>
                            <input
                              type="text"
                              value={meetLink}
                              onChange={(e) => setMeetLink(e.target.value)}
                              placeholder="https://meet.google.com/xxx-yyyy-zzz"
                              className="w-full border border-gray-200 rounded-[10px] pl-3 pr-8 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858] truncate"
                            />
                            {meetLink && (
                              <a
                                href={meetLink.startsWith('http') ? meetLink : `https://${meetLink}`}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute right-2.5 p-1 text-gray-400 hover:text-[#5982E6] transition-colors"
                                title="Mở phòng họp trực tiếp"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
                          </>
                        ) : (
                          <input
                            type="text"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            placeholder="Nhập địa chỉ trạm..."
                            className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                          />
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] text-gray-500 mb-1 block">Ngày &amp; giờ hẹn</label>
                      <div className="relative">
                        <input
                          type="datetime-local"
                          min={toDatetimeLocalValue(new Date().toISOString())}
                          value={toDatetimeLocalValue(dateSlot)}
                          onChange={(e) => setDateSlot(e.target.value ? new Date(e.target.value).toISOString() : '')}
                          className="w-full border border-gray-200 rounded-[10px] pl-2.5 pr-8 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                        />
                        <Calendar
                          size={14}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section Phân công thành viên */}
                <div className="mt-4">
                  <span className="text-[13px] font-bold text-gray-900 block">Phân công thành viên</span>
                  <p className="text-[11px] text-gray-400 mb-2.5">
                    Chọn một thành viên phù hợp để phụ trách hoặc tham gia buổi phỏng vấn
                  </p>

                  <div className="border border-gray-200 rounded-[18px] p-4 bg-white space-y-2.5 shadow-sm">
                    {members.map((member) => (
                      <div key={member.id} className="space-y-2.5 pb-2.5 border-b border-gray-100 last:border-0 last:pb-0">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] text-gray-400 mb-1 block">Tên thành viên</label>
                            <input
                              type="text"
                              placeholder="Tên"
                              value={member.name}
                              onChange={(e) => handleMemberChange(member.id, 'name', e.target.value)}
                              className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] text-gray-400 mb-1 block">Nội dung cần lưu ý</label>
                            <input
                              type="text"
                              placeholder="Tùy chọn"
                              value={member.note}
                              onChange={(e) => handleMemberChange(member.id, 'note', e.target.value)}
                              className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-400 mb-1 block">
                            Email (để cấp quyền đồng tổ chức Google Meet)
                          </label>
                          <input
                            type="email"
                            placeholder="ten@gmail.com"
                            value={member.email}
                            onChange={(e) => handleMemberChange(member.id, 'email', e.target.value)}
                            className="w-full border border-gray-200 rounded-[10px] px-3 py-2 text-[12px] text-gray-900 outline-none focus:border-[#E59858]"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="text-[#E59858] hover:text-[#D68B4E] text-[12px] font-medium pt-1 block"
                    >
                      + Thêm thành viên
                    </button>
                  </div>
                </div>

                {/* 2 Nút Đổi lịch & Đã hoàn thành phỏng vấn */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDateSlot('')}
                    className="w-[100px] py-2.5 rounded-[12px] border border-gray-200 text-gray-700 text-[13px] font-medium hover:bg-gray-50 transition-colors shadow-sm"
                  >
                    Đổi lịch
                  </button>
                  <button
                    type="button"
                    onClick={() => handleScheduleSubmit(true)}
                    disabled={isSubmittingInterview}
                    className="flex-1 py-2.5 bg-[#E59858] hover:bg-[#D68B4E] text-white text-[13px] font-bold rounded-[12px] shadow-sm transition-colors disabled:opacity-60"
                  >
                    {isSubmittingInterview ? 'Đang lưu...' : 'Đã hoàn thành phỏng vấn'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Accordion: Ghi chú nội bộ */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2 mb-2"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Ghi chú nội bộ</span>
              {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isNotesOpen && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {notes.map((note) => (
                  <NoteItem key={note.id} note={note} />
                ))}

                <div className="relative">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Thêm ghi chú nội bộ... (gõ @ để nhắc tên)"
                    className="w-full bg-[#F6F6F6] rounded-[20px] pl-4 pr-11 py-3 text-[12px] text-gray-800 placeholder-gray-400 outline-none border border-transparent focus:border-[#E59858] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={isSubmittingNote || !noteInput.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E59858] hover:text-[#D68B4E] disabled:opacity-40 transition-colors"
                  >
                    <Send size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* 5. Hoàn tất nhận nuôi — chỉ hiện khi đơn đã ở trạng thái APPROVED */}
        {application.status === 'APPROVED' && (
          <div className="border-t border-gray-100 pt-4">
            <div className="rounded-[16px] border border-[#D1F2D9] bg-[#F2FCF5] p-4 flex flex-col gap-3">
              <div className="flex items-start gap-2.5">
                <PartyPopper size={18} className="text-[#1B8A44] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[13px] text-[#1B8A44] block">
                    Đơn đã được duyệt
                  </span>
                  <span className="text-[12px] text-gray-600">
                    Khi {application.pet?.name || 'thú cưng'} đã được bàn giao thực tế cho{' '}
                    {applicantName}, hãy xác nhận để hoàn tất hồ sơ. Hệ thống sẽ chuyển quyền
                    sở hữu thú cưng và lưu vào lịch sử nhận nuôi.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCompleteAdoption}
                disabled={isCompletingAdoption || !onCompleteAdoption}
                className="w-full py-2.5 bg-[#1B8A44] hover:bg-[#166E37] text-white text-[13px] font-bold rounded-[12px] shadow-sm transition-colors disabled:opacity-60"
              >
                {isCompletingAdoption ? 'Đang xử lý...' : 'Xác nhận đã bàn giao — Hoàn tất nhận nuôi'}
              </button>
            </div>
          </div>
        )}
        {/* Nút to dưới cùng */}
        <div className="p-5 pt-3 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={handleAdvance}
            className="w-full bg-[#F0BA8A] hover:bg-[#E59858] transition-colors text-white font-bold text-[14px] py-3.5 rounded-[16px] shadow-sm tracking-wide cursor-pointer"
          >
            Bước tiếp theo
          </button>
        </div>

      </div>
      {reviewingDoc && (
        <DocumentReviewModal
          document={{
            ...reviewingDoc,
            submittedAt: reviewingDoc.submittedAt || application.updatedAt || application.createdAt,
          }}
          onClose={() => setReviewingDocKey(null)}
          readOnly
        />
      )}
    </div>
  );
};