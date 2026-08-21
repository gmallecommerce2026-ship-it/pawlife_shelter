// src/app/shelter/applications/components/ApproveApplicationModal.tsx
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { AdoptionApplication, ApplicationNote } from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { apiClient } from '@/lib/api/ApiClient';

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
  status: 'PENDING_SUBMISSION' | 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED';
  fileUrl?: string | null;
  fileName?: string | null;
  rejectionReason?: string | null;
  submittedAt?: string | null;
}

interface TagItem {
  id: string;
  name: string;
}

interface ApproveApplicationModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: { applicationId: string; reviewNote?: string; notes?: ApplicationNote[] }) => void;
  onScheduleInterview: (applicationId: string, data: any) => Promise<any>;
  onRefresh?: () => void;
}

const createEmptyMember = (): InterviewMember => ({
  id: crypto.randomUUID(),
  name: '',
  email: '',
  note: '',
});

// Chuyển đổi an toàn đa ngôn ngữ { en, vi }
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

// Chuyển ISO / Date sang YYYY-MM-DDTHH:mm theo giờ local
const toDatetimeLocalValue = (dateOrIso?: string | Date | null) => {
  if (!dateOrIso) return '';
  const d = typeof dateOrIso === 'string' ? new Date(dateOrIso) : dateOrIso;
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

// Format thời gian tương đối
const formatTimeAgo = (dateStr?: string | Date) => {
  if (!dateStr) return 'Vừa xong';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return typeof dateStr === 'string' ? dateStr : 'Vừa xong';
  const now = new Date();
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
};

// Parse members an toàn từ Array hoặc chuỗi JSON
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
}) => {
  const existingAppointment = (application as any)?.appointment;

  // Accordion Toggles
  const [isAppDetailsOpen, setIsAppDetailsOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  const [isInterviewOpen, setIsInterviewOpen] = useState(true);
  const [isNotesOpen, setIsNotesOpen] = useState(true);

  // 👉 ĐỒNG BỘ 1:1 VỚI INTERVIEW MODAL
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

  // Tags State
  const [tags, setTags] = useState<TagItem[]>(() => {
    const rawTags = (application as any).tags || [];
    return rawTags.map((t: any) => (t.tag ? t.tag : typeof t === 'string' ? { id: t, name: t } : t));
  });
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // Documents State
  const [documents, setDocuments] = useState<ApplicationDocumentItem[]>(
    (application as any).documents || []
  );
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Notes State
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [isSubmittingInterview, setIsSubmittingInterview] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';

  // 👉 HÀM GỌI API LẤY LINK GOOGLE MEET THẬT
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

  // 👉 TỰ ĐỘNG ĐỔ VÀ ĐỒNG BỘ MỌI DỮ LIỆU KHI APPLICATION THAY ĐỔI
  const appointmentKey = JSON.stringify((application as any)?.appointment ?? null);

  useEffect(() => {
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

    if ((application as any).documents) {
      setDocuments((application as any).documents);
    } else {
      fetchDocuments();
    }
  }, [application.id, appointmentKey]);

  const fetchDocuments = async () => {
    try {
      setIsLoadingDocs(true);
      const res = await applicationService.getApplicationDocuments(application.id);
      setDocuments(res.data || res || []);
    } catch (err) {
      console.error('Lỗi tải tài liệu:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  // Thông tin nhân sự đại diện hiển thị trên thanh mũi tên
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

  // 1. Quản lý Tags
  const handleAddTag = async () => {
    if (!newTagName.trim()) {
      setIsAddingTag(false);
      return;
    }
    try {
      const tagName = newTagName.trim();
      const res = await applicationService.addTagToApplication(application.id, undefined, tagName);
      const createdTag = res.data?.tag || res?.tag || { id: Date.now().toString(), name: tagName };
      setTags((prev) => [...prev, createdTag]);
      setNewTagName('');
      setIsAddingTag(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi thêm tag:', err);
    }
  };

  const handleRemoveTag = async (tagId: string) => {
    try {
      await applicationService.removeTagFromApplication(application.id, tagId);
      setTags((prev) => prev.filter((t) => t.id !== tagId));
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error('Lỗi xoá tag:', err);
    }
  };

  // 2. Quản lý Members
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

  // 3. Xử lý lưu lịch hẹn / Hoàn thành phỏng vấn
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
        email: m.email?.trim() || undefined, // tránh gửi '' làm fail @IsEmail() ở backend
        note: m.note?.trim() || undefined,
      })),
      reminderMinutesBefore: 10,
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

  // 4. Thêm Internal Note
  const handleAddNote = async () => {
    if (!noteInput.trim() || isSubmittingNote) return;
    setIsSubmittingNote(true);
    try {
      const response = await applicationService.addNote(application.id, noteInput.trim());
      const addedNote = response?.data || response;

      const newNoteObj: ApplicationNote = {
        id: addedNote?.id || Date.now().toString(),
        authorId: addedNote?.authorId || 'current-user',
        authorName: addedNote?.author?.name || addedNote?.author?.fullName || 'Staff Member',
        authorAvatar: addedNote?.author?.avatarUrl || primaryStaffAvatar,
        content: addedNote?.content || noteInput.trim(),
        createdAt: new Date().toISOString(),
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

  // 5. Chuyển trạng thái đơn (Move to Pending)
  const handleAdvance = () => {
    onSubmit({
      applicationId: application.id,
      reviewNote: 'Đã hoàn thành phỏng vấn và chuyển tiếp hồ sơ.',
      notes,
    });
  };

  const applicantName = application.fullName || application.user?.name || 'Julia Nguyen';
  const firstName = applicantName.split(' ')[0] || 'Julia';

  return (
    <div
      className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-3 sm:p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[490px] max-h-[92vh] rounded-[28px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Nút đóng X */}
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
                onClick={() => window.print()}
                className="flex items-center gap-1.5 text-gray-700 hover:text-[#E59858] text-[13px] transition-colors mb-3"
              >
                <Download size={13} className="text-gray-500 shrink-0" />
                <span>
                  Download <span className="font-bold underline">{firstName} - Application.pdf</span>
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
                  alt={application.pet?.name || 'Luna'}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="font-bold text-[14px] text-gray-900 truncate">
                      {application.pet?.name || 'Luna'}
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
              <span className="text-[16px] font-bold text-gray-900">Tags</span>
              <button
                type="button"
                onClick={() => setIsAddingTag(true)}
                className="text-gray-400 hover:text-gray-600 text-[13px] font-medium transition-colors"
              >
                + tag
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {tags.map((tag) => {
                const isBlueTag = tag.name.toLowerCase().includes('follow');
                return (
                  <span
                    key={tag.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium transition-all ${isBlueTag
                      ? 'bg-[#EBF3FE] text-[#4A86E8]'
                      : 'bg-[#F4F4F5] text-gray-600'
                      }`}
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

              {isAddingTag && (
                <div className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-full px-2 py-0.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Tên tag..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTag();
                      if (e.key === 'Escape') setIsAddingTag(false);
                    }}
                    onBlur={handleAddTag}
                    className="text-[12px] bg-transparent outline-none w-20 px-1 text-gray-800"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 1. Accordion: Application Details */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2"
              onClick={() => setIsAppDetailsOpen(!isAppDetailsOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Application Details</span>
              {isAppDetailsOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isAppDetailsOpen && (
              <div className="py-3 px-1 space-y-3 text-[13px] text-gray-700 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3 bg-[#FAFAFA] p-3.5 rounded-xl border border-gray-100">
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase">Nhận nuôi cho</span>
                    <span className="font-semibold">{pickLocale((application as any).adoptFor) || 'Bản thân'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase">Địa chỉ</span>
                    <span className="font-semibold">{pickLocale((application as any).location) || 'Chưa cung cấp'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase">Nhà ở</span>
                    <span className="font-semibold">{pickLocale((application as any).housing) || 'Chung cư'}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 block text-[11px] uppercase">Kinh nghiệm</span>
                    <span className="font-semibold">{pickLocale((application as any).petExperience) || 'Đã từng nuôi'}</span>
                  </div>
                </div>
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
                      {doc.fileUrl && (
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 text-[12px] flex items-center gap-1">
                          <Eye size={12} /> Xem
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* 3. Accordion: Đặt lịch hẹn phỏng vấn (TỰ ĐỘNG ĐỔ ĐỦ 100% NHƯ INTERVIEW MODAL) */}
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

                {/* Box Khung viền thông tin buổi hẹn */}
                <div className="border border-gray-200 rounded-[18px] p-4 bg-white shadow-sm space-y-3.5">
                  {/* Top Bar: Maria Garcia -------------> Luna ♂ */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={primaryStaffAvatar}
                        className="w-8 h-8 rounded-full object-cover"
                        alt="Staff"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-[13px] text-gray-900">{primaryStaffName}</span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Phone size={10} /> {primaryStaffPhone}
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
                        alt="Pet"
                      />
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-[13px] text-gray-900">{application.pet?.name || 'Luna'}</span>
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
                        placeholder="VD: Hẹn phỏng vấn nhận nuôi Luna"
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
                              placeholder="Optional"
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

          {/* 4. Accordion: Internal Notes */}
          <div className="border-t border-gray-100 pt-3">
            <button
              type="button"
              className="w-full flex justify-between items-center py-2 mb-2"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <span className="text-[16px] font-bold text-gray-900">Internal Notes</span>
              {isNotesOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
            </button>

            {isNotesOpen && (
              <div className="space-y-3 animate-in fade-in duration-150">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-2.5 items-start">
                    <img
                      src={note.authorAvatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100'}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
                      alt="Staff"
                    />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[13px] text-gray-900">
                          {note.authorName || 'Staff Member'}
                        </span>
                        <span className="text-[11px] text-gray-400">{formatTimeAgo(note.createdAt)}</span>
                      </div>
                      <p className="text-[13px] text-gray-600 leading-snug">
                        {note.content}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Input Add note */}
                <div className="relative mt-2">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Add note... (type @ to mention a member)"
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

        {/* Nút to dưới cùng: bước tiếp theo */}
        <div className="p-5 pt-3 border-t border-gray-100 bg-white">
          <button
            type="button"
            onClick={handleAdvance}
            className="w-full bg-[#F0BA8A] hover:bg-[#E59858] transition-colors text-white font-bold text-[14px] py-3.5 rounded-[16px] shadow-sm tracking-wide"
          >
            Bước tiếp theo
          </button>
        </div>
      </div>
    </div>
  );
};