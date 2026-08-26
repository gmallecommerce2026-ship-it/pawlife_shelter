// src/modules/shelter/applications/components/MoveToPendingModal.tsx

'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Phone,
  Mail,
  Download,
  ChevronDown,
  Send,
  Check,
  Mars,
  Venus,
  FileText,
  ChevronRight,
} from 'lucide-react';
import {
  AdoptionApplication,
  ApplicationTag,
  ApplicationNote,
  COMMITMENTS_CONFIG,
} from '@/types/application';
import { applicationService } from '@/services/applicationService';
import { formatBreed, MaybeBilingual } from '@/utils/bilingualField';
import { SelectTagsModal } from './SelectTagsModal';
import { downloadApplicationPdf } from '@/utils/exportApplicationPdf';
import { formatPetAge } from '@/utils/petAge';

// ============================================================================
// 1. CÁC HÀM TIỆN ÍCH DỊCH THUẬT SANG TIẾNG VIỆT
// ============================================================================
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

export const isCommitmentAgreed = (val: unknown): boolean => {
  if (val === true || val === 1) return true;
  if (typeof val === 'string') {
    const clean = val.trim().toLowerCase();
    return ['có', 'co', 'yes', 'true', 'đồng ý', 'dong y', '1'].includes(clean);
  }
  return false;
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

const normalizeTags = (rawTags: any[]): ApplicationTag[] => {
  if (!Array.isArray(rawTags)) return [];
  return rawTags
    .map((item: any) => {
      if (!item) return null;
      if (typeof item === 'string') return { id: item, name: item };
      if (item.tag && typeof item.tag === 'object') {
        return {
          id: item.tag.id || item.tagId || item.id || String(Date.now()),
          name: item.tag.name || item.name || '',
          color: item.tag.color || item.color,
        };
      }
      return {
        id: item.id || item.tagId || String(Date.now()),
        name: item.name || '',
        color: item.color,
      };
    })
    .filter((t): t is ApplicationTag => Boolean(t && t.name && t.name.trim() !== ''));
};

// ============================================================================
// 2. SUB-COMPONENTS
// ============================================================================
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

interface CommitmentItemProps {
  label: string;
  isCommitted?: boolean;
}

export const CommitmentItem: React.FC<CommitmentItemProps> = ({
  label,
  isCommitted = false,
}) => {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {isCommitted ? (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-emerald-600">
          <Check className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      ) : (
        <span className="flex h-5 w-5 shrink-0 items-center justify-center text-rose-600">
          <X className="h-3.5 w-3.5 stroke-[2.5]" />
        </span>
      )}
      <span className={isCommitted ? 'text-gray-800 font-medium' : 'text-gray-500'}>
        {label}
      </span>
    </div>
  );
};

// ============================================================================
// 3. MAIN MODAL COMPONENT
// ============================================================================
interface MoveToPendingModalProps {
  application: AdoptionApplication;
  onClose: () => void;
  onSubmit: (data: any) => void;
  onRefresh?: () => void;
}

export const MoveToPendingModal: React.FC<MoveToPendingModalProps> = ({
  application,
  onClose,
  onSubmit,
  onRefresh,
}) => {
  const [isAppOpen, setIsAppOpen] = useState(false);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [tags, setTags] = useState<ApplicationTag[]>(() => normalizeTags(application.tags || []));
  const addTagBtnRef = useRef<HTMLButtonElement>(null);
  const [notes, setNotes] = useState<ApplicationNote[]>(application.notes || []);
  const [noteInput, setNoteInput] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);

  const isMale = application.pet?.gender !== 'FEMALE';
  const petName = application.pet?.name || 'Bé';
  const applicantFullName = application.fullName || application.user?.name || 'Người đăng ký';
  const applicantFirstName = applicantFullName.split(' ')[0] || 'Người đăng ký';
  const petBreedFormatted = formatBreed(application.pet?.breed as MaybeBilingual) || 'Giống lai';
  const petAgeFormatted = formatPetAge(application.pet?.dob);

  const [isTagModalOpen, setIsTagModalOpen] = useState(false);

  const handleAddTagWithColor = async (tagData: { name: string; color: string }) => {
    const tagName = tagData.name.trim();
    if (!tagName) return;

    const tempTag: ApplicationTag = {
      id: `temp-${Date.now()}`,
      name: tagName,
      color: tagData.color,
    };

    setTags((prev) => {
      const isExist = prev.some((t) => t.name.toLowerCase() === tagName.toLowerCase());
      if (isExist) return prev;
      return [...prev, tempTag];
    });

    try {
      const response = await applicationService.addTag(application.id, { name: tagName, color: tagData.color });
      const resData = response?.data?.data || response?.data || response;
      const tagObj = resData?.tag || resData;
      const realTagId = tagObj?.id || resData?.tagId;

      if (realTagId) {
        setTags((prev) =>
          prev.map((t) => (t.id === tempTag.id ? { ...t, id: String(realTagId), color: tagObj?.color || tagData.color } : t))
        );
      }
      onRefresh?.();
    } catch (error) {
      setTags((prev) => prev.filter((t) => t.id !== tempTag.id));
    }
  };

  const handleRemoveTagByName = async (tagName: string) => {
    const target = tags.find((t) => t.name.toLowerCase() === tagName.toLowerCase());
    if (target) handleRemoveTag(target.id);
  };

  useEffect(() => {
    setNotes(application.notes || []);
    setTags(normalizeTags(application.tags || []));
  }, [application.id]);

  const handleRemoveTag = async (tagId: string) => {
    const prevTags = [...tags];
    setTags((prev) => prev.filter((t) => t.id !== tagId));
    try {
      await applicationService.removeTag(application.id, tagId);
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi xóa thẻ:', error);
      setTags(prevTags);
    }
  };

  const handleAddNote = async () => {
    const content = noteInput.trim();
    if (!content || isSubmittingNote) return;

    const tempNote: ApplicationNote = {
      id: `temp-${Date.now()}`,
      authorId: 'current-user',
      authorName: 'Nhân viên trạm',
      authorAvatar:
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100',
      content,
      createdAt: 'Vừa xong',
    };

    setNotes((prev) => [tempNote, ...prev]);
    setNoteInput('');
    setIsSubmittingNote(true);

    try {
      const response = await applicationService.addNote(application.id, content);
      const addedNote = response?.data || response;
      if (addedNote?.id) {
        setNotes((prev) =>
          prev.map((n) =>
            n.id === tempNote.id
              ? {
                ...n,
                id: addedNote.id,
                authorName: addedNote.author?.name || n.authorName,
                authorAvatar: addedNote.author?.avatarUrl || n.authorAvatar,
              }
              : n
          )
        );
      }
      onRefresh?.();
    } catch (error) {
      console.error('Lỗi khi thêm ghi chú:', error);
      setNotes((prev) => prev.filter((n) => n.id !== tempNote.id));
    } finally {
      setIsSubmittingNote(false);
    }
  };

  const handleSubmit = () => {
    onSubmit({
      reviewNote: noteInput || 'Đã chuyển sang Đang xem xét',
      tags,
      notes,
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[440px] max-h-[90vh] rounded-[24px] shadow-2xl flex flex-col overflow-hidden relative animate-in fade-in zoom-in-95 duration-200 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 transition-colors p-1 bg-transparent hover:bg-gray-50 rounded-full z-10 cursor-pointer"
        >
          <X size={18} strokeWidth={2} />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-5">
            <div className="relative w-[94px] h-[94px] rounded-full border-[2.5px] border-[#F3A571] p-[2px] shrink-0">
              <img
                src={
                  application.user?.avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200'
                }
                className="w-full h-full rounded-full object-cover"
                alt={applicantFullName}
              />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-start">
              <h2 className="text-[18px] font-bold text-gray-900 leading-tight mb-2 truncate">
                {applicantFullName}
              </h2>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Phone size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.phone || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-1.5">
                <Mail size={13} className="text-gray-400 shrink-0" strokeWidth={2} />
                <span className="text-[13px] text-gray-500 font-normal truncate">
                  {application.user?.email || application.zalo || 'Chưa cập nhật'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <FileText size={13} className="text-gray-400 shrink-0" strokeWidth={1.8} />
                <span className="text-[13px] text-gray-500 font-normal">Đang xin nhận nuôi</span>
              </div>
              <div className="flex items-center gap-2.5 mt-0.5">
                <img
                  src={
                    application.pet?.avatarUrl ||
                    application.pet?.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1552053831-71594a27632d?q=80&w=100'
                  }
                  className="w-10 h-10 rounded-[10px] object-cover shrink-0 border border-gray-100"
                  alt={petName}
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[14px] text-gray-900 leading-none">
                      {petName}
                    </span>
                    {isMale ? (
                      <Mars size={13} strokeWidth={2.5} className="text-[#3DB2FF]" />
                    ) : (
                      <Venus size={13} strokeWidth={2.5} className="text-[#FF6B93]" />
                    )}
                  </div>
                  <span className="text-[11.5px] text-gray-400 mt-0.5 truncate leading-none">
                    {petAgeFormatted} • {petBreedFormatted}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tải PDF */}
          <div className="border border-gray-200 rounded-[16px] p-3.5 px-4 flex items-center justify-between bg-white hover:bg-gray-50/50 transition-colors mb-6 shadow-xs">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[#FFF8F3] border border-[#FFE8D6] flex items-center justify-center shrink-0">
                <FileText size={18} className="text-[#F3A571]" strokeWidth={1.8} />
              </div>
              <span className="text-[13.5px] font-semibold text-gray-900 truncate">
                {applicantFirstName} - Don_nhan_nuoi.pdf
              </span>
            </div>
            <button
              type="button"
              onClick={() => downloadApplicationPdf(application)}
              title="Tải đơn nhận nuôi (PDF)"
              className="text-gray-400 hover:text-[#E89B5A] transition-colors p-1 cursor-pointer"
            >
              <Download size={17} strokeWidth={2} />
            </button>
          </div>

          {/* Tags */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="font-bold text-[15px] text-gray-900">Gắn thẻ</h3>
              <div className="relative">
                <button
                  ref={addTagBtnRef}
                  type="button"
                  onClick={() => setIsTagModalOpen((v) => !v)}
                  className="text-[13px] font-semibold text-[#E89B5A] hover:text-[#D68B4E] transition-colors cursor-pointer"
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
            <div className="flex flex-wrap gap-2">
              {tags.length === 0 ? (
                <span className="text-[12px] text-gray-400 italic">Chưa có thẻ nào</span>
              ) : (
                tags.map((tag) => {
                  const tagColor = tag.color || '#5982E6';
                  return (
                    <span
                      key={tag.id}
                      className="px-3 py-1 text-[11.5px] font-semibold rounded-full flex items-center gap-1.5 border transition-all"
                      style={{
                        backgroundColor: `${tagColor}15`,
                        borderColor: `${tagColor}40`,
                        color: tagColor,
                      }}
                    >
                      {tag.name}
                      <X
                        size={12}
                        onClick={() => handleRemoveTag(tag.id)}
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                      />
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Accordion Chi tiết đơn nhận nuôi */}
          <div className="mb-5">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsAppOpen(!isAppOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Chi tiết đơn nhận nuôi</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isAppOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>
            {isAppOpen && (
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

                {/* Section C: 6 cam kết song song */}
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

          {/* Ghi chú */}
          <div className="mb-6">
            <div
              className="flex items-center justify-between cursor-pointer select-none py-1"
              onClick={() => setIsNotesOpen(!isNotesOpen)}
            >
              <h3 className="font-bold text-[15px] text-gray-900">Ghi chú</h3>
              <ChevronDown
                size={18}
                className={`text-gray-400 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`}
                strokeWidth={2}
              />
            </div>
            {isNotesOpen && (
              <div className="flex flex-col gap-3 mt-3 animate-in fade-in duration-200">
                {notes.map((note) => (
                  <div key={note.id} className="flex gap-2.5 items-start">
                    <img
                      src={
                        note.authorAvatar ||
                        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=100'
                      }
                      className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                      alt="Nhân viên"
                    />
                    <div className="flex flex-col flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[12px] text-gray-900">
                          {note.authorName || 'Nhân viên trạm'}
                        </span>
                        <span className="text-[10px] text-gray-400">{note.createdAt}</span>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-0.5">{note.content}</p>
                    </div>
                  </div>
                ))}
                <div className="relative w-full mt-1">
                  <input
                    type="text"
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                    placeholder="Thêm ghi chú... (gõ Enter để gửi)"
                    className="w-full bg-[#F6F6F6] rounded-[12px] pl-3.5 pr-9 py-2.5 text-[12.5px] outline-none placeholder-gray-400 border border-transparent focus:border-[#F3A571]"
                  />
                  <button
                    type="button"
                    onClick={handleAddNote}
                    disabled={isSubmittingNote}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F3A571] hover:text-[#E89B5A] disabled:opacity-50"
                  >
                    <Send size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Nút hành động */}
          <div className="mt-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="w-full bg-[#F3A571] hover:bg-[#E89B5A] active:scale-[0.99] transition-all text-white font-semibold text-[14.5px] py-3.5 px-6 rounded-[16px] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>Chuyển sang đang xem xét</span>
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveToPendingModal;